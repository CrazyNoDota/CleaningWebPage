import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAddressDto } from './dto/create-address.dto';
import type { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const cityId = await this.requireCityId(dto.city);
    return this.prisma.address.create({
      data: {
        userId,
        cityId,
        label: dto.label,
        street: dto.street,
        building: dto.building,
        apartment: dto.apartment,
        comment: dto.comment,
        lat: dto.lat,
        lng: dto.lng,
      },
    });
  }

  async list(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(userId: string, id: string): Promise<Address> {
    return this.requireOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<Address> {
    await this.requireOwned(userId, id);
    const data: Record<string, unknown> = { ...dto };
    delete data.city;
    if (dto.city !== undefined) {
      data.cityId = await this.requireCityId(dto.city);
    }
    return this.prisma.address.update({ where: { id }, data });
  }

  async softDelete(userId: string, id: string): Promise<{ id: string; deletedAt: Date }> {
    await this.requireOwned(userId, id);
    const updated = await this.prisma.address.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
    // deletedAt is non-null after the update — narrow it.
    return { id: updated.id, deletedAt: updated.deletedAt as Date };
  }

  // ── private ───────────────────────────────────────────────────────

  private async requireOwned(userId: string, id: string): Promise<Address> {
    const a = await this.prisma.address.findUnique({ where: { id } });
    if (!a || a.deletedAt || a.userId !== userId) {
      // Same body whether missing, deleted, or owned by someone else — no info leak.
      throw new NotFoundException(`address "${id}" not found`);
    }
    return a;
  }

  private async requireCityId(slug: string): Promise<string> {
    const city = await this.prisma.city.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });
    if (!city || !city.isActive) {
      throw new BadRequestException(`unknown or inactive city "${slug}"`);
    }
    return city.id;
  }
}
