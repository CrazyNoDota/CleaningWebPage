import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cleaner, UserRole, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type Locale, pickLocalized } from '../common/locale';
import type { CreateCleanerDto } from './dto/create-cleaner.dto';
import type { UpdateCleanerDto } from './dto/update-cleaner.dto';

@Injectable()
export class CleanersService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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
  }

  // ── public-side (existing) ──────────────────────────────────────

  async getPublicProfile(id: string, locale: Locale) {
    const cleaner = await this.prisma.cleaner.findUnique({
      where: { id },
      include: { user: true },
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
    if (order.userId && order.userId !== requestingUserId) {
      throw new NotFoundException(`order "${orderId}" not found`);
    }
    if (!order.cleaner) {
      return { status: order.status, cleaner: null };
    }
    return {
      status: order.status,
      cleaner: this.projectPublic(order.cleaner, locale),
    };
  }

  private projectPublic(
    c: NonNullable<Awaited<ReturnType<PrismaService['cleaner']['findUnique']>>> & {
      user: NonNullable<Awaited<ReturnType<PrismaService['user']['findUnique']>>>;
    },
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

function shortenName(full: string | null): string {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  const initial = rest[0]?.charAt(0).toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}
