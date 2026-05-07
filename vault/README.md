---
title: Cleaning Platform Vault
created: 2026-05-07
---

# Cleaning Platform Vault

Project knowledge base for the Ansar cleaning service platform.
Source of truth for *why* things are the way they are — the code answers *what*.

The full long-form plan still lives at [`../global_plan.md`](../global_plan.md). This vault is the curated, linkable distillation.

---

## Start here

- [[architecture/stack]] — what we picked and why
- [[architecture/locked-decisions]] — answers from the client that are now non-negotiable
- [[architecture/domain-model]] — Prisma schema overview
- [[architecture/monorepo-layout]] — where things live

## Modules built (Phase 1 + 2)

- [[modules/auth]] — phone OTP + JWT pair + refresh rotation
- [[modules/users]] — `/me` profile endpoint + role guards
- [[modules/catalog]] — services & options listing, localized
- [[modules/pricing]] — JSON DSL pricing engine + `/pricing/quote`
- [[modules/notifications-sms]] — adapter pattern, stub vs Mobizon
- [[modules/cleaner-profile]] — public cleaner card + "your cleaner" view (Uber-style trust)
- [[modules/orders]] — booking core: create, state machine, assign, transitions, event log
- [[modules/reviews]] — rating + comment + moderation, feeds cleaner stats
- [[modules/realtime]] — Socket.IO push for live order status
- [[modules/notifications]] — multi-channel router (push/wa/tg/email/sms) with user priority + audit log
- [[modules/job-applications]] — careers funnel, fans out to ops via NotificationsService
- [[modules/addresses]] — saved addresses + geocoding adapter (2GIS-ready, stub today)
- [[modules/web-client]] — public Next.js site: home, login, 5-step booking wizard, live order page

## Modules planned (Phase 2 cont'd)

- *(none right now — see [[roadmap/phase-2-progress]] for the next priorities)*

## Decisions worth re-reading

- [[decisions/ADR-001-pricing-dsl]] — why JSON DSL beats hardcoded formulas
- [[decisions/ADR-002-tsc-over-nest-build]] — we don't use `nest build`
- [[decisions/ADR-003-multi-locale-columns]] — `nameRu`/`nameKk`/`nameEn` directly in tables
- [[decisions/ADR-004-money-in-tiyin]] — minor units everywhere
- [[decisions/ADR-005-defer-uploads]] — schema reserves photo/resume columns; pipeline deferred

## Things that already bit us (read before they bite again)

- [[gotchas/nest-webpack-silent-fail]]
- [[gotchas/prisma-env-path]]
- [[gotchas/express-type-import]]

## Operating the project

- [[runbook/local-dev]] — start postgres/redis/api/web
- [[runbook/database]] — migrate, seed, studio
- [[runbook/smoke-tests]] — curl recipes for every endpoint

## Where we are

- [[roadmap/phase-2-progress]] — what's done, what's next
- [[roadmap/open-questions]] — pending answers from the client
