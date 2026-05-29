import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  RefundStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_STATE_CHANGED } from '../realtime/domain-events';
import {
  assertTransition,
  eventNameFor,
  InvalidTransitionError,
} from '../orders/order-state-machine';
import { PaymentProviderRegistry } from './providers/registry';
import type { WebhookHeaders } from './providers/types';

const DEFAULT_EXPIRY_MINUTES = 30;
const RETURN_URL_FALLBACK = 'shinex://payment-return';
const CANCEL_URL_FALLBACK = 'shinex://payment-cancel';

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly providers: PaymentProviderRegistry,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // initiate
  // ─────────────────────────────────────────────────────────────────

  async initiateForOrder(orderId: string, userId: string, idempotencyKey?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`order "${orderId}" not found`);
    }
    if (['cancelled', 'done', 'reviewed'].includes(order.status)) {
      throw new BadRequestException(`cannot pay order in status "${order.status}"`);
    }

    if (idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
      if (existing) {
        if (existing.orderId !== orderId || existing.userId !== userId) {
          throw new ForbiddenException('idempotency key belongs to another payment');
        }
        return this.publicView(existing);
      }
    }

    const reusable = await this.prisma.payment.findFirst({
      where: {
        orderId,
        userId,
        status: {
          in: [PaymentStatus.pending, PaymentStatus.requires_action, PaymentStatus.succeeded],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (reusable) return this.publicView(reusable);

    const driver = this.providers.active();
    const expiresAtDefault = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60_000);

    const placeholder = await this.prisma.payment.create({
      data: {
        orderId,
        userId,
        provider: driver.provider,
        status: PaymentStatus.pending,
        amount: order.total,
        currency: order.currency,
        idempotencyKey,
        expiresAt: expiresAtDefault,
        rawPayload: { stage: 'placeholder' } as Prisma.InputJsonValue,
      },
    });

    let initResult;
    try {
      initResult = await driver.initiate({
        payment: placeholder,
        order,
        returnUrl: this.buildReturnUrl(placeholder.id),
        cancelUrl: this.buildCancelUrl(placeholder.id),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`provider initiate failed (${driver.provider}): ${message}`);
      await this.prisma.payment.update({
        where: { id: placeholder.id },
        data: {
          status: PaymentStatus.failed,
          rawPayload: { error: message } as Prisma.InputJsonValue,
        },
      });
      throw new BadRequestException(`payment provider error: ${message}`);
    }

    const payment = await this.prisma.payment.update({
      where: { id: placeholder.id },
      data: {
        providerPaymentId: initResult.providerPaymentId,
        paymentUrl: initResult.paymentUrl,
        status: initResult.status,
        expiresAt: initResult.expiresAt ?? expiresAtDefault,
        rawPayload: initResult.rawPayload,
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        type: 'payment.initiated',
        actorId: userId,
        payload: {
          paymentId: payment.id,
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
        },
      },
    });

    return this.publicView(payment);
  }

  // ─────────────────────────────────────────────────────────────────
  // status / read
  // ─────────────────────────────────────────────────────────────────

  async getById(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== userId) {
      throw new NotFoundException(`payment "${paymentId}" not found`);
    }
    return this.publicView(payment);
  }

  // ─────────────────────────────────────────────────────────────────
  // stub confirm (manual dev/test flow)
  // ─────────────────────────────────────────────────────────────────

  async confirmStub(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== userId || payment.provider !== PaymentProvider.stub) {
      throw new NotFoundException(`payment "${paymentId}" not found`);
    }
    if (payment.status === PaymentStatus.succeeded) return this.publicView(payment);
    if (payment.status !== PaymentStatus.pending) {
      throw new BadRequestException(`cannot confirm payment in status "${payment.status}"`);
    }

    const updated = await this.transitionToSucceeded(payment, userId, `stub_${payment.id}`, {
      confirmedBy: 'stub',
      confirmedAt: new Date().toISOString(),
    });
    return this.publicView(updated);
  }

  // ─────────────────────────────────────────────────────────────────
  // webhook handling
  // ─────────────────────────────────────────────────────────────────

  async handleWebhook(
    providerName: string,
    headers: WebhookHeaders,
    rawBody: Buffer,
    body: unknown,
  ): Promise<{ accepted: true }> {
    if (!isKnownProvider(providerName)) {
      throw new NotFoundException(`unknown provider "${providerName}"`);
    }
    const driver = this.providers.for(providerName);

    if (!driver.verifyWebhook(headers, rawBody)) {
      this.log.warn(`webhook signature rejected for ${providerName}`);
      throw new UnauthorizedException('invalid webhook signature');
    }

    const parsed = driver.parseWebhook(headers, body);

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: parsed.providerPaymentId, provider: providerName },
    });
    if (!payment) {
      this.log.warn(
        `webhook for unknown providerPaymentId ${parsed.providerPaymentId} (provider=${providerName})`,
      );
      return { accepted: true };
    }

    if (parsed.amount != null && parsed.amount !== payment.amount) {
      this.log.error(
        `webhook amount mismatch payment=${payment.id} ours=${payment.amount} theirs=${parsed.amount}`,
      );
      throw new BadRequestException('webhook amount does not match recorded payment');
    }

    if (payment.status === parsed.status) {
      // Idempotent re-delivery — store rawPayload for audit, no state change.
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { rawPayload: parsed.rawPayload },
      });
      return { accepted: true };
    }

    if (parsed.status === PaymentStatus.succeeded) {
      await this.transitionToSucceeded(
        payment,
        payment.userId,
        parsed.providerPaymentId,
        parsed.rawPayload,
      );
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: parsed.status,
          providerPaymentId: parsed.providerPaymentId,
          rawPayload: parsed.rawPayload,
        },
      });
      await this.prisma.orderEvent.create({
        data: {
          orderId: payment.orderId,
          type: `payment.${parsed.status}`,
          actorId: payment.userId,
          payload: { paymentId: payment.id, provider: providerName },
        },
      });
    }

    return { accepted: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // refund (admin)
  // ─────────────────────────────────────────────────────────────────

  async refund(paymentId: string, amount: number, reason: string | undefined, actorId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`payment "${paymentId}" not found`);
    if (payment.status !== PaymentStatus.succeeded) {
      throw new BadRequestException(
        `cannot refund payment in status "${payment.status}" — only succeeded payments`,
      );
    }
    if (amount <= 0 || amount > payment.amount) {
      throw new BadRequestException(`refund amount ${amount} out of range (1..${payment.amount})`);
    }

    const driver = this.providers.for(payment.provider);
    const result = await driver.refund({ payment, amount, reason });

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount,
        reason,
        status: result.status as RefundStatus,
        providerRefundId: result.providerRefundId,
        rawPayload: result.rawPayload,
      },
    });

    // Sum of succeeded refunds — flip payment.status to refunded only when fully refunded.
    if (result.status === 'succeeded') {
      const totalRefunded = await this.prisma.refund.aggregate({
        where: { paymentId: payment.id, status: RefundStatus.succeeded },
        _sum: { amount: true },
      });
      const refundedSum = totalRefunded._sum.amount ?? 0;
      if (refundedSum >= payment.amount) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.refunded },
        });
      }
    }

    await this.prisma.orderEvent.create({
      data: {
        orderId: payment.orderId,
        type: 'payment.refund.issued',
        actorId,
        payload: {
          paymentId: payment.id,
          refundId: refund.id,
          amount,
          reason: reason ?? null,
        },
      },
    });

    return refund;
  }

  // ─────────────────────────────────────────────────────────────────
  // expiry sweep (called by PaymentsExpiryService)
  // ─────────────────────────────────────────────────────────────────

  async sweepExpired(now = new Date()): Promise<number> {
    const expirable = await this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.pending, PaymentStatus.requires_action] },
        expiresAt: { lt: now },
      },
      select: { id: true, orderId: true, userId: true },
      take: 100,
    });
    if (expirable.length === 0) return 0;

    await this.prisma.payment.updateMany({
      where: { id: { in: expirable.map((p) => p.id) } },
      data: { status: PaymentStatus.expired },
    });

    await this.prisma.orderEvent.createMany({
      data: expirable.map((p) => ({
        orderId: p.orderId,
        type: 'payment.expired',
        actorId: p.userId,
        payload: { paymentId: p.id },
      })),
    });

    this.log.log(`expired ${expirable.length} stale payment(s)`);
    return expirable.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────────────────────

  private async transitionToSucceeded(
    payment: Payment,
    actorId: string | null,
    providerPaymentId: string,
    rawPayload: Prisma.InputJsonValue,
  ): Promise<Payment> {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: payment.orderId } });
      if (!order) throw new NotFoundException(`order "${payment.orderId}" not found`);

      let nextOrderStatus = order.status;
      if (order.status !== OrderStatus.paid) {
        try {
          assertTransition(order.status, OrderStatus.paid);
          nextOrderStatus = OrderStatus.paid;
        } catch (err) {
          if (err instanceof InvalidTransitionError) {
            throw new BadRequestException(err.message);
          }
          throw err;
        }
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.succeeded,
          providerPaymentId,
          paidAt: new Date(),
          rawPayload,
        },
      });

      const updatedOrder =
        nextOrderStatus === order.status
          ? order
          : await tx.order.update({
              where: { id: order.id },
              data: { status: nextOrderStatus },
            });

      await tx.orderEvent.createMany({
        data: [
          {
            orderId: order.id,
            type: 'payment.succeeded',
            actorId,
            payload: { paymentId: payment.id, provider: payment.provider },
          },
          ...(nextOrderStatus === order.status
            ? []
            : [
                {
                  orderId: order.id,
                  type: eventNameFor(OrderStatus.paid),
                  actorId,
                  payload: { paymentId: payment.id, provider: payment.provider },
                },
              ]),
        ],
      });

      return { updatedPayment, updatedOrder, previousStatus: order.status };
    });

    if (result.previousStatus !== result.updatedOrder.status) {
      this.events.emit(ORDER_STATE_CHANGED, {
        orderId: result.updatedOrder.id,
        userId: result.updatedOrder.userId,
        cleanerId: result.updatedOrder.cleanerId,
        status: result.updatedOrder.status,
        previousStatus: result.previousStatus,
        eventType: eventNameFor(OrderStatus.paid),
        at: new Date(),
      });
    }

    return result.updatedPayment;
  }

  private buildReturnUrl(paymentId: string): string {
    const base = process.env.PAYMENT_RETURN_URL ?? RETURN_URL_FALLBACK;
    return appendQuery(base, { paymentId, status: 'return' });
  }

  private buildCancelUrl(paymentId: string): string {
    const base = process.env.PAYMENT_CANCEL_URL ?? CANCEL_URL_FALLBACK;
    return appendQuery(base, { paymentId, status: 'cancel' });
  }

  private publicView(payment: Payment) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentUrl: payment.paymentUrl,
      nextAction:
        payment.provider === PaymentProvider.stub && payment.status === PaymentStatus.pending
          ? 'stub_confirm'
          : payment.paymentUrl
            ? 'redirect'
            : null,
      expiresAt: payment.expiresAt,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }
}

function isKnownProvider(name: string): name is PaymentProvider {
  return (Object.values(PaymentProvider) as string[]).includes(name);
}

function appendQuery(url: string, params: Record<string, string>): string {
  const sep = url.includes('?') ? '&' : '?';
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${url}${sep}${qs}`;
}
