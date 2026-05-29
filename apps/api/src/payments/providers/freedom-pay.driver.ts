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
 * Freedom Pay (Pay.kz / paybox) driver — skeleton.
 *
 * Reference: https://developer.paybox.money/
 * Auth: shared `pg_secret_key`, MD5 signature of sorted params.
 * Webhook: form-urlencoded POST to merchant URL with `pg_sig` field.
 */
@Injectable()
export class FreedomPayDriver implements PaymentProviderDriver {
  readonly provider = PaymentProvider.freedom_pay;
  private readonly log = new Logger('FreedomPayDriver');

  async initiate(_params: ProviderInitiateParams): Promise<ProviderInitiateResult> {
    throw new ProviderNotImplementedError(this.provider, 'initiate');
  }

  verifyWebhook(_headers: WebhookHeaders, _rawBody: Buffer): boolean {
    this.log.warn('verifyWebhook called on unimplemented FreedomPay driver');
    return false;
  }

  parseWebhook(_headers: WebhookHeaders, _body: unknown): ProviderWebhookParseResult {
    throw new ProviderNotImplementedError(this.provider, 'parseWebhook');
  }

  async refund(_params: ProviderRefundParams): Promise<ProviderRefundResult> {
    throw new ProviderNotImplementedError(this.provider, 'refund');
  }
}
