---
title: Orders module
tags: [module, backend]
status: shipped (no payment, no websocket yet)
---

# Orders module

`apps/api/src/orders/`

The booking core. Handles order creation, lifecycle transitions, customer cancellation, and operator-side assignment + status moves. Pricing is **always** recomputed server-side via `PricingService.quote()` — the client cannot influence the total.

## Files

| File | Purpose |
|---|---|
| `order-state-machine.ts` | Pure transition validator. No DB. Easy to test. |
| `order-state-machine.spec.ts` | 6 unit tests, all green. |
| `orders.service.ts` | Orchestrator: pricing, persist, transitions, ownership checks. |
| `orders.controller.ts` | Customer-facing endpoints (JWT-guarded). |
| `admin-orders.controller.ts` | Operator endpoints (`@Roles('manager','admin','operator','cleaner')`). |
| `dto/*.dto.ts` | Validated request bodies. |

## State machine

```
draft → created | cancelled
created → paid | assigned | cancelled
paid → assigned | cancelled
assigned → en_route | cancelled
en_route → in_progress | cancelled
in_progress → done | cancelled
done → reviewed
reviewed | cancelled  (terminal)
```

`created → assigned` is allowed for now because the payment adapter is not wired yet. **Tighten to `paid → assigned` once Kaspi lands.** This is the single line in `order-state-machine.ts` to flip when payments ship.

Customer can cancel only from `created`, `paid`, or `assigned`. After a cleaner is en route, cancellation must go through support — the `customerCanCancel()` predicate enforces this. Managers can cancel from any non-terminal state via the operator transition endpoint.

## Endpoints — customer

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/orders` | Create. Recomputes total. Validates serviceSlug, options, addressId ownership, future scheduledAt. |
| GET | `/api/v1/orders` | List my orders, newest first. |
| GET | `/api/v1/orders/:id` | Get one of mine, including the full event log. |
| POST | `/api/v1/orders/:id/cancel` | Cancel mine, if state allows. |

`requireOwnedOrder` returns **404** for both "doesn't exist" and "exists but not yours" — never reveals whether someone else has an order with that id.

## Endpoints — operator

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/admin/orders/:id/assign` | Assign a cleaner. Forces transition to `assigned`. |
| POST | `/api/v1/admin/orders/:id/transition` | Move to any allowed status. State machine validates the edge. |

## Side effects

- Every status change writes an `OrderEvent` row (`order.<status>`) with the actor's userId and role. The event log is the audit trail.
- Transition to `done` increments the cleaner's `completedOrdersCount` (denormalized counter on `Cleaner`). Same DB transaction as the status update — they can't drift.
- The original `order.created` event payload includes the full `quote` object, the raw inputs, and the chosen options — full price reconstruction is possible from the event log alone.

## What's intentionally not here yet

- **WebSocket push** for status updates → planned, will add a Nest gateway and emit on each transition.
- **Slot booking with advisory locks** → only matters when there's capacity contention. Current MVP: any cleaner is assignable to any slot. The single transaction in `assignCleaner` is the future lock site.
- **Payment integration on creation** → blocked by Kaspi adapter ([[../roadmap/open-questions]] #1).

## Address requirement

`POST /orders` **requires** `addressId`. The DTO rejects missing values with `400 ["addressId must be a string"]`. The address must exist, not be soft-deleted, and belong to the authenticated user — otherwise the service throws `404` (missing/deleted) or `403` (foreign).

The Prisma column `Order.addressId` remains nullable to preserve existing rows from before this tightening. Cleaning up legacy nulls + a `NOT NULL` migration is a future hygiene pass — the API contract is what enforces the requirement today.

## Verified live

| Scenario | Result |
|---|---|
| Customer creates order, server recomputes total to `2_600_000` | ✓ matches pricing-engine spec |
| Operator assign → en_route → in_progress → done | ✓ all state checks pass |
| Cleaner `completedOrdersCount` ticks up on `done` | ✓ 41 → 42 |
| `done → in_progress` rejected with `400 invalid order transition: done -> in_progress` | ✓ |
| Customer cancel rejected on `done` with friendly message | ✓ |
| Other user GET on this user's order → 404 (not 403, no info leak) | ✓ |
| Non-manager hitting `/admin/orders/.../transition` → 401 | ✓ |
| `/orders/:id/cleaner` returns sanitized cleaner card + live order status | ✓ |

## Related

- [[pricing]] — recomputes the total on every create
- [[cleaner-profile]] — receives the `completedOrdersCount` increment
- [[reviews]] — will trigger after `done`, will move status to `reviewed`
- [[../decisions/ADR-004-money-in-tiyin]] — totals are minor units everywhere
