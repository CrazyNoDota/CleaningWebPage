import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import {
  ORDER_STATE_CHANGED,
  type OrderStateChangedEvent,
} from '../../realtime/domain-events';
import { WhatsappService, normalizePhone } from './whatsapp.service';

/**
 * Sends WhatsApp template messages when an order is created:
 *   1. an alert to the business/director number
 *   2. a confirmation to the customer
 *
 * This is intentionally separate from `OrderEventsListener` (which is
 * customer-facing and walks the user's channel preferences). New-order alerts
 * are a fixed business concern, so they get their own focused listener.
 *
 * Body variable contract — MUST match the approved Meta templates exactly.
 * Variable order is fixed; do not add or reorder. All values are plain text.
 *
 *   Business template  (WHATSAPP_BUSINESS_TEMPLATE)
 *     {{1}} order id            e.g. "1842"
 *     {{2}} service name (ru)   e.g. "Уборка квартиры"
 *     {{3}} date/time           e.g. "15.05.2026 14:00"
 *     {{4}} total amount        e.g. "25000 тенге"
 *     {{5}} customer name+phone e.g. "Иван Петров 77011234567"
 *     {{6}} address             e.g. "Астана Абая 10"
 *
 *   Customer template  (WHATSAPP_CUSTOMER_TEMPLATE)
 *     {{1}} customer name       e.g. "Иван"
 *     {{2}} service name (ru)   e.g. "Уборка квартиры"
 *     {{3}} date/time           e.g. "15.05.2026 14:00"
 *     {{4}} total amount        e.g. "25000 тенге"
 */
@Injectable()
export class OrderCreatedWhatsappListener {
  private readonly log = new Logger(OrderCreatedWhatsappListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent(ORDER_STATE_CHANGED, { async: true })
  async onStateChanged(evt: OrderStateChangedEvent): Promise<void> {
    if (evt.status !== OrderStatus.created) return;

    const order = await this.prisma.order.findUnique({
      where: { id: evt.orderId },
      include: {
        user: { select: { name: true, phone: true } },
        service: { select: { nameRu: true } },
        address: { include: { city: true } },
      },
    });
    if (!order) {
      this.log.warn(`order ${evt.orderId} not found — skipping WhatsApp alert`);
      return;
    }

    const lang = this.config.get<string>('WHATSAPP_TEMPLATE_LANG') ?? 'ru';
    const businessTemplate = this.config.get<string>('WHATSAPP_BUSINESS_TEMPLATE');
    const customerTemplate = this.config.get<string>('WHATSAPP_CUSTOMER_TEMPLATE');

    const orderRef = String(order.orderNumber);
    const serviceName = order.service.nameRu;
    const scheduledAt = formatAlmaty(order.scheduledAt);
    const total = formatTotal(order.total, order.currency);
    const customerName = order.user?.name?.trim() || 'Клиент';
    const customerFirstName = customerName.split(/\s+/)[0];
    const customerPhone = order.user?.phone ?? order.guestPhone ?? null;
    const customerPhoneDigits = normalizePhone(customerPhone) ?? '';
    const address = formatAddress(order.address);

    // 1. Business alert
    if (businessTemplate) {
      try {
        const director = await this.settings.getDirector();
        if (director.whatsappPhone) {
          await this.whatsapp.sendTemplate(director.whatsappPhone, businessTemplate, lang, [
            orderRef,
            serviceName,
            scheduledAt,
            total,
            `${customerName} ${customerPhoneDigits}`.trim(),
            address,
          ]);
        } else {
          this.log.warn('director.whatsappPhone not configured — skipping business alert');
        }
      } catch (err) {
        this.log.error(`business WhatsApp alert failed: ${errMsg(err)}`);
      }
    } else {
      this.log.warn('WHATSAPP_BUSINESS_TEMPLATE not set — skipping business alert');
    }

    // 2. Customer confirmation
    if (customerTemplate) {
      if (customerPhone) {
        try {
          await this.whatsapp.sendTemplate(customerPhone, customerTemplate, lang, [
            customerFirstName,
            serviceName,
            scheduledAt,
            total,
          ]);
        } catch (err) {
          this.log.error(`customer WhatsApp confirmation failed: ${errMsg(err)}`);
        }
      } else {
        this.log.warn(`order ${orderRef} has no customer phone — skipping confirmation`);
      }
    } else {
      this.log.warn('WHATSAPP_CUSTOMER_TEMPLATE not set — skipping customer confirmation');
    }
  }
}

// Approved template example: "15.05.2026 14:00" — date and time, space-separated, no comma.
function formatAlmaty(date: Date | null): string {
  if (!date) return '—';
  const tz = 'Asia/Almaty';
  const d = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const t = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${d} ${t}`;
}

// Approved template example: "25000 тенге" — whole units, no grouping separators.
function formatTotal(minorUnits: number, currency: string): string {
  // Stored in minor units (KZT * 100). Display as whole currency units.
  const major = Math.round(minorUnits / 100);
  return currency === 'KZT' ? `${major} тенге` : `${major} ${currency}`;
}

// Approved template example: "Астана Абая 10" — city, street, building; no prefixes.
function formatAddress(
  address:
    | { street: string; building: string; apartment: string | null; city: { name: string } | null }
    | null,
): string {
  if (!address) return '—';
  const parts: string[] = [];
  if (address.city?.name) parts.push(address.city.name);
  parts.push(address.street, address.building);
  if (address.apartment) parts.push(`кв. ${address.apartment}`);
  return parts.join(' ');
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
