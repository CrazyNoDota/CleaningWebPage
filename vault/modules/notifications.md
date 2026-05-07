---
title: Notifications router
tags: [module, backend, notifications]
status: shipped (stub providers)
---

# Notifications router

`apps/api/src/notifications/`

Multi-channel dispatch with user-defined priority. Listens to the same `ORDER_STATE_CHANGED` event bus that the [[realtime]] gateway uses, so adding new outputs to the system is "just another `@OnEvent` listener."

## Architecture

```
OrdersService / ReviewsService
        │ emit ORDER_STATE_CHANGED
        ▼
EventEmitter2
        │
        ├──► OrdersGateway          (live WS push — see [[realtime]])
        │
        └──► OrderEventsListener
                 │
                 ▼
            NotificationsService.dispatchOrderEvent
                 │  for channel in user.notificationChannels:
                 │     resolve recipient → if null → skip
                 │     send via driver  → if throws → fall through
                 │     succeeded         → record + stop
                 ▼
            Notification (audit row, append-only)
```

## Files

| File | Purpose |
|---|---|
| `notifications.service.ts` | Orchestrator. Walks the user's channel priority list, first delivery wins. |
| `order-events.listener.ts` | Subscribes to `ORDER_STATE_CHANGED`, picks customer-facing transitions, looks up cleaner display name. |
| `templates/order-templates.ts` | Inline ru/kk/en messages with `{{var}}` interpolation. |
| `channels/types.ts` | `NotificationChannelDriver` interface — every channel implements it. |
| `channels/stub-channels.ts` | Push / WhatsApp / Telegram / Email — log to stdout for now. |
| `channels/sms-channel.ts` | Wraps the existing `SmsService` (stub or Mobizon). |

## Schema additions (migration `notifications`)

`User`:
- `notificationChannels NotificationChannel[]` — priority-ordered, default `[push, email, sms]`
- `telegramChatId String?` — set after the user links their Telegram (linking flow TBD)
- `deviceTokens String[]` — set via a future `/devices` register endpoint

New entity `Notification` (append-only audit log):
- `userId`, `kind` (event name like `order.assigned`), `channel`, `status` (`pending|sent|failed|skipped`)
- `recipient`, `subject?`, `body`, `payload Json`, `error?`, `createdAt`, `sentAt?`

## Routing rules

Customer-facing transitions notify; the rest are silent:

| OrderStatus | Notify? |
|---|---|
| `created` | no — customer just placed it, they know |
| `paid` | no — receipt covers it |
| `assigned` | **yes** |
| `en_route` | **yes** |
| `in_progress` | no — too noisy |
| `done` | **yes** (with rating CTA) |
| `cancelled` | **yes** |
| `reviewed` | no |

A channel is `skipped` when the user has no recipient configured for it (no email on file → email skipped). The next channel in the priority list is tried. SMS is naturally last — it's the only channel that always has a recipient (every user has a phone) and it costs money, so the cheaper-and-richer channels go first.

## Multilingual templates

Inline TypeScript record keyed by event type → locale. `{{cleanerName}}` is interpolated server-side. The user's stored `User.locale` picks the variant — overrides are not currently exposed (no per-notification locale override). Switching to a DB-backed template store is the natural next step when admins want to edit copy without a deploy.

## Profile preferences

`PATCH /api/v1/users/me` accepts:
- `name`, `email`, `locale`
- `notificationChannels` — array of `push|whatsapp|telegram|email|sms` in priority order, max 5
- `telegramChatId`

`GET /api/v1/users/me` now returns these fields too. Device-token registration is **not** wired yet — that's a future `/devices` endpoint.

## Verified live

| Scenario | Result |
|---|---|
| Default channels `[push, email, sms]`, user has email but no device token | Push skipped → Email sent |
| Channels `[push, email, telegram, sms]`, English locale, Telegram chat id set | Push skipped → Email sent (Telegram waited at index 2) |
| Channels `[telegram, email, sms]`, Russian locale | Telegram sent on first try (assigned + cancelled, both in Russian, with cleaner display name "Айгуль К." substituted) |
| Channels `[push, email, telegram, whatsapp, sms]`, only phone configured | All four upstream skipped → WhatsApp sent (correctly preferred over SMS per locked decisions) |
| Channels `[sms]` only, with phone | SMS sent directly |
| `in_progress` and `reviewed` transitions | No notification rows produced |
| `cancelled` transition | Notification dispatched |

## What's intentionally not here yet

- **Real provider integrations** (FCM / APNs for push, Twilio or Meta WhatsApp Cloud, SendGrid / SMTP for email, Telegram Bot API). All four current channels are stubs that log to stdout. The adapter shape mirrors the SMS pattern, so swapping in a real provider is mechanical.
- **Telegram account linking flow** — for now, `telegramChatId` is set manually via PATCH /me. Real flow would be: user starts the bot → bot replies with a deep link containing a one-time token → user opens it in the app → API binds the chat id.
- **Device-token registration endpoint** — needs to come with mobile app work.
- **Retry / backoff** — failed sends are recorded but not retried. A Redis-backed queue (BullMQ) is the natural home for retries.
- **Quiet hours / rate limits** — easy to add as a guard inside `dispatchOrderEvent`.

## Related

- [[orders]] — emits the events
- [[reviews]] — also emits the events
- [[realtime]] — same event bus, different consumer
- [[../architecture/locked-decisions]] — SMS is last-resort
