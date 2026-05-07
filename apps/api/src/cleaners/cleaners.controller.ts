import { Controller, Get, Headers, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CleanersService } from './cleaners.service';
import { resolveLocale } from '../common/locale';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('cleaners')
@Controller()
export class CleanersController {
  constructor(private readonly cleaners: CleanersService) {}

  @Get('cleaners/:id')
  @ApiOperation({ summary: 'Public cleaner profile (sanitized — no PII)' })
  getProfile(
    @Param('id') id: string,
    @Query('locale') localeQuery: string | undefined,
    @Headers('accept-language') al: string | undefined,
  ) {
    const locale = resolveLocale(localeQuery, al);
    return this.cleaners.getPublicProfile(id, locale);
  }

  @Get('orders/:id/cleaner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '"Your cleaner" view for an order, including current order status' })
  getOrderCleaner(
    @Param('id') orderId: string,
    @Req() req: Request,
    @Query('locale') localeQuery: string | undefined,
    @Headers('accept-language') al: string | undefined,
  ) {
    const locale = resolveLocale(localeQuery, al);
    return this.cleaners.getOrderCleaner(orderId, req.user!.sub, locale);
  }
}
