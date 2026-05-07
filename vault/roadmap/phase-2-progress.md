---
title: Phase 2 progress
tags: [roadmap]
updated: 2026-05-07
---

# Phase 2 progress

The full plan is in [`../../global_plan.md`](../../global_plan.md) §9. This page tracks current state.

## Done

- [x] Monorepo scaffold (pnpm + turbo)
- [x] Postgres + Redis via docker-compose
- [x] Prisma schema, migrations, seed
- [x] Auth module — OTP + JWT pair + refresh rotation → [[../modules/auth]]
- [x] Users module — `/me` GET/PATCH → [[../modules/users]]
- [x] SMS adapter (stub + Mobizon) → [[../modules/notifications-sms]]
- [x] Catalog module — `/services`, `/services/:slug`, locale resolver → [[../modules/catalog]]
- [x] Pricing module — JSON DSL, `/pricing/quote`, 7 unit tests passing → [[../modules/pricing]]
- [x] Build pipeline switched to plain `tsc` → [[../decisions/ADR-002-tsc-over-nest-build]]
- [x] Web client scaffold with `next-intl` (RU/KK/EN locale prefixes)
- [x] Cleaner profile schema extensions + public read endpoints → [[../modules/cleaner-profile]]
  - `Cleaner` extended with `bioRu/Kk/En`, `yearsOfExperience`, `languages[]`, `verificationStatus`, `completedOrdersCount`
  - New entities: `Review`, `JobApplication` (schema reserved; modules pending)
  - `GET /cleaners/:id` and `GET /orders/:id/cleaner` live and verified in all 3 locales
- [x] Orders module → [[../modules/orders]]
  - `POST /orders` recomputes totals server-side via PricingService
  - State machine with 6 unit tests; transitions validated
  - Customer endpoints: list, get-with-events, cancel
  - Operator endpoints: assign cleaner, transition status
  - `OrderEvent` audit log for every state change; `completedOrdersCount` auto-increments on `done`
  - Ownership isolation verified (404 not 403; no info leak)
- [x] Reviews module → [[../modules/reviews]]
  - `POST /orders/:id/review` (auth), `GET /cleaners/:id/reviews` (public), `GET /reviews/aggregate` (public)
  - Admin moderation: `GET /admin/reviews`, `PATCH /admin/reviews/:id`
  - Running-mean rating engine with 5 unit tests; round-trip property holds
  - Cleaner stats update transactionally on publish/unpublish; verified 4.9/37 → 4.876/38 → 4.9/37 → 4.876/38
  - Auto-publish vs hold-for-moderation toggled by `REVIEWS_AUTO_PUBLISH` env var (default `true`)
  - Order auto-advances `done → reviewed` on submission; `order.reviewed` event logged
- [x] Realtime / WebSocket push → [[../modules/realtime]]
  - Socket.IO at `ws://host:4000/realtime`, JWT in handshake
  - Per-order rooms with ownership / role-based subscribe
  - `OrdersService` + `ReviewsService` emit `ORDER_STATE_CHANGED` via NestJS EventEmitter after txn commits
  - Verified live: 5 status pushes received in order during a full lifecycle drive
  - Same event bus will feed Notifications router (push/email/SMS)
- [x] Notifications router → [[../modules/notifications]]
  - Stub providers for push / WhatsApp / Telegram / email; SMS reuses the existing adapter
  - User-defined channel priority list with first-success-wins + skip on no-recipient
  - Multilingual ru/kk/en templates with `{{cleanerName}}` interpolation
  - Listens to `ORDER_STATE_CHANGED`; notifies on `assigned / en_route / done / cancelled` only
  - `Notification` audit table records every attempt with status (`sent | skipped | failed`)
  - `PATCH /users/me` updated to set `notificationChannels`, `telegramChatId`, locale, email
  - Verified across 4 routing scenarios including SMS-only fallback and WhatsApp-over-SMS preference
- [x] Job applications module → [[../modules/job-applications]]
  - `POST /applications` (public, sanitized response), `GET/PATCH /admin/applications`
  - 24h-per-phone dedup rate-limit returns 409
  - Phone validated as E.164; city accepted as slug or free-text
  - On submit: fan-out `application.received` notification to every active manager/admin via NotificationsService — each operator picks up the alert via their own preferred channel
  - New `application.received` template (ru/kk/en) added to the registry
  - `NotificationsService.dispatchOrderEvent` generalized to `dispatchToUser` (works for any templated event, not just orders)
- [x] Addresses module → [[../modules/addresses]]
  - Full CRUD + soft-delete on `Address` (5 endpoints, JWT-guarded)
  - Geocoding adapter (`GEOCODING_PROVIDER` token, mirroring SMS pattern); stub provider with deterministic synthetic data
  - `POST /addresses/geocode/reverse` and `/forward` exposed
  - Ownership isolation: 404 uniformly for missing / deleted / foreign — verified across 14 scenarios
  - `addressId` on orders still **optional** for now; tightening deferred until the web-client wizard is ready to enforce
- [x] Web client booking wizard → [[../modules/web-client]]
  - Pages: home, `/login` (phone OTP), `/book` (5-step wizard), `/orders/:id` (live status)
  - `lib/api.ts` fetch wrapper with auth-token injection + refresh-on-401
  - localStorage session helper + `useSession` hook
  - WebSocket subscription on order page → live status timeline + cleaner card
  - Multilingual ru/kk/en (verified all three render correctly)
  - Tailwind component utilities (`btn-primary`, `input`, `card`) for consistent styling
  - All four routes return 200; no build errors
- [x] Review submission UI on the order page
  - `<ReviewForm>` mounts when `order.status === 'done'` — 1–5 star rating + optional comment
  - `<ReviewThanks>` mounts when status is `reviewed`
  - Optimistic status flip on submit; WS-pushed `order.reviewed` is idempotent
  - Strings added to ru/kk/en messages
  - Photos and tags deferred per ADR-005
- [x] `addressId` tightened to **required** on `POST /orders`
  - DTO drops `@IsOptional`; missing → `400 ["addressId must be a string"]`
  - Service unconditionally validates ownership / existence (404 / 403)
  - Web client API helper signature now requires `addressId`; wizard's submit asserts via type narrowing
  - Prisma column kept nullable to preserve legacy rows; future migration to `NOT NULL` after cleanup

## Next

1. **Real 2GIS provider** — implement `Provider2GIS` once API keys arrive; wire into the existing factory. Same pattern as the future Mobizon-vs-stub flip.
3. **Payments adapter + Kaspi Pay** — webhook callback, idempotent settlement, refund flow. Tightens state machine to require `paid → assigned`. *Blocked on [[open-questions]] #1.*
4. **Real notification providers** — FCM/APNs (push), Twilio or Meta (WhatsApp), SMTP/SendGrid (email), Telegram bot. Adapter shape is in place; swap-in is mechanical.
5. **Telegram account-linking flow** — bot deep link with one-time token.
6. **Subscriptions module** — recurring orders via cron.
7. **Webhook outbox** — append-only events for future Bitrix24 integration.
8. **Admin endpoints — cleaner CRUD** — manager creates / suspends / verifies cleaners.
9. **`apps/web-admin`** — admin SPA scaffold.
10. **`apps/mobile`** — Expo scaffold.

## Related

- [[open-questions]]
