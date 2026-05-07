---
title: Stack
tags: [architecture]
---

# Stack

| Layer | Choice | Why |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | One repo for `web-client`, `web-admin` (later), `mobile` (later), `api`. Cheap for a 1-team project. |
| Backend | NestJS 10 | Module DI suits the modular monolith plan in [[domain-model]]. |
| ORM | Prisma 6 | Type-safe, great migrations story. |
| DB | PostgreSQL 16 | Standard. Will need advisory locks for slot booking later. |
| Cache / queues | Redis 7 | OTP rate-limit, future BullMQ jobs (cron orders, webhook outbox). |
| Web | Next.js 15 App Router | SEO + SSR for the marketing/landing flow. |
| i18n | next-intl | RU / KK / EN with locale-prefixed routes (`/ru`, `/kk`, `/en`). |
| Auth | JWT 15m access + 30d refresh, rotated | See [[modules/auth]]. |
| Hashing | Argon2id | For OTP codes and (future) any password use. |

## Anti-stack (things we deliberately didn't pick)

- **Next.js API routes for backend** — too coupled, no good module story.
- **NextAuth** — phone-OTP-first flow doesn't fit it cleanly.
- **Webpack via `nest build`** — see [[decisions/ADR-002-tsc-over-nest-build]].

## Related

- [[locked-decisions]]
- [[monorepo-layout]]
