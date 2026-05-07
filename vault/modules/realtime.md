---
title: Realtime (WebSocket push)
tags: [module, backend, realtime]
status: shipped
---

# Realtime — WebSocket push

`apps/api/src/realtime/`

Live order-status updates over Socket.IO. Powers the "Your Cleaner" UI without polling.

## Architecture

```
OrdersService                        OrdersGateway
   │  txn commits                       │
   │                                    │
   ├──► EventEmitter2.emit              │
   │       (ORDER_STATE_CHANGED)        │
   │                                    │
   │                          @OnEvent ◄┤
   │                                    │
   │                                    └──► server.to(`order:<id>`).emit('order.updated', …)
```

The split matters: `OrdersService` doesn't import the gateway. It only emits a domain event. **Anything else** that wants to react (the future Notifications router for SMS / push / email) just adds another `@OnEvent` listener — no change to OrdersService.

## Files

| File | Purpose |
|---|---|
| `domain-events.ts` | Event constant + payload type. Single source of truth for the contract. |
| `orders.gateway.ts` | Socket.IO gateway: handshake auth, subscription authz, push fan-out. |
| `realtime.module.ts` | Wires the gateway. Imports `AuthModule` for `JwtService`. |

`OrdersService` and `ReviewsService` both call `EventEmitter2.emit(ORDER_STATE_CHANGED, evt)` **after** their respective DB transactions commit — never inside, so a rollback can never leak a phantom event.

## Wire format

- **Namespace**: `/realtime` (Socket.IO namespace, mounted on the same HTTP port — `ws://host:4000/realtime`). Note: not under the `api/v1` prefix; that's HTTP-only.
- **Auth**: JWT in `auth.token` (Socket.IO handshake auth field). Falls back to `Authorization: Bearer …` header or `?token=` query string.
- **Client → server messages**:
  - `subscribe-order { orderId }` → ack `{ ok: true, currentStatus }` or `{ ok: false, error: 'forbidden' | 'not_found' | 'unauthenticated' }`
  - `unsubscribe-order { orderId }` → ack `{ ok: true }`
- **Server → client messages**:
  - `order.updated { orderId, status, previousStatus, eventType, at }`

## Authorization

A client may subscribe to an order if they:

1. Own it (`order.userId === jwt.sub`), **or**
2. Are a manager / admin / operator, **or**
3. Are the assigned cleaner (matched via `Cleaner.userId === jwt.sub`).

Anything else gets `forbidden`. Same response for missing or non-owned orders elsewhere — but on the WS path we distinguish `forbidden` vs `not_found` because there's no enumeration risk: a subscribe ack is per-connection, not a public endpoint.

## Why not server-sent events / long-polling?

- SSE is one-way; we'll later want client → server messages (typing indicators on the chat that's planned, location pings from cleaners).
- Long-polling kills mobile battery.
- Socket.IO handles reconnect, transport fallback, and rooms out of the box.

## Smoke tests

`apps/api/scripts/ws-listener.mjs` is a tiny CLI client:

```sh
node apps/api/scripts/ws-listener.mjs <accessToken> <orderId>
```

Driving the order through statuses in a separate terminal causes 4–5 `order.updated` lines to print on the listener.

## Verified live

| Scenario | Result |
|---|---|
| Customer subscribes to own order | `ack: { ok:true, currentStatus:"created" }` |
| Drive `assigned → en_route → in_progress → done → reviewed` | All 5 events received in order, with `previousStatus` set correctly |
| Foreign user subscribes to someone else's order | `ack: { ok:false, error:"forbidden" }` |
| Subscribe to non-existent order | `ack: { ok:false, error:"not_found" }` |
| Connect with no token | Server disconnects immediately |
| Connect with invalid token | Server disconnects immediately |
| Review submission triggers `order.reviewed` push (via ReviewsService → same event bus) | ✓ |

## Known nit

Bad-token connections briefly fire `connect` on the client before the server disconnects — a quirk of `handleConnection` running after the Socket.IO handshake. To make the client see `connect_error` instead, move auth into a `server.use()` handshake middleware in an `OnGatewayInit` hook. Left for later — current behavior is functionally secure (no op succeeds).

## Related

- [[orders]] — emits `ORDER_STATE_CHANGED` after each transition
- [[reviews]] — also emits on `done → reviewed`
- [[../runbook/smoke-tests]] — has the listener-script recipe
