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
 * Halyk ePay driver — skeleton.
 *
 * Reference: https://epayment.kz/docs
 * Auth: OAuth2 client_credentials per call.
 * Webhook: JWT-signed `postLink` POST with RSA verify against Halyk public key.
 * Supports auth + capture separately (this driver should expose capture() later).
 */
@Injectable()
export class HalykEpayDriver implements PaymentProviderDriver {
  readonly provider = PaymentProvider.halyk_epay;
  private readonly log = new Logger('HalykEpayDriver');

  async initiate(_params: ProviderInitiateParams): Promise<ProviderInitiateResult> {
    throw new ProviderNotImplementedError(this.provider, 'initiate');
  }

  verifyWebhook(_headers: WebhookHeaders, _rawBody: Buffer): boolean {
    this.log.warn('verifyWebhook called on unimplemented Halyk driver');
    return false;
  }

  parseWebhook(_headers: WebhookHeaders, _body: unknown): ProviderWebhookParseResult {
    throw new ProviderNotImplementedError(this.provider, 'parseWebhook');
  }

  async refund(_params: ProviderRefundParams): Promise<ProviderRefundResult> {
    throw new ProviderNotImplementedError(this.provider, 'refund');
  }
}
