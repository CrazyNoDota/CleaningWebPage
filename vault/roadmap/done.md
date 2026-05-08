---
title: Done — historical log
tags: [roadmap, done]
updated: 2026-05-08
---

# Done — historical log

What's been built and shipped, in roughly the order it landed. For what's *next*, see [[plan]].

## Foundation (Phase 1)

- [x] Monorepo scaffold (pnpm + turbo)
- [x] Postgres + Redis via docker-compose
- [x] Prisma schema, migrations, seed
- [x] Build pipeline switched to plain `tsc` → [[../decisions/ADR-002-tsc-over-nest-build]]
- [x] Web client scaffold with `next-intl` (RU/KK/EN locale prefixes)

## Backend modules (Phase 2)

- [x] Auth — phone OTP (Argon2id) + JWT pair + refresh rotation → [[../modules/auth]]
- [x] Users — `/me` GET/PATCH including notification prefs → [[../modules/users]]
- [x] SMS adapter (stub + Mobizon) → [[../modules/notifications-sms]]
- [x] Catalog — `/services`, `/services/:slug`, locale resolver → [[../modules/catalog]]
- [x] Pricing — JSON DSL + `/pricing/quote` + 7 unit tests → [[../modules/pricing]]
- [x] Cleaner profiles + `Cleaner` schema extensions → [[../modules/cleaner-profile]]
- [x] Cleaner admin CRUD endpoints (`POST/GET/PATCH /admin/cleaners`)
- [x] Orders — state machine + customer + operator endpoints + audit log → [[../modules/orders]]
- [x] `addressId` tightened to required on `POST /orders`
- [x] Reviews — moderation queue + running-mean cleaner stats → [[../modules/reviews]]
- [x] Realtime — Socket.IO push on every state change → [[../modules/realtime]]
- [x] Notifications router — push/wa/tg/email/sms with priority + audit → [[../modules/notifications]]
- [x] Job applications — public submit + ops fan-out → [[../modules/job-applications]]
- [x] Addresses — full CRUD + soft delete + geocoding adapter → [[../modules/addresses]]
- [x] Admin orders endpoints — `GET /admin/orders` listing + `:id` detail with relations + event log

## Frontend — public site (Phase 2)

- [x] Web client booking wizard (5 steps) → [[../modules/web-client]]
  - Service → Configure (live quote) → Address → Schedule → Confirm
- [x] Phone OTP login with refresh-on-401 fetch wrapper
- [x] Live order page with WebSocket subscription, status timeline, cleaner card
- [x] Star rating + comment review form on `done` orders
- [x] Re-themed to forest green + Inter font matching `design/reference/`
- [x] Multi-section home page (hero / stats / audience / insurance / services / rooms / pricing tiers / why-us / top cleaners / app promo / footer)
- [x] /services, /about, /contacts pages

## Frontend — admin console (Phase 2)

- [x] `apps/web-admin` scaffold (Russian-only, port 3001) → [[../modules/web-admin]]
- [x] Login with role gate (manager / admin only)
- [x] Cleaners list + create + detail (verification + suspend toggles)
- [x] Orders list + detail (cleaner picker, transition buttons, event log)

## Verification

Every backend module shipped with end-to-end smoke tests against the live API. Pricing DSL and review running-mean math have unit tests. Total: 18 backend tests passing across 3 spec files. No e2e or integration suite yet — see [[plan]] §3a.

## Related

- [[plan]] — what's left
- [[open-questions]] — what's waiting on the client
