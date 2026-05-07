---
title: Domain model
tags: [architecture, prisma]
---

# Domain model

Source of truth: `apps/api/prisma/schema.prisma`. This page is the *narrative*.

## Enums

- `UserRole` — `customer`, `cleaner`, `manager`, `admin`. Cleaner exists from day 1 even though they're internal-only.
- `AuthProvider` — `phone`, `google`, `apple`. Multiple `OAuthAccount` rows per user.
- `Locale` — `ru`, `kk`, `en` (see [[decisions/ADR-003-multi-locale-columns]]).
- `ServiceType` — apartment / office / window / disinfection / etc. Free-form-ish; UI groups by it.
- `OrderStatus` — `draft → pending_payment → confirmed → assigned → in_progress → completed | canceled | refunded`.
- `OrderSource` — `web`, `mobile`, `admin`, `phone`.

## Core entities

| Entity | Notes |
|---|---|
| `User` | Phone is unique. Email optional. Has `role` and soft-delete (`deletedAt`). |
| `OAuthAccount` | One per provider, links to `User`. |
| `RefreshToken` | Only **sha256 hash** stored (see [[modules/auth]]). |
| `OtpCode` | Argon2id-hashed code, attempt counter, TTL ~5min. |
| `City` | Slug + trilingual names. |
| `Address` | FK city + lat/lng for 2GIS. |
| `Service` | Trilingual name/desc, `pricingExpr Json` (the DSL — see [[modules/pricing]]), `cityId` (nullable = global). |
| `ServiceOption` | Add-on toggles/qty (windows, balcony, fridge inside, carpet count). |
| `Order` | Snapshots the price at creation. Soft delete. |
| `OrderEvent` | Append-only log of state transitions, payments, comments. |
| `Cleaner` | Internal staff record. |

## Patterns we lean on

- **Soft delete**: every user-facing table has `deletedAt`. Never hard-delete.
- **Event sourcing for orders**: status lives on the row but the *truth* of how it got there is in `OrderEvent`. Useful for refunds, audits, customer disputes.
- **Trilingual columns** instead of a join table — read perf > schema purity for catalog. See [[decisions/ADR-003-multi-locale-columns]].
- **Money as integer minor units** (tiyin) — see [[decisions/ADR-004-money-in-tiyin]].

## Related

- [[modules/auth]]
- [[modules/catalog]]
- [[modules/pricing]]
