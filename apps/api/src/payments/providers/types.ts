import type { Order, Payment, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';

export interface ProviderInitiateParams {
  payment: Payment;
  order: Order;
  returnUrl: string;
  cancelUrl: string;
}

export interface ProviderInitiateResult {
  providerPaymentId: string | null;
  paymentUrl: string | null;
  status: PaymentStatus;
  rawPayload: Prisma.InputJsonValue;
  /** When the provider URL/session expires. Driver-specific; null = use service default. */
  expiresAt?: Date | null;
}

export interface ProviderWebhookParseResult {
  providerPaymentId: string;
  status: PaymentStatus;
  rawPayload: Prisma.InputJsonValue;
  /** Optional amount echoed by the provider; service may cross-check. */
  amount?: number;
  currency?: string;
}

export interface ProviderRefundParams {
  payment: Payment;
  amount: number;
  reason?: string;
}

export interface ProviderRefundResult {
  providerRefundId: string | null;
  status: 'pending' | 'succeeded' | 'failed';
  rawPayload: Prisma.InputJsonValue;
}

export type WebhookHeaders = Record<string, string | string[] | undefined>;

export interface PaymentProviderDriver {
  readonly provider: PaymentProvider;
  /** Create a provider-side session/charge. Returns URL + initial status. */
  initiate(params: ProviderInitiateParams): Promise<ProviderInitiateResult>;
  /** Verify webhook authenticity (HMAC, signature header, IP allowlist, etc.). */
  verifyWebhook(headers: WebhookHeaders, rawBody: Buffer): boolean;
  /** Map verified webhook body to our payment state. Throws on malformed bodies. */
  parseWebhook(headers: WebhookHeaders, body: unknown): ProviderWebhookParseResult;
  /** Issue a refund. Drivers without refund support throw NotImplemented. */
  refund(params: ProviderRefundParams): Promise<ProviderRefundResult>;
}

export class ProviderNotImplementedError extends Error {
  constructor(provider: PaymentProvider, op: string) {
    super(`Payment provider "${provider}" does not implement "${op}"`);
    this.name = 'ProviderNotImplementedError';
  }
}
