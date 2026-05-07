import { OrderStatus } from '@prisma/client';

// Single domain event emitted on every order state change.
// The Notifications router (later) will subscribe to the same event.
export const ORDER_STATE_CHANGED = 'order.stateChanged';

export interface OrderStateChangedEvent {
  orderId: string;
  userId: string | null;
  cleanerId: string | null;
  status: OrderStatus;
  previousStatus: OrderStatus | null;
  eventType: string; // e.g. "order.assigned", "order.reviewed"
  at: Date;
}
