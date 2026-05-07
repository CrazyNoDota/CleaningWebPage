import { OrderStatus } from '@prisma/client';

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`invalid order transition: ${from} -> ${to}`);
  }
}

// Adjacency list of allowed status transitions.
// `created -> assigned` is allowed for MVP because the payment adapter is not
// wired yet; tighten to `paid -> assigned` once Kaspi lands.
const ALLOWED: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  draft: new Set<OrderStatus>(['created', 'cancelled']),
  created: new Set<OrderStatus>(['paid', 'assigned', 'cancelled']),
  paid: new Set<OrderStatus>(['assigned', 'cancelled']),
  assigned: new Set<OrderStatus>(['en_route', 'cancelled']),
  en_route: new Set<OrderStatus>(['in_progress', 'cancelled']),
  in_progress: new Set<OrderStatus>(['done', 'cancelled']),
  done: new Set<OrderStatus>(['reviewed']),
  reviewed: new Set<OrderStatus>(),
  cancelled: new Set<OrderStatus>(),
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].has(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

// Customer can cancel only before the cleaner has started physical work.
const CUSTOMER_CANCELLABLE_FROM: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'created',
  'paid',
  'assigned',
]);

export function customerCanCancel(from: OrderStatus): boolean {
  return CUSTOMER_CANCELLABLE_FROM.has(from);
}

export function isTerminal(s: OrderStatus): boolean {
  return s === 'reviewed' || s === 'cancelled';
}

export function eventNameFor(status: OrderStatus): string {
  return `order.${status}`;
}
