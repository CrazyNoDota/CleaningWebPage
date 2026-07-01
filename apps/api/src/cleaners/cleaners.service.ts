import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cleaner, OrderStatus, UserRole, VerificationStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { TokenService } from '../auth/token.service';
import { type Locale, pickLocalized } from '../common/locale';
import type { CreateCleanerDto } from './dto/create-cleaner.dto';
import type { UpdateCleanerDto } from './dto/update-cleaner.dto';

@Injectable()
export class CleanersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Issues a fresh Telegram onboarding link for a cleaner. The code is embedded
   * in a t.me deep-link; opening it sends `/start <code>` to the bot, which links
   * the chat. Regenerating invalidates any previously issued link.
   */
  async generateTelegramLink(cleanerId: string) {
    const cleaner = await this.prisma.cleaner.findUnique({
      where: { id: cleanerId },
      select: { id: true },
    });
    if (!cleaner) throw new NotFoundException(`cleaner "${cleanerId}" not found`);

    const code = randomBytes(12).toString('base64url');
    await this.prisma.cleaner.update({
      where: { id: cleanerId },
      data: { tgLinkCode: code },
    });
    return {
      code,
      deepLink: this.telegram.buildDeepLink(code),
      botUsername: this.telegram.botUsername,
    };
  }

  // ── admin-side ──────────────────────────────────────────────────

  async adminCreate(dto: CreateCleanerDto): Promise<Cleaner> {
    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { phone: dto.phone } });
      let userId: string;
      if (existingUser) {
        if (existingUser.role !== UserRole.cleaner && existingUser.role !== UserRole.client) {
          throw new BadRequestException(
            `user with phone ${dto.phone} already has role "${existingUser.role}"`,
          );
        }
        const dup = await tx.cleaner.findUnique({ where: { userId: existingUser.id } });
        if (dup) {
          throw new ConflictException('this user already has a cleaner profile');
        }
        await tx.user.update({
          where: { id: existingUser.id },
          data: { role: UserRole.cleaner, name: dto.name ?? existingUser.name },
        });
        userId = existingUser.id;
      } else {
        const newUser = await tx.user.create({
          data: { phone: dto.phone, name: dto.name, role: UserRole.cleaner },
        });
        userId = newUser.id;
      }
      return tx.cleaner.create({
        data: {
          userId,
          bioRu: dto.bioRu ?? '',
          bioKk: dto.bioKk ?? '',
          bioEn: dto.bioEn ?? '',
          yearsOfExperience: dto.yearsOfExperience ?? 0,
          languages: dto.languages ?? [],
          specialization: dto.specialization ?? [],
          photoUrl: dto.photoUrl,
        },
      });
    });
  }

  async adminList(opts: {
    take: number;
    skip: number;
    isActive?: boolean;
    verificationStatus?: VerificationStatus;
  }) {
    return this.prisma.cleaner.findMany({
      where: {
        ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
        ...(opts.verificationStatus
          ? { verificationStatus: opts.verificationStatus }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: opts.take,
      skip: opts.skip,
      include: { user: { select: { phone: true, name: true, email: true } } },
    });
  }

  async adminGet(id: string) {
    const c = await this.prisma.cleaner.findUnique({
      where: { id },
      include: { user: { select: { phone: true, name: true, email: true } } },
    });
    if (!c) throw new NotFoundException(`cleaner "${id}" not found`);
    return c;
  }

  async adminUpdate(id: string, dto: UpdateCleanerDto): Promise<Cleaner> {
    const existing = await this.prisma.cleaner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`cleaner "${id}" not found`);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.name) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { name: dto.name },
        });
      }

      const data: Record<string, unknown> = {};
      for (const k of [
        'bioRu',
        'bioKk',
        'bioEn',
        'yearsOfExperience',
        'languages',
        'specialization',
        'photoUrl',
        'isActive',
      ] as const) {
        if (dto[k] !== undefined) data[k] = dto[k];
      }
      if (dto.verificationStatus !== undefined) {
        data.verificationStatus = dto.verificationStatus;
        data.verifiedAt =
          dto.verificationStatus === VerificationStatus.verified ? new Date() : null;
      }

      return tx.cleaner.update({ where: { id }, data });
    });

    // Deactivating a cleaner cuts off their session: revoke the user's refresh
    // tokens so the disabled account cannot mint new access tokens.
    if (dto.isActive === false) {
      await this.tokens.revokeAllForUser(existing.userId);
    }

    return updated;
  }

  // ── public-side (existing) ──────────────────────────────────────

  async listPublic(opts: { take: number; skip: number; locale: Locale }) {
    const cleaners = await this.prisma.cleaner.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
      orderBy: [
        { ratingAvg: 'desc' },
        { ratingCount: 'desc' },
        { completedOrdersCount: 'desc' },
      ],
      take: opts.take,
      skip: opts.skip,
    });
    return cleaners.map((c) => this.projectPublic(c, opts.locale));
  }

  async getPublicProfile(id: string, locale: Locale) {
    const cleaner = await this.prisma.cleaner.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!cleaner || !cleaner.isActive) {
      throw new NotFoundException(`cleaner "${id}" not found`);
    }
    return this.projectPublic(cleaner, locale);
  }

  async getOrderCleaner(orderId: string, requestingUserId: string, locale: Locale) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { cleaner: { include: { user: true } } },
    });
    if (!order) {
      throw new NotFoundException(`order "${orderId}" not found`);
    }
    // Strict ownership: guest orders (userId === null) are never accessible via
    // this authenticated endpoint. Matches OrdersService.requireOwnedOrder and
    // prevents leaking the assigned cleaner's phone on guest orders.
    if (order.userId !== requestingUserId) {
      throw new NotFoundException(`order "${orderId}" not found`);
    }
    if (!order.cleaner) {
      return { status: order.status, cleaner: null };
    }
    // Expose the cleaner's phone only while the order is active, so the customer
    // can call them. Hidden before assignment and after the job is done/cancelled.
    const phone = CALLABLE_STATUSES.has(order.status)
      ? order.cleaner.user.phone
      : null;
    return {
      status: order.status,
      cleaner: { ...this.projectPublic(order.cleaner, locale), phone },
    };
  }

  private projectPublic(
    c: Cleaner & { user: { name: string | null } },
    locale: Locale,
  ) {
    return {
      id: c.id,
      displayName: shortenName(c.user.name),
      photoUrl: c.photoUrl,
      bio: pickLocalized(c, 'bio', locale),
      yearsOfExperience: c.yearsOfExperience,
      languages: c.languages,
      specialization: c.specialization,
      ratingAvg: c.ratingAvg,
      ratingCount: c.ratingCount,
      completedOrdersCount: c.completedOrdersCount,
      verified: c.verificationStatus === 'verified',
    };
  }
}

// Statuses during which the assigned cleaner's phone is shared with the customer.
const CALLABLE_STATUSES = new Set<OrderStatus>([
  OrderStatus.assigned,
  OrderStatus.en_route,
  OrderStatus.in_progress,
]);

function shortenName(full: string | null): string {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  const initial = rest[0]?.charAt(0).toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}
