import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderSource, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { ORDER_STATE_CHANGED, type OrderStateChangedEvent } from '../realtime/domain-events';
import {
  assertTransition,
  customerCanCancel,
  eventNameFor,
  InvalidTransitionError,
} from './order-state-machine';
import type { CreateOrderDto } from './dto/create-order.dto';

interface ActorContext {
  userId: string;
  role: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly events: EventEmitter2,
  ) {}

  private emitStateChanged(evt: OrderStateChangedEvent): void {
    this.events.emit(ORDER_STATE_CHANGED, evt);
  }

  async create(actor: ActorContext, dto: CreateOrderDto) {
    // Always recompute the price server-side. The client cannot influence the total.
    const quote = await this.pricing.quote({
      serviceSlug: dto.serviceSlug,
      inputs: dto.inputs,
      options: dto.options,
    });

    const service = await this.prisma.service.findUnique({
      where: { slug: dto.serviceSlug },
      select: { id: true },
    });
    if (!service) {
      throw new NotFoundException(`service "${dto.serviceSlug}" not found`);
    }

    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
      select: { userId: true, deletedAt: true },
    });
    if (!address || address.deletedAt) {
      throw new NotFoundException(`address "${dto.addressId}" not found`);
    }
    if (address.userId !== actor.userId) {
      throw new ForbiddenException('address does not belong to current user');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
      throw new BadRequestException('scheduledAt must be a future ISO datetime');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: actor.userId,
          serviceId: service.id,
          addressId: dto.addressId,
          scheduledAt,
          status: OrderStatus.created,
          source: dto.source ?? OrderSource.web,
          total: quote.total,
          currency: quote.currency,
          notes: dto.notes,
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: eventNameFor(OrderStatus.created),
          actorId: actor.userId,
          payload: {
            quote,
            inputs: dto.inputs,
            options: (dto.options ?? []).map((o) => ({ key: o.key, qty: o.qty ?? 1 })),
          } as unknown as Prisma.InputJsonValue,
        },
      });
      return order;
    });
    this.emitStateChanged({
      orderId: created.id,
      userId: created.userId,
      cleanerId: created.cleanerId,
      status: created.status,
      previousStatus: null,
      eventType: eventNameFor(OrderStatus.created),
      at: new Date(),
    });
    return this.publicView(created);
  }

  async listForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.publicView(o));
  }

  // ── operator/admin reads ────────────────────────────────────────

  async adminList(opts: {
    take: number;
    skip: number;
    status?: OrderStatus;
    cleanerId?: string;
    userPhone?: string;
  }) {
    return this.prisma.order.findMany({
      where: {
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.cleanerId ? { cleanerId: opts.cleanerId } : {}),
        ...(opts.userPhone ? { user: { phone: opts.userPhone } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: opts.take,
      skip: opts.skip,
      include: {
        user: { select: { name: true, phone: true } },
        service: { select: { slug: true, nameRu: true } },
        cleaner: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async adminGet(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        service: true,
        address: { include: { city: true } },
        cleaner: {
          include: { user: { select: { name: true, phone: true } } },
        },
        events: { orderBy: { createdAt: 'asc' } },
        review: true,
      },
    });
    if (!order) throw new NotFoundException(`order "${orderId}" not found`);
    return order;
  }

  async getForUser(orderId: string, userId: string) {
    const order = await this.requireOwnedOrder(orderId, userId);
    const events = await this.prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, type: true, createdAt: true, payload: true },
    });
    return { ...this.publicView(order), events };
  }

  async cancelByCustomer(orderId: string, userId: string, reason?: string) {
    const order = await this.requireOwnedOrder(orderId, userId);
    if (!customerCanCancel(order.status)) {
      throw new BadRequestException(
        `cannot cancel order in status "${order.status}" — contact support`,
      );
    }
    return this.applyTransition(orderId, OrderStatus.cancelled, {
      userId,
      role: 'client',
      note: reason,
    });
  }

  async assignCleaner(orderId: string, cleanerId: string, actor: ActorContext) {
    const cleaner = await this.prisma.cleaner.findUnique({
      where: { id: cleanerId },
      select: { id: true, isActive: true },
    });
    if (!cleaner || !cleaner.isActive) {
      throw new NotFoundException(`cleaner "${cleanerId}" not found`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException(`order "${orderId}" not found`);
      try {
        assertTransition(order.status, OrderStatus.assigned);
      } catch (err) {
        if (err instanceof InvalidTransitionError) throw new BadRequestException(err.message);
        throw err;
      }
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.assigned, cleanerId },
      });
      await tx.orderEvent.create({
        data: {
          orderId,
          type: eventNameFor(OrderStatus.assigned),
          actorId: actor.userId,
          payload: { cleanerId, by: actor.role },
        },
      });
      return { updated, previousStatus: order.status };
    });
    this.emitStateChanged({
      orderId: result.updated.id,
      userId: result.updated.userId,
      cleanerId: result.updated.cleanerId,
      status: result.updated.status,
      previousStatus: result.previousStatus,
      eventType: eventNameFor(OrderStatus.assigned),
      at: new Date(),
    });
    return this.publicView(result.updated);
  }

  async transitionByOperator(orderId: string, to: OrderStatus, actor: ActorContext, note?: string) {
    return this.applyTransition(orderId, to, { userId: actor.userId, role: actor.role, note });
  }

  /**
   * Status change initiated by the assigned cleaner (e.g. from the Telegram bot).
   * Authorizes by matching the order's cleaner to the acting user, then defers to
   * the state machine. NotFound (not their order) and BadRequest (invalid edge)
   * propagate to the caller.
   */
  async transitionByCleaner(orderId: string, cleanerUserId: string, to: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, cleaner: { select: { userId: true, isActive: true } } },
    });
    if (!order || !order.cleaner || order.cleaner.userId !== cleanerUserId) {
      throw new NotFoundException(`order "${orderId}" not found`);
    }
    // Deactivated cleaners can't drive transitions, even on an order still
    // assigned to them — mirrors the isActive gate in assignCleaner.
    if (!order.cleaner.isActive) {
      throw new ForbiddenException('cleaner profile is not active');
    }
    return this.applyTransition(orderId, to, { userId: cleanerUserId, role: 'cleaner' });
  }

  // ── private ───────────────────────────────────────────────────────

  private async requireOwnedOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      // Same body for both cases — don't leak existence.
      throw new NotFoundException(`order "${orderId}" not found`);
    }
    return order;
  }

  private async applyTransition(
    orderId: string,
    to: OrderStatus,
    actor: { userId: string; role: string; note?: string },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException(`order "${orderId}" not found`);
      try {
        assertTransition(order.status, to);
      } catch (err) {
        if (err instanceof InvalidTransitionError) throw new BadRequestException(err.message);
        throw err;
      }
      const data: Prisma.OrderUpdateInput = { status: to };
      if (to === OrderStatus.cancelled) {
        data.cancelledAt = new Date();
      }
      const updated = await tx.order.update({ where: { id: orderId }, data });

      // Denormalized counter — increment cleaner's completed count when an order finishes.
      if (to === OrderStatus.done && order.cleanerId) {
        await tx.cleaner.update({
          where: { id: order.cleanerId },
          data: { completedOrdersCount: { increment: 1 } },
        });
      }

      await tx.orderEvent.create({
        data: {
          orderId,
          type: eventNameFor(to),
          actorId: actor.userId,
          payload: { by: actor.role, ...(actor.note ? { note: actor.note } : {}) },
        },
      });
      return { updated, previousStatus: order.status };
    });
    this.emitStateChanged({
      orderId: result.updated.id,
      userId: result.updated.userId,
      cleanerId: result.updated.cleanerId,
      status: result.updated.status,
      previousStatus: result.previousStatus,
      eventType: eventNameFor(to),
      at: new Date(),
    });
    return this.publicView(result.updated);
  }

  private publicView<T extends { id: string }>(
    o: T & {
      serviceId: string;
      addressId: string | null;
      cleanerId: string | null;
      scheduledAt: Date | null;
      status: OrderStatus;
      source: OrderSource;
      total: number;
      currency: string;
      createdAt: Date;
      updatedAt: Date;
      cancelledAt: Date | null;
      notes: string | null;
    },
  ) {
    return {
      id: o.id,
      serviceId: o.serviceId,
      addressId: o.addressId,
      cleanerId: o.cleanerId,
      scheduledAt: o.scheduledAt,
      status: o.status,
      source: o.source,
      total: o.total,
      currency: o.currency,
      notes: o.notes,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      cancelledAt: o.cancelledAt,
    };
  }
}
