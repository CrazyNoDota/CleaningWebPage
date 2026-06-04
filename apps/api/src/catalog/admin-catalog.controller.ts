import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ServiceType, Prisma } from '@prisma/client';
import type { Request } from 'express';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';

// A new service starts with the simplest valid pricing formula: just the base
// price. Admins can layer area/room/option terms later via the pricing engine.
const DEFAULT_PRICING_EXPR: Prisma.InputJsonValue = { op: 'var', name: 'basePrice' };

class UpdateServiceDto {
  @IsOptional() @IsString() @MaxLength(200) nameRu?: string;
  @IsOptional() @IsString() @MaxLength(200) nameKk?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(2000) descRu?: string;
  @IsOptional() @IsString() @MaxLength(2000) descKk?: string;
  @IsOptional() @IsString() @MaxLength(2000) descEn?: string;
  @IsOptional() @IsUrl() photoUrl?: string;
  @IsOptional() @IsInt() @Min(0) basePrice?: number; // minor units (tiyin)
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class CreateServiceDto {
  @IsString() @Matches(/^[a-z0-9-]+$/, { message: 'slug must be kebab-case (a-z, 0-9, -)' })
  @MaxLength(80)
  slug!: string;
  @IsEnum(ServiceType) type!: ServiceType;
  @IsString() @MaxLength(200) nameRu!: string;
  @IsOptional() @IsString() @MaxLength(200) nameKk?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(2000) descRu?: string;
  @IsOptional() @IsString() @MaxLength(2000) descKk?: string;
  @IsOptional() @IsString() @MaxLength(2000) descEn?: string;
  @IsOptional() @IsUrl() photoUrl?: string;
  @IsInt() @Min(0) basePrice!: number; // minor units (tiyin)
}

@ApiTags('admin-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('manager', 'admin')
@Controller('admin/services')
export class AdminCatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all services (including inactive)' })
  async list() {
    const services = await this.prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
      include: { options: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    return services.map((s) => this.project(s));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service (type) in the catalog' })
  async create(@Body() dto: CreateServiceDto) {
    const created = await this.prisma.service.create({
      data: {
        slug: dto.slug,
        type: dto.type,
        nameRu: dto.nameRu,
        nameKk: dto.nameKk ?? dto.nameRu,
        nameEn: dto.nameEn ?? dto.nameRu,
        descRu: dto.descRu ?? '',
        descKk: dto.descKk ?? '',
        descEn: dto.descEn ?? '',
        photoUrl: dto.photoUrl,
        basePrice: dto.basePrice,
        pricingExpr: DEFAULT_PRICING_EXPR,
      },
    });
    return this.project(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service name / description / photo / price / active' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.nameRu !== undefined && { nameRu: dto.nameRu }),
        ...(dto.nameKk !== undefined && { nameKk: dto.nameKk }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.descRu !== undefined && { descRu: dto.descRu }),
        ...(dto.descKk !== undefined && { descKk: dto.descKk }),
        ...(dto.descEn !== undefined && { descEn: dto.descEn }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.project(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service from the catalog' })
  async remove(@Param('id') id: string) {
    try {
      await this.prisma.service.delete({ where: { id } });
    } catch (err) {
      // FK violation — orders reference this service. Don't orphan order history;
      // tell the admin to deactivate it instead (hides it from web + app).
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException(
          'У услуги есть связанные заказы — её нельзя удалить. Деактивируйте её вместо удаления.',
        );
      }
      throw err;
    }
  }

  /** Shapes a Service row into the admin DTO returned to the panel. */
  private project(s: {
    id: string;
    slug: string;
    type: ServiceType;
    nameRu: string;
    nameKk: string;
    nameEn: string;
    descRu: string;
    descKk: string;
    descEn: string;
    photoUrl: string | null;
    basePrice: number;
    currency: string;
    isActive: boolean;
  }) {
    return {
      id: s.id,
      slug: s.slug,
      type: s.type,
      nameRu: s.nameRu,
      nameKk: s.nameKk,
      nameEn: s.nameEn,
      descRu: s.descRu,
      descKk: s.descKk,
      descEn: s.descEn,
      photoUrl: s.photoUrl ?? null,
      basePrice: s.basePrice,
      currency: s.currency,
      isActive: s.isActive,
    };
  }

  @Post('photo-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a Vercel Blob upload token for a service cover photo' })
  async photoUpload(@Req() req: Request, @Body() body: HandleUploadBody) {
    return handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/webp', 'image/jpeg', 'image/png'],
        maximumSizeInBytes: 3 * 1024 * 1024, // 3 MB
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
  }
}
