import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';
import { TelegramService } from './telegram.service';
import {
  TelegramWebhookService,
  type TelegramUpdate,
} from './telegram-webhook.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly config: ConfigService,
    private readonly webhook: TelegramWebhookService,
    private readonly telegram: TelegramService,
  ) {}

  /**
   * Telegram update sink. The secret lives in the path so only Telegram (which we
   * gave the URL to) can reach it. Always returns 200 so Telegram won't retry.
   */
  @Post('webhook/:secret')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async receiveUpdate(
    @Param('secret') secret: string,
    @Body() body: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') headerToken?: string,
  ): Promise<{ ok: true }> {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!expected || !safeEqual(secret, expected)) {
      // Hide the endpoint's existence from anyone without the secret.
      throw new NotFoundException();
    }
    // Telegram echoes the secret_token we set in setWebhook on every update.
    // When present it must match — belt-and-suspenders over the path secret.
    if (headerToken !== undefined && !safeEqual(headerToken, expected)) {
      throw new NotFoundException();
    }
    await this.webhook.handleUpdate(body);
    return { ok: true };
  }

  /** Registers the webhook URL with Telegram. Admin-only, run once after deploy. */
  @Post('admin/set-webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register the Telegram webhook (admin)' })
  async setWebhook(@Body() body: { baseUrl?: string }): Promise<{ ok: boolean; url: string }> {
    const secret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('TELEGRAM_WEBHOOK_SECRET is not configured');
    }
    const base =
      body?.baseUrl ??
      this.config.get<string>('PUBLIC_API_URL') ??
      this.config.get<string>('API_BASE_URL');
    if (!base) {
      throw new BadRequestException('No base URL: pass { baseUrl } or set PUBLIC_API_URL');
    }
    const url = `${base.replace(/\/+$/, '')}/api/v1/telegram/webhook/${secret}`;
    const ok = await this.telegram.setWebhook(url, secret);
    return { ok, url };
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
