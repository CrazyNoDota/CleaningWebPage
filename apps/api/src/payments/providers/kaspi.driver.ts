import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import {
  ProviderNotImplementedError,
  type PaymentProviderDriver,
  type ProviderInitiateParams,
  type ProviderInitiateResult,
  type ProviderRefundParams,
  type ProviderRefundResult,
  type ProviderWebhookParseResult,
  type WebhookHeaders,
} from './types';

/**
 * Kaspi Pay driver — skeleton. Implement once merchant has API credentials.
 *
 * Reference: https://guide.kaspi.kz/partner/ru/pay/api
 * Required env: KASPI_MERCHANT_ID, KASPI_API_KEY, KASPI_API_BASE_URL
 * Webhook auth: HMAC-SHA256 of raw body using shared secret in `X-Signature` header.
 */
@Injectable()
export class KaspiDriver implements PaymentProviderDriver {
  readonly provider = PaymentProvider.kaspi;
  private readonly log = new Logger('KaspiDriver');

  async initiate(_params: ProviderInitiateParams): Promise<ProviderInitiateResult> {
    throw new ProviderNotImplementedError(this.provider, 'initiate');
  }

  verifyWebhook(_headers: WebhookHeaders, _rawBody: Buffer): boolean {
    this.log.warn('verifyWebhook called on unimplemented Kaspi driver');
    return false;
  }

  parseWebhook(_headers: WebhookHeaders, _body: unknown): ProviderWebhookParseResult {
    throw new ProviderNotImplementedError(this.provider, 'parseWebhook');
  }

  async refund(_params: ProviderRefundParams): Promise<ProviderRefundResult> {
    throw new ProviderNotImplementedError(this.provider, 'refund');
  }
}
