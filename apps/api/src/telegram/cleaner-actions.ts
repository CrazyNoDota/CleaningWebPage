import { OrderStatus } from '@prisma/client';

/**
 * The single action a cleaner can take from a given order status, driving the
 * Telegram inline button. Mirrors a subset of the order state machine
 * (assigned → en_route → in_progress → done). Returns null for statuses where
 * the cleaner has nothing to do (before assignment, or once finished).
 */
export interface CleanerAction {
  to: OrderStatus;
  label: string;
}

const NEXT: Partial<Record<OrderStatus, CleanerAction>> = {
  [OrderStatus.assigned]: { to: OrderStatus.en_route, label: '🚗 Выехал к клиенту' },
  [OrderStatus.en_route]: { to: OrderStatus.in_progress, label: '▶️ Начал уборку' },
  [OrderStatus.in_progress]: { to: OrderStatus.done, label: '✅ Завершил' },
};

export function nextCleanerAction(status: OrderStatus): CleanerAction | null {
  return NEXT[status] ?? null;
}

/**
 * Statuses a cleaner is ever allowed to move an order into from Telegram.
 * Guards against hand-crafted callbacks targeting other edges (notably
 * `cancelled`, which the state machine permits but cleaners must not trigger here).
 */
const CLEANER_ALLOWED_TARGETS = new Set<OrderStatus>([
  OrderStatus.en_route,
  OrderStatus.in_progress,
  OrderStatus.done,
]);

export function isCleanerAllowedTarget(to: OrderStatus): boolean {
  return CLEANER_ALLOWED_TARGETS.has(to);
}

/** Human-readable status label for cleaner-facing Telegram messages (ru). */
export function cleanerStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.assigned:
      return 'Назначен вам';
    case OrderStatus.en_route:
      return 'В пути';
    case OrderStatus.in_progress:
      return 'Уборка идёт';
    case OrderStatus.done:
      return 'Завершён';
    case OrderStatus.cancelled:
      return 'Отменён';
    default:
      return status;
  }
}

/** Encodes a callback button payload: `order:<orderId>:<toStatus>`. */
export function encodeCallback(orderId: string, to: OrderStatus): string {
  return `order:${orderId}:${to}`;
}

export interface ParsedCallback {
  orderId: string;
  to: OrderStatus;
}

/** Parses a callback payload, returning null if malformed or the status is unknown. */
export function parseCallback(data: string): ParsedCallback | null {
  const parts = data.split(':');
  if (parts.length !== 3 || parts[0] !== 'order') return null;
  const [, orderId, toRaw] = parts;
  if (!orderId) return null;
  if (!(Object.values(OrderStatus) as string[]).includes(toRaw)) return null;
  return { orderId, to: toRaw as OrderStatus };
}
