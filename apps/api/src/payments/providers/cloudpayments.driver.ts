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
 * CloudPayments driver — skeleton.
 *
 * Reference: https://developers.cloudpayments.ru/
 * Auth: Basic auth with public_id + api_secret.
 * Webhook: HMAC-SHA256 of raw body using api_secret in `Content-HMAC` header.
 */
@Injectable()
export class CloudPaymentsDriver implements PaymentProviderDriver {
  readonly provider = PaymentProvider.cloudpayments;
  private readonly log = new Logger('CloudPaymentsDriver');

  async initiate(_params: ProviderInitiateParams): Promise<ProviderInitiateResult> {
    throw new ProviderNotImplementedError(this.provider, 'initiate');
  }

  verifyWebhook(_headers: WebhookHeaders, _rawBody: Buffer): boolean {
    this.log.warn('verifyWebhook called on unimplemented CloudPayments driver');
    return false;
  }

  parseWebhook(_headers: WebhookHeaders, _body: unknown): ProviderWebhookParseResult {
    throw new ProviderNotImplementedError(this.provider, 'parseWebhook');
  }

  async refund(_params: ProviderRefundParams): Promise<ProviderRefundResult> {
    throw new ProviderNotImplementedError(this.provider, 'refund');
  }
}
