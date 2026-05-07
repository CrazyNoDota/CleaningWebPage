# Global Plan — Cleaning Service Platform

**Source:** ТЗ Клининговое приложение.docx (v1.0, Апрель 2026)
**Decisions locked with client:**
- Scope: full platform — Web (client + admin) + Mobile (iOS + Android) + Backend
- Stack: Next.js (App Router) frontends, NestJS backend, PostgreSQL + Redis
- Existing `index.html` / `styles.css` / `*.jpg` are kept as **visual reference only**
- Target market: **Kazakhstan** — KZT, +7 7xx phones
- **Payment:** Kaspi Pay (only provider in MVP; adapter still keeps door open for Halyk epay later)
- **Maps:** **2GIS** (best KZ city coverage, generous free tier, KZ company)
- **Notifications:** SMS only for OTP at signup; transactional alerts via Push + WhatsApp + Telegram + Email (SMS fallback only when user has no WhatsApp + no Telegram + no app installed)
- **Cleaners model:** company employees (not contractors / not marketplace)
- **Languages at launch:** Russian, Kazakh, English (3 locales from day 1)
- **Cities at launch:** single city, but multi-city schema is in MVP (cheap insurance)
- **CRM:** none today; Bitrix24 integration likely later → webhook outbox in MVP
- **Hosting:** local KZ VPS (data residency under KZ Personal Data Law)
- **Connectivity:** fully online (no offline mode in mobile)
- **Branding:** logo + colors provided later; we ship with a neutral design system and reskin during polish

---

## 1. Goals of this plan

1. Translate the ТЗ into a buildable architecture with clear module boundaries.
2. Design every boundary so the v2 items in §9 of the ТЗ (cleaner app, loyalty, CRM, 1C, multi-language, marketplace, dark theme, real-time chat) can be added **without rewrites**.
3. Sequence the work so that we ship a usable MVP early and layer features on top.

---

## 2. Open questions

Most have been answered (see "Decisions locked" above). Remaining open items:

| # | Question | Why it matters | Status |
|---|----------|----------------|--------|
| 1 | When can Kaspi merchant onboarding start? | Kaspi merchant approval can take 2-4 weeks; it's on the critical path. | Pending — needs to start in week 1 of Phase 1. |
| 2 | Which SMS provider for OTP only? **Mobizon**, **SMS Center KZ**, or **Kazinfoteh**? | OTP volume will be low (~1-2 SMS per signup), so cost difference is small. Mobizon has the simplest API and KZ presence. | Pending — recommend **Mobizon** unless client prefers another. |
| 3 | WhatsApp Business API — direct via Meta or via aggregator (Twilio / 360dialog / Wazzup)? | Meta direct is cheaper but slower onboarding (~2 weeks, business verification). Aggregators are faster but ~3× the per-message cost. | Pending — recommend **Wazzup** (KZ-friendly, ~1 day onboarding, RU/KZ support). |
| 4 | Telegram bot — single brand bot, or also support agents replying from their personal Telegram? | Bot-only is the standard; agent-replies need a separate chat platform. | Pending — recommend bot-only for v1. |
| 5 | Does "юридические лица" (B2B) need invoicing, contracts, separate pricing in MVP, or is the B2B story just "they can also book"? | The static mockup splits "Для дома" / "Для бизнеса" but the ТЗ has no B2B-specific features. | Pending — recommend simple "they can also book" for MVP. |
| 6 | Initial city — Astana only, or also Almaty at launch? | Affects pricing tables and time-slot setup data. | Pending. |
| 7 | Specific KZ VPS provider — PS Cloud Services, Kazakhtelecom Cloud, or self-managed dedicated? | Affects ops model and monthly cost (~$50-300/mo range). | Pending. |
| 8 | Will the client supply translated copy for Kazakh and English, or do we arrange translation? | Russian copy is implicit; Kazakh + English need a translator. | Pending. |

---

## 3. High-level architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Client Web   │  │ Admin Web    │  │ Mobile (iOS + Android)   │   │
│  │ Next.js SSR  │  │ Next.js SPA  │  │ React Native + Expo      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────┘   │
└─────────┼─────────────────┼──────────────────────────┼───────────────┘
          │                 │                          │
          │            HTTPS / TLS 1.3 (REST + WebSocket)
          │                 │                          │
