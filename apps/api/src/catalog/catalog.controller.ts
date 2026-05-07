import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { resolveLocale } from '../common/locale';

@ApiTags('catalog')
@Controller('services')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List active services (optionally filtered by city slug)' })
  list(
    @Query('city') city: string | undefined,
    @Query('locale') localeQuery: string | undefined,
    @Headers('accept-language') al: string | undefined,
  ) {
    const locale = resolveLocale(localeQuery, al);
    return this.catalog.listServices({ citySlug: city, locale });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single service by slug, with its options' })
  getOne(
    @Param('slug') slug: string,
    @Query('locale') localeQuery: string | undefined,
    @Headers('accept-language') al: string | undefined,
  ) {
    const locale = resolveLocale(localeQuery, al);
    return this.catalog.getServiceBySlug(slug, locale);
  }
}
