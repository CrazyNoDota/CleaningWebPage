import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ORDER_STATE_CHANGED,
  type OrderStateChangedEvent,
} from '../realtime/domain-events';
import { TelegramService } from './telegram.service';
import {
  cleanerStatusLabel,
  encodeCallback,
  nextCleanerAction,
} from './cleaner-actions';

// Statuses for which the assigned cleaner gets a Telegram update.
const CLEANER_NOTIFY = new Set<OrderStatus>([
  OrderStatus.assigned,
  OrderStatus.en_route,
  OrderStatus.in_progress,
  OrderStatus.done,
  OrderStatus.cancelled,
]);

/**
 * Pushes order updates to the assigned cleaner over Telegram and offers the
 * next status-change button. The cleaner taps it → webhook applies the
 * transition → another ORDER_STATE_CHANGED fires → the next card is sent.
 */
@Injectable()
export class TelegramOrderListener {
  private readonly log = new Logger(TelegramOrderListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  @OnEvent(ORDER_STATE_CHANGED, { async: true })
  async onStateChanged(evt: OrderStateChangedEvent): Promise<void> {
    if (!this.telegram.enabled) return;
    if (!evt.cleanerId) return;
    if (!CLEANER_NOTIFY.has(evt.status)) return;

    const order = await this.prisma.order.findUnique({
      where: { id: evt.orderId },
      select: {
        orderNumber: true,
        status: true,
        scheduledAt: true,
        total: true,
        currency: true,
        notes: true,
        service: { select: { nameRu: true } },
        address: { select: { street: true, building: true, apartment: true } },
        user: { select: { name: true, phone: true } },
        guestPhone: true,
        cleaner: { select: { user: { select: { telegramChatId: true } } } },
      },
    });

    const chatId = order?.cleaner?.user.telegramChatId;
    if (!order || !chatId) return; // cleaner hasn't linked their Telegram yet

    const text = this.buildText(order, evt.status);
    const action = nextCleanerAction(evt.status);
    const inlineKeyboard = action
      ? [[{ text: action.label, callback_data: encodeCallback(evt.orderId, action.to) }]]
      : undefined;

    const sent = await this.telegram.sendMessage(chatId, text, { inlineKeyboard });
    if (!sent) {
      this.log.warn(`failed to notify cleaner for order ${evt.orderId} (${evt.status})`);
    }
  }

  private buildText(
    order: {
      orderNumber: number;
      scheduledAt: Date | null;
      total: number;
      currency: string;
      notes: string | null;
      service: { nameRu: string };
      address: { street: string; building: string; apartment: string | null } | null;
      user: { name: string | null; phone: string | null } | null;
      guestPhone: string | null;
    },
    status: OrderStatus,
  ): string {
    const lines: string[] = [];
    lines.push(`<b>Заказ #${order.orderNumber}</b> — ${cleanerStatusLabel(status)}`);

    // Full card only when the order is freshly assigned; later updates stay terse.
    if (status === OrderStatus.assigned) {
      lines.push('');
      lines.push(`🧹 ${esc(order.service.nameRu)}`);
      if (order.scheduledAt) lines.push(`🗓 ${formatWhen(order.scheduledAt)}`);
      if (order.address) lines.push(`📍 ${esc(formatAddress(order.address))}`);
      const phone = order.user?.phone ?? order.guestPhone;
      if (phone) {
        const who = order.user?.name ? `${esc(order.user.name)} ` : '';
        lines.push(`👤 ${who}${esc(phone)}`);
      }
      lines.push(`💰 ${formatMoney(order.total, order.currency)}`);
      if (order.notes) lines.push(`📝 ${esc(order.notes)}`);
    }

    if (status === OrderStatus.cancelled) {
      lines.push('');
      lines.push('Заказ отменён — ничего делать не нужно.');
    } else if (status === OrderStatus.done) {
      lines.push('');
      lines.push('Спасибо за работу! 🎉');
    }

    return lines.join('\n');
  }
}

function formatAddress(a: {
  street: string;
  building: string;
  apartment: string | null;
}): string {
  const base = `${a.street} ${a.building}`;
  return a.apartment ? `${base}, кв. ${a.apartment}` : base;
}

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Almaty',
  }).format(date);
}

function formatMoney(minorUnits: number, currency: string): string {
  return `${(minorUnits / 100).toLocaleString('ru-RU')} ${currency}`;
}

/** Escapes the five characters that matter for Telegram HTML parse mode. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