┌─────────▼─────────────────▼──────────────────────────▼───────────────┐
│                         API GATEWAY                                  │
│         (NestJS app — single deploy, modular monolith)               │
│                                                                      │
│  Cross-cutting: AuthGuard (JWT), RoleGuard, RateLimit, RequestId,   │
│                 i18n, audit-log interceptor, OpenAPI (Swagger)       │
│                                                                      │
│  ┌────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Auth       │ │ Catalog &   │ │ Orders   │ │ Subscriptions    │   │
│  │ (JWT, OTP, │ │ Pricing     │ │ + Status │ │ (recurring jobs) │   │
│  │  OAuth)    │ │ engine      │ │ machine  │ │                  │   │
│  └────────────┘ └─────────────┘ └──────────┘ └──────────────────┘   │
│  ┌────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Payments   │ │ Notifications│ │ Reviews  │ │ Admin / RBAC     │   │
│  │ (adapter)  │ │ (adapter)    │ │          │ │ + Audit log      │   │
│  └────────────┘ └─────────────┘ └──────────┘ └──────────────────┘   │
│  ┌────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Geocoding  │ │ Files / S3  │ │ Analytics│ │ Webhook outbox   │   │
│  │ (adapter)  │ │             │ │ events   │ │ (CRM/1C ready)   │   │
│  └────────────┘ └─────────────┘ └──────────┘ └──────────────────┘   │
│                                                                      │
│  Internal event bus (BullMQ on Redis) — modules publish DomainEvents │
└────┬───────────────┬────────────────┬───────────────────┬────────────┘
     │               │                │                   │
┌────▼────┐    ┌─────▼─────┐    ┌─────▼─────┐      ┌──────▼─────────┐
│Postgres │    │ Redis     │    │ S3 (KZ)   │      │ External APIs  │
│(Prisma) │    │ cache+queue│   │ media     │      │ Kaspi, Yandex, │
└─────────┘    └───────────┘    └───────────┘      │ Mobizon, FCM,  │
                                                    │ SendGrid, APNs │
                                                    └────────────────┘
```

### 3.1 Why modular monolith, not microservices

ТЗ §7.1 says "microservices **or** modular monolith." We pick **modular monolith** because:

- Team is small (10-50 cleaners ≠ 50 engineers); microservices add ops overhead with no payoff at this scale.
- Modules below have explicit boundaries (DI tokens, no direct DB access across modules) — when a module needs to be split out, it can be lifted with minimal refactor.
- Single Postgres schema is much easier to evolve during MVP than distributed transactions.

### 3.2 Repository layout (monorepo)

We'll use **pnpm workspaces + Turborepo**. One repo, four deployables, shared types.

```
/apps
  /api              NestJS backend
  /web-client       Next.js (public site + client portal)
  /web-admin        Next.js (admin panel — separate app, separate domain)
  /mobile           React Native (Expo)
/packages
  /shared-types     Zod schemas + TS types (single source of truth, used by api/web/mobile)
  /api-client       Generated TypeScript client from OpenAPI (used by web + mobile)
  /ui-kit           Shared React components (web only; mobile has its own)
  /config           ESLint, Prettier, tsconfig presets
  /i18n-keys        Translation key catalog (extensible to multiple languages)
/infra
  /docker           Dockerfiles + docker-compose for local dev
  /k8s              Helm charts (for prod, when scale demands)
  /terraform        Cloud infra (optional, if we go to managed cloud)
