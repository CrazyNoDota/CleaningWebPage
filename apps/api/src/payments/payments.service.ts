import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_STATE_CHANGED } from '../realtime/domain-events';
import { assertTransition, eventNameFor, InvalidTransitionError } from '../orders/order-state-machine';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

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
        status: { in: [PaymentStatus.pending, PaymentStatus.requires_action, PaymentStatus.succeeded] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (reusable) return this.publicView(reusable);

    const provider = this.providerFromEnv();
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        userId,
        provider,
        status: provider === PaymentProvider.stub ? PaymentStatus.pending : PaymentStatus.requires_action,
        amount: order.total,
        currency: order.currency,
        idempotencyKey,
        paymentUrl: this.paymentUrlForProvider(provider),
        rawPayload: {
          mode: provider === PaymentProvider.stub ? 'manual_stub_confirm' : 'provider_redirect_pending',
        } as Prisma.InputJsonValue,
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

  async confirmStub(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment || payment.userId !== userId || payment.provider !== PaymentProvider.stub) {
      throw new NotFoundException(`payment "${paymentId}" not found`);
    }
    if (payment.status === PaymentStatus.succeeded) return this.publicView(payment);
    if (payment.status !== PaymentStatus.pending) {
      throw new BadRequestException(`cannot confirm payment in status "${payment.status}"`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: payment.orderId } });
      if (!order) throw new NotFoundException(`order "${payment.orderId}" not found`);
      if (order.status !== OrderStatus.paid) {
        try {
          assertTransition(order.status, OrderStatus.paid);
        } catch (err) {
          if (err instanceof InvalidTransitionError) throw new BadRequestException(err.message);
          throw err;
        }
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.succeeded,
          providerPaymentId: `stub_${payment.id}`,
          paidAt: new Date(),
          rawPayload: {
            confirmedBy: 'stub',
            confirmedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      const updatedOrder =
        order.status === OrderStatus.paid
          ? order
          : await tx.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.paid },
            });

      await tx.orderEvent.createMany({
        data: [
          {
            orderId: order.id,
            type: 'payment.succeeded',
            actorId: userId,
            payload: { paymentId: payment.id, provider: payment.provider },
          },
          {
            orderId: order.id,
            type: eventNameFor(OrderStatus.paid),
            actorId: userId,
            payload: { paymentId: payment.id, provider: payment.provider },
          },
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

    return this.publicView(result.updatedPayment);
  }

  private providerFromEnv(): PaymentProvider {
    const raw = (process.env.PAYMENT_PROVIDER ?? 'stub').toLowerCase();
    if (raw === 'kaspi') return PaymentProvider.kaspi;
    if (raw === 'freedom_pay') return PaymentProvider.freedom_pay;
    if (raw === 'halyk_epay') return PaymentProvider.halyk_epay;
    if (raw === 'cloudpayments') return PaymentProvider.cloudpayments;
    return PaymentProvider.stub;
  }

  private paymentUrlForProvider(provider: PaymentProvider): string | null {
    if (provider === PaymentProvider.stub) return null;
    return null;
  }

  private publicView(payment: {
    id: string;
    orderId: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paymentUrl: string | null;
    paidAt: Date | null;
    createdAt: Date;
  }) {
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
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }
}
