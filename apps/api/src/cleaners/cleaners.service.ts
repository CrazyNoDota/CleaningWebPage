import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type Locale, pickLocalized } from '../common/locale';

@Injectable()
export class CleanersService {
  constructor(private readonly prisma: PrismaService) {}

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
