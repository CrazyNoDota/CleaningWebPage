---
title: Web client (booking wizard)
tags: [module, frontend]
status: shipped (MVP)
---

# Web client — booking wizard

`apps/web-client/`

The public-facing site. Lets a customer browse services, configure a cleaning, sign in via phone OTP, pick or create an address, schedule, and watch their order's status update live.

## Pages

| Route | Auth | Purpose |
|---|---|---|
| `/[locale]` | public | Marketing home with hero CTA |
| `/[locale]/login` | public | Phone-OTP sign-in (two-stage form) |
| `/[locale]/book` | public, auth gate at address step | 5-step booking wizard |
| `/[locale]/orders/[id]` | auth | Order detail + live status push (WebSocket) |

`[locale]` is `ru` / `kk` / `en`. Locale-prefixed routing was already wired via `next-intl`; this round just consumes it.

## Wizard steps

```
1. Service           → GET /api/v1/services
2. Configure         → POST /api/v1/pricing/quote (debounced on input)
3. Address           → GET /api/v1/addresses + POST /api/v1/addresses (inline create)
4. Schedule          → datetime-local input + free-text notes
5. Confirm           → POST /api/v1/orders → redirect to /orders/:id
```

If the user reaches the address step unauthenticated, they're sent to `/login?next=/book` and bounced back after sign-in.

## Order page

- Initial fetch: `GET /orders/:id` for status + total, `GET /orders/:id/cleaner` for cleaner card.
- Opens a Socket.IO connection to `WS_BASE/realtime`, JWT in `auth.token`, subscribes to `order:<id>`.
- On `order.updated`: patches local status, re-fetches cleaner if the event was `order.assigned`.
- Status timeline uses 7 horizontal bars, fills up to current `OrderStatus`.
- Live indicator (●) shows in the corner while the WS is connected.

## Library shape

```
src/
├── lib/
│   ├── api.ts              fetch wrapper, auth-token injection, refresh-on-401, all endpoint helpers
│   ├── auth.ts             localStorage session save/load/clear
│   ├── format.ts           tiyin → "5 000 ₸" via Intl.NumberFormat
│   ├── types.ts            TS types matching the API
│   └── use-session.ts      'use client' hook that hydrates from localStorage
├── components/
│   ├── LocaleSwitcher.tsx  (existing)
│   └── SiteHeader.tsx      brand + nav + locale switch + sign-in/-out
└── messages/
    ├── ru.json             extended with login.*, wizard.*, order.*, status.*
    ├── kk.json
    └── en.json
```

## Key design choices

- **Client-side fetch everywhere.** No SSR data loading on the wizard or order page — they all need either user input state or auth headers. The home page is still server-rendered (translations only). Adding SSR for the catalog later is fine but didn't earn its weight in MVP.
- **Single 24h-debounced `quote()` call.** Configure-step inputs trigger a debounced (`200ms`) fetch so the total updates without spamming the API. The same total is recomputed server-side at order creation time, so the UI number is just a preview.
- **Refresh-on-401 once.** The fetch wrapper retries once after attempting `POST /auth/refresh`. If that fails, the session is cleared and the next protected page redirects to `/login`.
- **WS auth via handshake.** `auth: { token: session.accessToken }` — same shape the gateway expects. Reconnection is enabled so a brief network hiccup recovers automatically.
- **Tailwind component classes** (`btn-primary`, `input`, `card`) declared in `globals.css` `@layer components` — keep markup tidy without a UI lib.

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```
Defaults fall back to localhost so `pnpm dev` works with no `.env`.

## Verified live

| Path | Result |
|---|---|
| `GET /ru` | 200, hero CTA links to `/ru/book` |
| `GET /ru/login` | Russian "Вход по номеру телефона" / "Номер телефона" |
| `GET /en/login` | "Sign in with your phone" / "Phone number" |
| `GET /ru/book` | "Заказ уборки" / "Шаг 1 из 5" / "Выберите услугу" |
| `GET /kk/book` | "Тазалауға тапсырыс" / "Қызметті таңдаңыз" |
| `GET /ru/orders/<x>` | Renders without crashing; redirects to login when unauthenticated |
| Catalog API call from wizard | Returns `"Apartment cleaning — standard"` + 2 options when `accept-language: en` |
| Web build | Clean (no TS errors after the strict-array fixes) |
| Dev-server log | No warnings beyond the pre-existing `typedRoutes` Next config nit |

## Review submission UI

When the order page receives a status push or fetches an order in status `done`, it renders a star-rating + comment form below the cleaner card. On submit, the local status flips optimistically to `reviewed`; the WS will also push the same transition, so it's idempotent. Once `reviewed`, the form swaps to a thank-you card.

Files:
- `src/components/ReviewForm.tsx` — `<ReviewForm orderId onSubmitted />` + `<ReviewThanks />` for the post-submit state.
- The order page renders one or the other based on `order.status`.

The form sends `{ rating, comment? }` to `POST /api/v1/orders/:id/review`. Tags and photos are not exposed in the UI yet — the schema columns exist (see [[../decisions/ADR-005-defer-uploads]]) but the upload pipeline and tag taxonomy are deferred.

## What's intentionally not here yet

- **Payment step** — wizard hands off to `POST /orders` and lands on the order page, no payment redirect. Comes with the Kaspi adapter.
- **Saved-address PATCH/DELETE UI** — the API is there; only create-and-pick exists in the wizard.
- **Forward-geocoding autocomplete** — the API endpoint is there (stubbed), but the wizard's address step uses a plain form. Wire in once 2GIS is integrated.
- **Review photos / tags UI** — `tags[]` and `photos[]` exist on `Review` rows; UI surface deferred until storage decision lands.
- **Nicer Tailwind theme / logo** — using the brand-blue defaults from `tailwind.config.ts`. The Russian `index.html` reference under `design/reference/` can drive a styling pass later.

## Related

- [[catalog]], [[pricing]], [[orders]], [[addresses]], [[reviews]] — every backend module the wizard exercises
- [[realtime]] — the WebSocket gateway the order page subscribes to
- [[auth]] — the OTP flow the login page consumes
