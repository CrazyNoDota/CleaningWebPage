---
title: Plan — what's left
tags: [roadmap]
updated: 2026-05-08
revised: 2026-05-08
---

# Plan — what's left

Living roadmap. For the audit trail of what's already shipped see [[done]].

## Where we are today

The product is **demo-ready**: a customer can book a cleaning end-to-end on the public site, an operator can manage it from the admin console, and order status streams live via WebSocket. Backend has 14 modules with full smoke-test coverage. Notifications, payments, and geocoding are still **stubbed** — the adapters work but real providers haven't been wired in yet.

The gap between *demo-ready* and *first paying customer* is everything in §3 below. Most of it is unblocked work; the rest is waiting on a small set of decisions tracked in [[open-questions]].

---

## §3 — Phase 3: Soft launch

What needs to be true before the first real customer can book a cleaning and pay for it.

### 3a. Production must-haves (no blockers, our work)

These can land any time. Roughly ordered by leverage.

| # | Item | Effort | Why it matters |
|---|---|---|---|
| 1 | **2GIS geocoding provider** | S (~2h) | Free-tier API key. Lights up reverse-geocode + autocomplete in the wizard. Without it cleaners may get bad addresses. |
| 5 | **"My Orders" page on web-client** | S (~1h) | `GET /api/v1/orders` already returns the user's orders; needs a page. |
| 6 | **Profile / settings page on web-client** | S (~2h) | Manage notification channels, language, telegram chat id, name, email. Today only changeable via API. |
| 7 | **Address PATCH/DELETE UI** in wizard | S (~1h) | Backend done; UI only has create-and-pick. |
| 8 | **Forward-geocoding autocomplete in wizard** | S (~1h) | Activates after item #1. Replaces the plain street/building form. |
| 9 | **Privacy policy + Terms pages** | S (~2h, content from legal) | KZ personal-data law requires both. Today both nav links are placeholders. |
| 10 | **Cookie consent banner** | S (~1h) | Same compliance bucket as #9. |
| 11 | **Per-IP rate limit on public endpoints** | S (~1h) | `@nestjs/throttler` on `/auth/otp/request`, `/applications`. Stops the obvious abuse vector. |
| 12 | **Real logo** + branded styling pass | M (waiting on design) | The text mark is a placeholder. The reference doesn't have a final logo either. |
| 13 | **`Order.addressId` NOT NULL migration** | S (~30m) | Cleanup pass: backfill any legacy nulls (currently 0–1 from smoke tests), then `ALTER COLUMN`. |
| 14 | **CI pipeline** (GitHub Actions) | M (~3h) | Lint + typecheck + build + test on every push. Today everything happens locally. |
| 15 | **Production Docker images** | M (~3h) | API + each web app with multi-stage builds, non-root user, health checks. |
| 16 | **Production deployment** to KZ VPS | M-L (~1d) | Reverse proxy (Caddy/Traefik), TLS, Postgres + Redis containers, secret management. |
| 17 | **Logging + error tracking** | M (~2h) | Sentry-like setup or a self-hosted alternative — we're flying blind on errors. |
| 18 | **Backups** for Postgres | S (~1h) | Even a daily `pg_dump` to S3-compatible storage is enough at this stage. |
| 19 | **End-to-end test suite** (Playwright) | M (~4h) | At minimum: book → pay (mocked) → admin assigns → cleaner transitions → review. One green E2E test buys huge confidence at deploy time. |

### 3b. Blocked on client decisions

These can't move until [[open-questions]] gets answered. Ordered by how badly they block launch.

| # | Open question | Affects | Severity |
|---|---|---|---|
| 1 | **Kaspi merchant onboarding date + keys** | Payments adapter | **Hard blocker** — no money flows without this |
| 2 | **SMS provider pick** (Mobizon or other) | OTP delivery in production | **Hard blocker** — stub doesn't send real SMS |
| 7 | **Receipts (фискальный чек)** strategy | Compliance — KKM integration | **Hard blocker** — Kazakhstan tax law |
| 9 | **Object storage choice** (S3 / Cloud.ru / MinIO) | Photo + resume upload pipeline | Soft — UI works without uploads, but ADR-005 column reservations want a destination |
| 8 | **Logo + brand colors** | Final styling pass | Soft — current design ref values work for soft launch |
| 11 | **Review moderation policy** default | `REVIEWS_AUTO_PUBLISH` env | Soft — env-flippable, just needs a recommended default |
| 4 | **Refund policy** | Order state machine | Soft — affects the cancellation UX, not blocker for first booking |
| 5 | **Cleaner shift / assignment** automation | Admin UI flow | Soft — manual assignment is fine for first ~50 orders |
| 6 | **First-response SLA** | Manager workflow | Soft — informs notification timing |
| 10 | **"Verified" cleaner meaning** | Verification badge logic | Soft — admin can verify based on whatever process is decided |
| 3 | **B2B in MVP scope** | Order schema, billing | Soft — toggle today is decorative |

### 3c. Blocked on external accounts

We need actual accounts/keys before these adapters can switch off stubs. Each is a one-line factory swap once the keys exist.