```

---

## 4. Core domain model

Designed up-front to support both MVP requirements and v2 extensions. **Soft deletes everywhere** (`deleted_at`) so the cancel-account / GDPR-style requests in ТЗ §7.3 don't break referential integrity.

### 4.1 Entities

| Entity | Key fields | Notes / extension hooks |
|--------|-----------|-------------------------|
| `User` | id, phone, email, name, role, locale, created_at | role enum extensible: `client`, `admin`, `operator`, `manager`, `cleaner` (cleaner role exists from day 1 even though cleaner app is v2 — keeps DB stable) |
| `OAuthAccount` | user_id, provider, provider_user_id | Apple/Google sign-in; new providers are additive |
| `Address` | user_id, label, lat, lng, city, street, building, apt, comment | `lat/lng` always stored (geocoded once); city is FK so multi-city is free |
| `City` / `ServiceArea` | id, name, timezone, currency | Multi-city ready from day 1 (cheap insurance) |
| `Service` | id, slug, type, base_price, pricing_formula_id, active | `type` enum: `apartment`, `office`, `post_renovation`, `subscription`. New types are additive |
| `ServiceOption` | service_id, key, label_i18n, price_delta, ui_input_type | Add-ons (windows, carpet, ironing). Drives the calculator UI. |
| `PricingFormula` | id, expression (JSON DSL), version | Stored as JSON expression evaluated server-side. Lets admins change pricing without redeploy. |
| `PaymentMethod` | user_id, provider, token, brand, last4, is_default | Provider-agnostic. Tokens are stored in the gateway; we hold opaque references only (PCI-DSS compliance per ТЗ §2.3) |
| `Order` | id, user_id, service_id, address_id, scheduled_at, slot_id, status, total, currency, payment_id, cleaner_id?, source | `source` enum: `web`, `mobile`, `admin`, `subscription`, `crm` — for analytics + future CRM imports |
| `OrderEvent` | order_id, type, payload, actor_id, at | Event-sourced status history. All status changes write here → drives notifications + audit log + admin timeline |
| `OrderItem` | order_id, option_key, qty, unit_price | Snapshot of options at booking time (prices change later but order is immutable) |
| `Subscription` | user_id, service_id, frequency, day_of_week, slot, address_id, payment_method_id, status, paused_until | Generates `Order` rows via cron |
| `TimeSlot` | service_area_id, date, start, end, capacity, booked_count | Capacity model is per-area-per-day so multi-city scales |
| `Cleaner` | user_id, specialization[], rating_avg, photo_url, active | Linked to a `User` row with role=cleaner; extensible into full cleaner-app data later |
| `CleanerAssignment` | cleaner_id, order_id, status | Many-to-one with order (allows team cleanings later) |
| `Review` | order_id, rating, text, photos[], moderated_by, published_at | Photos in S3; moderation flag in admin |
| `Promo` | code, discount_pct or discount_amount, valid_from, valid_to, max_uses, conditions | Conditions stored as JSON predicate (extensible) |
| `LoyaltyAccount` | user_id, balance, tier | **Skeleton table only in MVP**, populated when v2 loyalty ships. Reserves the slot. |
| `Notification` | user_id, channel, template_key, payload, status, sent_at | Persists every send → admin can debug "did the SMS go out?" |
| `WebhookSubscription` | id, owner (admin/system), url, event_types[], secret | Event-driven outbox so CRM/1C/marketing tools subscribe without code changes |
| `AuditLog` | actor_id, action, entity, entity_id, before, after, at | All admin mutations logged (ТЗ §3.1) |

### 4.2 Order status state machine

ТЗ §3.7 defines the statuses; we encode them as a state machine, not free strings.

```
created ──pay──► paid ──assign──► assigned ──depart──► en_route
                                                            │
                                                          arrive
                                                            ▼
                                                       in_progress
                                                            │
                                                         complete
                                                            ▼
                                                         done ──review──► reviewed
                                                            
   any non-terminal ──cancel──► cancelled (triggers refund flow)
