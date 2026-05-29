-- Adds payment expiry, refund tracking, and the `expired` PaymentStatus.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'expired';

CREATE TYPE "RefundStatus" AS ENUM ('pending', 'succeeded', 'failed');

ALTER TABLE "Payment" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "Payment_status_expiresAt_idx" ON "Payment"("status", "expiresAt");

CREATE TABLE "Refund" (
  "id"               TEXT NOT NULL,
  "paymentId"        TEXT NOT NULL,
  "amount"           INTEGER NOT NULL,
  "reason"           TEXT,
  "status"           "RefundStatus" NOT NULL DEFAULT 'pending',
  "providerRefundId" TEXT,
  "rawPayload"       JSONB,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