| Provider | Used for | Where it plugs in |
|---|---|---|
| **Mobizon** (or chosen SMS) | OTP + last-resort SMS | `apps/api/src/notifications/sms/providers/mobizon.provider.ts` (already written, just needs `MOBIZON_API_KEY`) |
| **2GIS** | Geocoding | New `apps/api/src/geocoding/providers/two-gis.provider.ts` against the existing `GeocodingProvider` interface |
| **Kaspi Pay** | Payments | New `apps/api/src/payments/` module (not yet scaffolded — blocked) |
| **FCM / APNs** | Push notifications | Replace `PushStubChannel` |
| **Twilio or Meta WhatsApp** | WhatsApp | Replace `WhatsappStubChannel` |
| **Telegram Bot API** | Telegram + account-linking deep link | Replace `TelegramStubChannel` + new linking flow |
| **SendGrid / SMTP** | Email | Replace `EmailStubChannel` |
| **Object storage** | Uploads | New `apps/api/src/uploads/` module |

---

## §4 — Phase 4: Mobile + production polish

After soft launch, before "go heavy on marketing".

| # | Item | Effort | Notes |
|---|---|---|---|
| 1 | **Telegram account-linking** flow | S (~2h, after bot token) | Bot deep link → one-time token → API binds `telegramChatId` |
| 2 | **Device-token registration** endpoint | S (~1h) | `POST /me/devices` for FCM/APNs tokens. Needs the mobile app first. |
| 3 | **`apps/mobile`** (Expo) | L (~1-2 weeks) | iOS + Android. Same API client, same WS, same booking flow. |
| 4 | **Mobile push integration** | M (~3h) | After items #2 + #3 + FCM project. |
| 5 | **Branded mobile splash + icons** | S (waiting on design) | |
| 6 | **App Store / Play Store** submissions | M (~3-5d real-time) | TestFlight + Play internal track first. |
| 7 | **Audit log table** for admin actions | S (~2h) | `AdminAuditEvent` rows on every cleaner/review/order admin mutation. Compliance grade-up. |
| 8 | **Slot-booking advisory locks** | M (~3h) | Postgres advisory locks on `assignCleaner` so two managers can't race. Only matters with real volume. |
| 9 | **Notification retry queue** (BullMQ) | M (~3h) | Failed sends get retried with backoff. Today they're logged-and-forgotten. |
| 10 | **Quiet hours** + per-user notification rate limits | S (~2h) | "No push between 22:00–08:00 local" is a common ask. |
| 11 | **DB-backed notification templates** | M (~2h) | Move templates from inline TS to DB so admins can edit copy. |

---

## §5 — Phase 5: Scale + integrations

When the operator team has 100+ orders/week and needs to plug into more systems.

| # | Item | Effort | Notes |
|---|---|---|---|
| 1 | **Subscriptions module** | M (~1d) | `Subscription` table + cron creates a draft order N days ahead. Recurring cleanings = significant LTV. |
| 2 | **Webhook outbox** for Bitrix24 | M (~1d) | Append-only events table + cron pushes to Bitrix CRM. Same `ORDER_STATE_CHANGED` listener pattern as everything else. |
| 3 | **B2B catalog + invoicing** (if scope confirmed) | L | Separate price tiers, monthly invoicing, contract management. |
| 4 | **Performance testing** (k6) | M | Identify bottlenecks at 10x current capacity. |
| 5 | **Security audit** | M (external) | Pen-test before scaling marketing spend. |
| 6 | **GDPR-style data export / delete** endpoints | S (~3h) | KZ personal-data law has similar provisions. |
| 7 | **Multi-city expansion** | M | Schema is ready (`City` is FK on `Address`). Mostly an operations question — onboarding cleaners + service variants per city. |
| 8 | **Map on /contacts page** (Leaflet + 2GIS tiles) | S (~2h, after 2GIS) | |
| 9 | **Mobile bottom nav** for /book + /orders | S (~2h) | The reference is mobile-first; current desktop layout works on mobile but isn't optimized. |
| 10 | **Cleaner-side mobile flow** | M | Cleaners would use the mobile app to mark `en_route → in_progress → done`. Today they need a manager. |

---

## What's deliberately good-enough for now

These are limitations I'm aware of and chose not to fix yet. Each one only matters at a specific scale or under a specific decision.

- **Inline notification templates** — fine until the ops team wants to edit copy.
- **No admin audit log** — fine until compliance asks who suspended a cleaner and when.
- **Manual cleaner assignment** — fine until volume requires round-robin or skills-based routing.
- **Photo/resume uploads not wired** — schema reserves columns; gated on storage decision.
- **Audience toggle (For home / For business) is decorative** — unblocked by question #3.
- **No retry queue for failed notifications** — fine when stubs always succeed; matters once real providers fail intermittently.
- **No CI** — fine for solo development; matters the first time a teammate joins.

---

## Critical path to soft launch

If a single goal is "first paying customer in 2 weeks," the order is:

1. **Get the answers**: Kaspi onboarding date (#1), SMS provider (#2), receipts approach (#7), object storage (#9).
2. **Wire the real providers** — Mobizon, 2GIS, FCM (basic), email (SMTP). All in parallel; ~3 days total once accounts exist.
3. **Build Kaspi adapter** + tighten state machine to require `paid → assigned`. ~2-3 days.
4. **Privacy + Terms pages** (legal copy required). ~1 day to write, paste.
5. **Production deploy** (Docker, KZ VPS, Caddy, Postgres, Redis, secrets, backups). ~1-2 days.
6. **One Playwright E2E test** that exercises the booking flow against the real deploy. ~half a day.
7. **Onboard 5-10 real cleaners** through admin app + verify them. Operations.
8. **Soft launch** to a small cohort.

Phase 4 work (mobile, retries, B2B) can come after. Phase 5 is post-product-market-fit.

---

## Related

- [[done]] — what's already shipped
- [[open-questions]] — outstanding client decisions, with severity
- [[../architecture/locked-decisions]] — what's already nailed down
