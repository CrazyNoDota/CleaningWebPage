import {
  assertTransition,
  canTransition,
  customerCanCancel,
  InvalidTransitionError,
  isTerminal,
} from './order-state-machine';

describe('OrderStateMachine', () => {
  it('allows the happy path created -> done -> reviewed', () => {
    expect(canTransition('created', 'assigned')).toBe(true);
    expect(canTransition('assigned', 'en_route')).toBe(true);
    expect(canTransition('en_route', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'done')).toBe(true);
    expect(canTransition('done', 'reviewed')).toBe(true);
  });

  it('rejects skipping states (e.g. created -> in_progress)', () => {
    expect(canTransition('created', 'in_progress')).toBe(false);
    expect(canTransition('paid', 'done')).toBe(false);
  });

  it('rejects revival of terminal states', () => {
    expect(canTransition('cancelled', 'created')).toBe(false);
    expect(canTransition('reviewed', 'created')).toBe(false);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('reviewed')).toBe(true);
  });

  it('throws InvalidTransitionError with both states in the message', () => {
    expect(() => assertTransition('done', 'in_progress')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('done', 'in_progress')).toThrow(/done -> in_progress/);
  });

  it('lets customers cancel before in_progress, but not after', () => {
    expect(customerCanCancel('created')).toBe(true);
    expect(customerCanCancel('paid')).toBe(true);
    expect(customerCanCancel('assigned')).toBe(true);
    expect(customerCanCancel('en_route')).toBe(false);
    expect(customerCanCancel('in_progress')).toBe(false);
    expect(customerCanCancel('done')).toBe(false);
  });

  it('allows cancelling from any pre-terminal status (manager override)', () => {
    for (const s of ['created', 'paid', 'assigned', 'en_route', 'in_progress'] as const) {
      expect(canTransition(s, 'cancelled')).toBe(true);
    }
  });
});
