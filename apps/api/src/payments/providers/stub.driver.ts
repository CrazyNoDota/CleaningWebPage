import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import type {
  PaymentProviderDriver,
  ProviderInitiateParams,
  ProviderInitiateResult,
  ProviderRefundParams,
  ProviderRefundResult,
  ProviderWebhookParseResult,
  WebhookHeaders,
} from './types';

/**
 * Stub driver: no external call. The mobile/web client confirms manually via
 * POST /payments/:id/stub/confirm. Useful for dev and integration tests.
 */
@Injectable()
export class StubDriver implements PaymentProviderDriver {
  readonly provider = PaymentProvider.stub;

  async initiate(params: ProviderInitiateParams): Promise<ProviderInitiateResult> {
    return {
      providerPaymentId: `stub_${params.payment.id}`,
      paymentUrl: null,
      status: PaymentStatus.pending,
      rawPayload: { mode: 'manual_stub_confirm' },
    };
  }

  verifyWebhook(): boolean {
    // Stub has no real webhook; reject any inbound calls so we don't accidentally
    // accept unsigned state changes in environments where stub is active.
    return false;
  }

  parseWebhook(_headers: WebhookHeaders, _body: unknown): ProviderWebhookParseResult {
    throw new Error('stub driver does not accept webhook payloads');
  }

  async refund(params: ProviderRefundParams): Promise<ProviderRefundResult> {
    return {
      providerRefundId: `stub_refund_${params.payment.id}`,
      status: 'succeeded',
      rawPayload: { mode: 'manual_stub_refund' },
    };
  }
}
