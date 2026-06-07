import { OrderStatus } from '@prisma/client';
import {
  encodeCallback,
  isCleanerAllowedTarget,
  nextCleanerAction,
  parseCallback,
} from './cleaner-actions';

describe('cleaner-actions', () => {
  describe('nextCleanerAction', () => {
    it('walks assigned -> en_route -> in_progress -> done', () => {
      expect(nextCleanerAction(OrderStatus.assigned)?.to).toBe(OrderStatus.en_route);
      expect(nextCleanerAction(OrderStatus.en_route)?.to).toBe(OrderStatus.in_progress);
      expect(nextCleanerAction(OrderStatus.in_progress)?.to).toBe(OrderStatus.done);
    });

    it('offers no action for statuses outside the cleaner flow', () => {
      expect(nextCleanerAction(OrderStatus.created)).toBeNull();
      expect(nextCleanerAction(OrderStatus.done)).toBeNull();
      expect(nextCleanerAction(OrderStatus.cancelled)).toBeNull();
    });
  });

  describe('isCleanerAllowedTarget', () => {
    it('permits only the three forward edges', () => {
      expect(isCleanerAllowedTarget(OrderStatus.en_route)).toBe(true);
      expect(isCleanerAllowedTarget(OrderStatus.in_progress)).toBe(true);
      expect(isCleanerAllowedTarget(OrderStatus.done)).toBe(true);
    });

    it('blocks cancellation and other edges (anti hand-crafted callback)', () => {
      expect(isCleanerAllowedTarget(OrderStatus.cancelled)).toBe(false);
      expect(isCleanerAllowedTarget(OrderStatus.assigned)).toBe(false);
      expect(isCleanerAllowedTarget(OrderStatus.paid)).toBe(false);
    });
  });

  describe('encode/parse round-trip', () => {
    it('encodes and parses back to the same order id and status', () => {
      const data = encodeCallback('order-123', OrderStatus.en_route);
      expect(data).toBe('order:order-123:en_route');
      expect(parseCallback(data)).toEqual({ orderId: 'order-123', to: OrderStatus.en_route });
    });

    it('rejects malformed payloads', () => {
      expect(parseCallback('nope')).toBeNull();
      expect(parseCallback('order::done')).toBeNull();
      expect(parseCallback('order:id:not_a_status')).toBeNull();
      expect(parseCallback('foo:id:done')).toBeNull();
    });
  });
});
