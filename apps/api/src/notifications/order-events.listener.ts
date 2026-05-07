import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ORDER_STATE_CHANGED,
  type OrderStateChangedEvent,
} from '../realtime/domain-events';
import { NotificationsService } from './notifications.service';

// Only these statuses trigger a customer-facing notification.
// Skipping `created` / `paid` / `in_progress` / `reviewed` keeps the inbox quiet.
const NOTIFY_STATUSES = new Set<OrderStatus>([
  OrderStatus.assigned,
  OrderStatus.en_route,
  OrderStatus.done,
  OrderStatus.cancelled,
]);

@Injectable()
export class OrderEventsListener {
  private readonly log = new Logger(OrderEventsListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(ORDER_STATE_CHANGED, { async: true })
  async onStateChanged(evt: OrderStateChangedEvent): Promise<void> {
    if (!evt.userId) return; // guest orders not yet supported by notifications
    if (!NOTIFY_STATUSES.has(evt.status)) return;

    const cleanerName = await this.lookupCleanerName(evt.cleanerId);

    await this.notifications.dispatchToUser({
      userId: evt.userId,
      kind: evt.eventType,
      ctx: { cleanerName },
      payload: {
        orderId: evt.orderId,
        status: evt.status,
        previousStatus: evt.previousStatus,
        at: evt.at.toISOString(),
      },
    });
  }

  private async lookupCleanerName(cleanerId: string | null): Promise<string | undefined> {
    if (!cleanerId) return undefined;
    const c = await this.prisma.cleaner.findUnique({
      where: { id: cleanerId },
      select: { user: { select: { name: true } } },
    });
    if (!c?.user.name) return undefined;
    const parts = c.user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
  }
}
