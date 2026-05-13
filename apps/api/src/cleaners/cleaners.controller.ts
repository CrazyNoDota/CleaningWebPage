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

  @Get('cleaners')
  @ApiOperation({ summary: 'Public active cleaner profiles (sanitized — no PII)' })
  list(
    @Query('take') take: string | undefined,
    @Query('skip') skip: string | undefined,
    @Query('locale') localeQuery: string | undefined,
    @Headers('accept-language') al: string | undefined,
  ) {
    const locale = resolveLocale(localeQuery, al);
    return this.cleaners.listPublic({
      take: clamp(intOrDefault(take, 12), 1, 50),
      skip: Math.max(intOrDefault(skip, 0), 0),
      locale,
    });
  }

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

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function intOrDefault(s: string | undefined, d: number): number {
  if (s === undefined || s === '') return d;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}
