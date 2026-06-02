import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { Request } from 'express';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';

class UpdateServiceDto {
  @IsOptional() @IsString() @MaxLength(200) nameRu?: string;
  @IsOptional() @IsString() @MaxLength(200) nameKk?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(2000) descRu?: string;
  @IsOptional() @IsString() @MaxLength(2000) descKk?: string;
  @IsOptional() @IsString() @MaxLength(2000) descEn?: string;
  @IsOptional() @IsUrl() photoUrl?: string;
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
  async list(@Query('locale') locale = 'ru') {
    const services = await this.prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
      include: { options: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    return services.map((s) => ({
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
    }));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service name / description / photoUrl' })
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
      },
    });
    return {
      id: updated.id,
      slug: updated.slug,
      type: updated.type,
      nameRu: updated.nameRu,
      nameKk: updated.nameKk,
      nameEn: updated.nameEn,
      descRu: updated.descRu,
      descKk: updated.descKk,
      descEn: updated.descEn,
      photoUrl: updated.photoUrl ?? null,
      basePrice: updated.basePrice,
      currency: updated.currency,
      isActive: updated.isActive,
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