```

- Each transition is a method on `OrderService` that publishes a `DomainEvent`.
- Notifications, analytics, and webhooks subscribe to events — not to direct calls — so adding "send to CRM on `OrderCompleted`" is one line later.
- Real-time updates to client: server pushes `OrderEventCreated` over WebSocket (Socket.IO namespace per `user_id`).

---

## 5. Module breakdown (NestJS)

Each module is a directory with `module.ts`, `controller.ts`, `service.ts`, `repository.ts`, `dto/`, `events/`. **No module imports another module's repository directly** — they go through services or events. This is the boundary we'll preserve for the eventual split.

### 5.1 Auth
- JWT access (15 min) + refresh (30 days, rotated). Refresh tokens stored hashed in Postgres → revocable.
- OTP via SMS (Mobizon adapter) for phone signup.
- Apple Sign-In, Google Sign-In via `passport` strategies.
- 2FA TOTP for admins (ТЗ §2.3) — schema present from day 1, UI in MVP for admins only.
- `RoleGuard` + `PermissionGuard` (RBAC). Permissions stored in DB, not hardcoded → new admin sub-roles cost zero code.

### 5.2 Catalog & Pricing
- `Service` + `ServiceOption` + `PricingFormula`.
- **Pricing formula DSL** (small JSON expression language, evaluated server-side):
  ```json
  {"+": [
    {"*": [{"var": "area_m2"}, {"const": 250}]},
    {"*": [{"var": "rooms"}, {"const": 1500}]},
    {"sum_options": true}
  ]}
  ```
  Why a DSL: client wants to "add things they come up with later." Admin UI lets non-engineers edit formulas without redeploys. Versioned so old orders stay reproducible.
- `/api/v1/pricing/quote` endpoint — same code path is used by web calculator, mobile calculator, and final order submission. **One source of price truth.**

### 5.3 Orders
- 5-step wizard is a **frontend concern**; backend exposes a single `POST /orders` that accepts the full payload (validated by Zod). Drafts (ТЗ §3.3) are saved as `Order(status=draft)`.
- Slot booking uses a Postgres advisory lock per `(service_area_id, slot_id)` to prevent double-booking under concurrency.
- Cancellation flow checks gateway refund eligibility before changing status.

### 5.4 Subscriptions
- A nightly cron (BullMQ repeating job) materializes `Subscription` → `Order(status=draft)` 24h ahead.
- A second cron runs at slot time to attempt payment. Failure → notify client + pause subscription.
- Pause / resume / change-schedule endpoints — all in client portal.

### 5.5 Payments (adapter pattern)
```
PaymentsService
  ├── interface PaymentProvider
  │     create(amount, currency, customer): PaymentIntent
  │     capture(intentId)
  │     refund(intentId, amount?)
  │     storeMethod(customer, methodInput): TokenizedMethod
  │     chargeStored(token, amount): PaymentIntent
  │     verifyWebhook(req): Event
  ├── KaspiPayProvider          ← MVP, Kazakhstan
  ├── HalykEpayProvider         ← optional, KZ
  ├── YooKassaProvider          ← stub, future RU expansion
  └── StripeProvider            ← stub, future intl
