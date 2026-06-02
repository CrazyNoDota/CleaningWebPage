import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type Locale, pickLocalized } from '../common/locale';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(opts: { citySlug?: string; locale: Locale }) {
    const services = await this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(opts.citySlug ? { OR: [{ cityId: null }, { city: { slug: opts.citySlug } }] } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return services.map((s) => this.projectService(s, opts.locale));
  }

  async getServiceBySlug(slug: string, locale: Locale) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!service || !service.isActive) {
      throw new NotFoundException(`service "${slug}" not found`);
    }
    return this.projectService(service, locale);
  }

  /**
   * Returns the raw service row + options. Used by the pricing engine and order
   * service — they need the unprojected data and the pricingExpr JSON.
   */
  async getServiceRawBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        options: { where: { isActive: true } },
      },
    });
    if (!service || !service.isActive) {
      throw new NotFoundException(`service "${slug}" not found`);
    }
    return service;
  }

  private projectService(
    s: Awaited<ReturnType<PrismaService['service']['findFirstOrThrow']>> & {
      options: Awaited<ReturnType<PrismaService['serviceOption']['findMany']>>;
    },
    locale: Locale,
  ) {
    return {
      id: s.id,
      slug: s.slug,
      type: s.type,
      name: pickLocalized(s, 'name', locale),
      description: pickLocalized(s, 'desc', locale),
      photoUrl: s.photoUrl ?? null,
      basePrice: s.basePrice,
      currency: s.currency,
      options: s.options.map((o) => ({
        id: o.id,
        key: o.key,
        label: pickLocalized(o, 'label', locale),
        priceDelta: o.priceDelta,
        inputType: o.inputType,
      })),
    };
  }
}
