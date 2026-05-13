CREATE TYPE "PaymentProvider" AS ENUM (
  'stub',
  'kaspi',
  'freedom_pay',
  'halyk_epay',
  'cloudpayments'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'pending',
  'requires_action',
  'succeeded',
  'failed',
  'cancelled',
  'refunded'
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT,
  "provider" "PaymentProvider" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KZT',
  "providerPaymentId" TEXT,
  "paymentUrl" TEXT,
  "idempotencyKey" TEXT,
  "rawPayload" JSONB,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