```
Switching markets = switching one DI binding. PCI compliance: we never see raw card data; all tokens live in the gateway.

### 5.6 Notifications (adapter pattern)
- `NotificationService.send(user, templateKey, channels[], data)`.
- Channels at launch (all are adapters):
  - `PushAdapter` — FCM (Android) + APNs (iOS), wrapped via Expo Notifications
  - `EmailAdapter` — SendGrid (swappable to UniSender / Mailgun)
  - `WhatsAppAdapter` — Wazzup or Twilio WhatsApp Business API (recommend Wazzup for KZ)
  - `TelegramAdapter` — Telegram Bot API directly (free, trivial to host)
  - `SmsAdapter` — Mobizon (used **only** when no other channel is available)
- Templates stored in DB with i18n keys (one row per locale × template) → admin can edit copy and translations without redeploy.
- Triggered by domain events (subscriber pattern), never called directly from controllers. Adding a new channel later = one new adapter, no business-logic changes.

#### 5.6.1 Channel-routing strategy

This is the answer to "do we really need SMS?" — we minimize SMS without losing reliability.

| Event | Primary | Fallback chain |
|-------|---------|----------------|
| OTP at signup | **SMS** | (no fallback — SMS is the universal first-touch channel; the user has no app/account/Telegram bot link yet) |
| Login OTP for known user | Push (if app installed) | → WhatsApp → Telegram → SMS |
| Order created / paid | Push + Email | (no SMS) |
| Cleaner assigned | Push | → WhatsApp → Telegram |
| 24h reminder | Push + WhatsApp | → Telegram → Email → SMS only if all silent |
| Order completed + review request | Push + Email | (no SMS) |
| Payment failed (subscription) | Push + WhatsApp + Email | → SMS as last resort |
| Refund | Push + Email | (no SMS) |

User profile has per-channel toggles (per ТЗ §3.6). The router respects them and walks the fallback chain only over enabled channels.

**Why this works without SMS as primary:** WhatsApp + Telegram cover ~95% of KZ users with cheaper, richer messages (links, buttons, brand). SMS is kept as the safety net for OTP and for payment-critical alerts to users with neither WhatsApp nor Telegram.

#### 5.6.2 Telegram bot bootstrap
Each user gets a unique deep link (`t.me/your_bot?start=<token>`) shown in their profile. When they tap it, the bot binds their `chat_id` to their account → from then on transactional messages flow over Telegram. No-cost channel.

#### 5.6.3 WhatsApp template approval
WhatsApp Business requires Meta-approved templates for transactional messages (free-form chat is rate-limited). Plan to draft and submit the ~10 transactional templates (in 3 languages) during Phase 1 — Meta review is 1-3 business days.

### 5.7 Geocoding (adapter pattern)
- `GeocodingProvider` interface: `autocomplete`, `geocode`, `reverseGeocode`.
- **Primary: 2GIS** — best Astana/Almaty street-level coverage, free tier ~50k requests/day, KZ company (lower latency, no licensing surprises). Also gives us interactive map embed and directions for the cleaner-app v2.
- `YandexMapsProvider` kept as a fallback adapter (one binding swap if 2GIS quota becomes a problem).
- All call sites use the interface so providers are swappable.

### 5.8 Reviews
- Photos uploaded to S3 via presigned URLs (no proxy through API).
- Moderation queue in admin; nothing is publicly visible until `published_at` is set.

### 5.9 Admin
- Lives in the same NestJS app under `/admin/v1/*` with `RoleGuard(['admin','operator','manager'])`.
- Audit log interceptor on all `POST/PATCH/DELETE` routes.
- CSV/Excel export uses streaming so 100k-row reports don't OOM.

### 5.10 Analytics
- Every domain event is also written to an `events` table (append-only).
- Dashboards in admin read from this table (or a materialized view, later).
- Same events are mirrored to Amplitude / GA via a sink job → product analytics work without coupling business code to a vendor.

### 5.11 Webhook outbox (the "extensibility insurance policy")
- Any external system can subscribe to events: `order.created`, `order.completed`, `payment.refunded`, etc.
- Outbox pattern: events are written to a table inside the same DB transaction as the state change, then a worker delivers them with retries + signing.
- This single feature de-risks all of v2 §9: CRM, 1C, marketing automation, custom analytics — they all just consume webhooks.

---

## 6. Frontend plan

### 6.1 Client Web (`apps/web-client`) — Next.js 15, App Router
- **Public, SSR pages** (SEO, ТЗ §4.2): `/`, `/services`, `/services/[slug]`, `/calculator`, `/about`, `/contacts`, `/faq`, `/blog`, `/blog/[slug]`.
- **Authenticated pages**: `/cabinet/orders`, `/cabinet/orders/[id]`, `/cabinet/addresses`, `/cabinet/payment-methods`, `/cabinet/subscriptions`, `/cabinet/settings`, `/cabinet/notifications`.
- **Booking wizard** as `/order/new` — 5 steps, draft persisted to backend on every step (so a user can come back from another device).
- **Design system**: Tailwind + shadcn/ui. Tokens (colors, spacing, radii) defined as CSS variables → dark theme (v2) is just a second token sheet.
- **Auth**: cookies (httpOnly, SameSite=Lax), refresh handled by Next.js middleware to avoid client-side token juggling.
- **i18n**: `next-intl` with namespaces. **Three locales at launch: Russian (default), Kazakh, English.** Locale switcher in header. URL strategy: `/ru/...`, `/kk/...`, `/en/...` for SEO. Russian copy written by us; Kazakh + English supplied by client or via translator (open question #8).
- **Accessibility**: WCAG 2.1 AA — minimum contrast, 44×44 touch targets, keyboard navigation, semantic HTML, aria-live regions on order-status updates.

### 6.2 Admin Web (`apps/web-admin`) — Next.js, separate domain (`admin.example.kz`)
- Different domain prevents accidental cookie/CSRF leakage from client app.
- Heavy data grids: TanStack Table + virtualization.
- Real-time order list updates via WebSocket subscription.
- Charts: Recharts (light dependency) for the dashboard.
- No SSR needed — pure SPA inside Next.js works fine.

### 6.3 Mobile (`apps/mobile`) — React Native + Expo
- Why Expo: OTA updates (push small fixes without re-submitting to stores), one toolchain for iOS+Android.
- Navigation: Expo Router (file-based, mirrors Next.js mental model).
- State: TanStack Query (same as web → consistency).
- Push: Expo Notifications wrapping FCM/APNs.
- Sign in with Apple is **mandatory** for App Store approval (ТЗ §3.1) — implemented from day 1.
- Calculator + wizard reuse the **same `@cleaning/api-client` and same Zod schemas** as web → no logic drift.

### 6.4 Shared design between web and existing mockup
The existing `index.html` / `styles.css` / `*.jpg` are kept in `/design/reference/` and used as visual reference for the designer. We don't import that CSS into the new app — we re-implement the look in Tailwind + shadcn so it's themable, dark-mode-ready, and accessible.

---

## 7. Non-functional approach

| Requirement (ТЗ §) | Implementation |
|--------------------|----------------|
| Response time <500ms p95 (§2.2) | Postgres indexes on hot paths, Redis cache for catalog and slot availability, n+1 prevention via DataLoader pattern, k6 load tests in CI |
| 500 concurrent users (§2.2) | Stateless API → horizontal scale. Single Node process handles ~500 with current load assumptions; Kubernetes HPA when needed. |
| 99.5% uptime (§2.2) | Health endpoints, blue/green deploy, DB connection pooling (PgBouncer), graceful shutdown, status page |
| TLS 1.3, JWT, bcrypt/Argon2 (§2.3) | Argon2id (better than bcrypt), HSTS, CSP, refresh token rotation, JWT signed with RS256 |
| PCI-DSS (§2.3) | We never store PAN — gateway tokenization only. Annual SAQ-A scope. |
| Backups daily, 30 days (§7.2) | Postgres `pg_basebackup` + WAL archiving to S3-compatible KZ storage. Restore drill quarterly. |
| Logs ≥90 days (§7.2) | App logs to stdout → collector (Loki or CloudWatch) → S3 cold storage |
| Account deletion (§7.3) | "Delete my account" endpoint anonymizes PII, keeps order history with `user_id=null` for accounting compliance |
| OpenAPI docs (§7.4) | Auto-generated from NestJS decorators; published at `/api/docs` |
| Sentry (§5) | Wired into all 4 deployables from day 1 |

---

## 8. Extensibility checklist (mapped to ТЗ §9)

How each v2 item plugs in **without rewrites**:

| v2 feature | Already designed-for? | What's needed at v2 time |
|------------|----------------------|--------------------------|
| Cleaner mobile app | Yes — `Cleaner` + `CleanerAssignment` exist; cleaner role exists in RBAC | New Expo app + cleaner-scoped API endpoints |
| Real-time chat | Partially — WebSocket gateway already in API | New `Conversation` + `Message` tables + chat UI |
| Loyalty / referral | Yes — `LoyaltyAccount` skeleton + promo system | Earn/redeem rules + UI |
| CRM (Bitrix/AmoCRM) | Yes — webhook outbox + `source` field on orders | One adapter that consumes our webhooks → CRM API |
| 1C accounting | Yes — same outbox | 1C connector reads webhook stream |
| Dark theme | Yes — token-based design system | Second token sheet + toggle |
| Multi-language (4th locale, e.g. Uzbek) | Yes — `next-intl` + i18n keys + DB-stored notification templates with one row per locale. RU/KK/EN ship in MVP. | Translate the keys |
| Cleaner marketplace | Yes — `Cleaner` is a separate entity, not just a name on orders | Listing UI + selection step in wizard + payout module |

---

## 9. Sequencing (mapped to ТЗ §6, but adjusted for our stack)

**Total: ~22 weeks** (within ТЗ's 20-24 week window).

### Phase 0 — Foundation (1 week, parallel with Phase 1)
- Monorepo setup, CI/CD (GitHub Actions), Docker dev env, Postgres + Redis locally
- Linting, formatting, conventional commits, branch protection
- Sentry + logging plumbing
- Skeleton of `apps/api`, `apps/web-client`, `apps/web-admin`, `apps/mobile`

### Phase 1 — Analysis & Design (3 weeks)
- Resolve open questions §2 of this doc with client
- Final wireframes (Figma) for all 4 frontends
- Final ER diagram + initial Prisma schema
- API contract draft (OpenAPI YAML) — locks the contract before parallel frontend/backend work

### Phase 2 — Backend MVP (6 weeks, can overlap with Phase 1 in week 3)
Order matters because later modules depend on earlier ones:
1. Auth + Users + RBAC (week 1)
2. Catalog + Pricing engine (week 2)
3. Orders + Slots + state machine (week 3)
4. Payments adapter + Kaspi integration (week 4)
5. Notifications adapter + FCM + Mobizon + SendGrid (week 5)
6. Subscriptions + Reviews + Webhook outbox + Admin endpoints (week 6)

### Phase 3 — Web (5 weeks, starts week 4 of Phase 2)
- Client web: public site → calculator → wizard → cabinet (3 weeks)
- Admin panel: orders → cleaners → catalog → analytics dashboard (2 weeks)

### Phase 4 — Mobile (6 weeks, starts week 5 of Phase 2)
- Auth + onboarding (1 week)
- Catalog + calculator (1 week)
- Wizard + payment + Apple/Google Pay (2 weeks)
- Cabinet + push notifications + status tracking (1 week)
- Polish + store-submission assets (1 week)

### Phase 5 — Integration + QA (3 weeks)
- E2E tests (Playwright for web, Detox for mobile)
- Load test (k6) — must hit ТЗ §2.2 numbers
- Security review (OWASP top 10, dependency audit)
- Penetration-test friendly audit log review
- Bug bash

### Phase 6 — Launch + Hypercare (4 weeks)
- App Store + Google Play submission (start week 1, expect 2-week review for first release)
- Production deploy + smoke tests
- Privacy policy + terms + KZ Personal Data compliance docs
- 1 month of bug fixes + tuning included

---

## 10. Acceptance criteria checklist (from ТЗ §8)

| Criterion | How we verify |
|-----------|---------------|
| Phone registration + Google/Apple login | E2E test in CI |
| 5-step wizard ends with email confirmation | E2E test (web + mobile) |
| Card charge + electronic receipt | Manual + Kaspi sandbox test |
| Subscription auto-creates orders + auto-charges | Cron simulation in staging |
| Push + email + SMS on key events | Notification log inspection in admin |
| Admin status change → client sees real-time update | Playwright + Socket.IO assertion |
| CSV report export from admin | E2E test |
| API <500ms at 200 concurrent | k6 report attached to release |
| Apps published in App Store + Google Play | Store URLs in release notes |

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Kaspi Pay merchant onboarding can take 2-4 weeks | Start application in week 1 of Phase 1; build with a stub provider in parallel so dev isn't blocked |
| WhatsApp Business template approval delays | Draft and submit templates during Phase 1; SMS + Email fallback covers the gap if templates aren't approved by launch |
| App Store review rejects on first submission | Submit a TestFlight build by end of Phase 4 week 4; allow 2 review cycles in schedule |
| Pricing formula DSL is over-engineered | If client confirms pricing is truly static, swap DSL for simple per-service columns — no other code changes |
| Kazakh / English copy not ready at launch | Russian ships first; KK + EN can be turned on per-page as translations land (locale switcher hides incomplete locales) |
| KZ data residency law (Personal Data) | KZ-resident hosting confirmed by client. Document data flow + retention; user-data-export endpoint from MVP |
| Designer not lined up | Start engineering with shadcn/ui + neutral palette; reskin in Phase 5 polish when logo + colors arrive |

---

## 12. Definition of Done (per feature)

A feature is "done" when:
1. Code merged to `main` behind CI green (lint, type-check, unit, integration tests)
2. OpenAPI contract updated and `@cleaning/api-client` regenerated
3. Used by at least one frontend (web or mobile) — **no orphan endpoints**
4. Admin can observe it (audit log entry, or admin UI surface, or analytics event)
5. Documented in `/docs` (one short page per module)
6. Manual QA pass on staging

---

## 13. What we're explicitly NOT doing in MVP

To keep MVP lean (and because they're listed v2 in ТЗ §9):

- Cleaner mobile app — **but** cleaner data model + role exist
- Real-time chat — **but** WebSocket transport is in place
- Loyalty / referral — **but** `LoyaltyAccount` table exists
- CRM / 1C connectors — **but** webhook outbox is shipped
- Dark theme — **but** design system uses tokens
- *(Multi-language is shipped in MVP: RU/KK/EN. Adding a 4th is translation-only.)*
- Cleaner marketplace — **but** `Cleaner` is a first-class entity

The pattern: every v2 feature gets the **boring foundational piece** in MVP so that adding the v2 feature later is product work, not a refactor.
