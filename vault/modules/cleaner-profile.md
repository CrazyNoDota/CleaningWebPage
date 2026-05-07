---
title: Cleaner profile module
tags: [module, backend]
status: shipped (read-side)
---

# Cleaner profile module

`apps/api/src/cleaners/` (planned)

Public-facing read of a cleaner's profile, plus the "your cleaner" view for an active order. Trust feature — modeled on Uber / Yandex Go's driver card.

## Schema

The `Cleaner` row gets these fields beyond the existing `userId / specialization / ratingAvg / ratingCount / photoUrl / isActive`:

| Field | Type | Notes |
|---|---|---|
| `bioRu` / `bioKk` / `bioEn` | string | Trilingual short biography. Default empty. |
| `yearsOfExperience` | int | Manager-set, not auto-derived. |
| `languages` | string[] | ISO-ish codes, e.g. `['ru','kk','en','tr']`. |
| `completedOrdersCount` | int | Denormalized counter, incremented on `order.done` event. |
| `verificationStatus` | enum | `unverified / pending / verified` (+ `rejected`). |
| `verifiedAt` | DateTime? | Audit trail. |

`completedOrdersCount` is denormalized for cheap reads — the public profile gets hit on every order assignment.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/cleaners/:id` | public | Public profile (sanitized — no phone/email) |
| GET | `/api/v1/orders/:id/cleaner` | order owner | Cleaner card + current `OrderStatus` |

Sanitization is important: the public projection **does not include** the cleaner's `User.phone`, `User.email`, real name beyond first-name-and-initial, or `userId`. Direct PII never leaves this endpoint.

## Status passthrough

The "Your Cleaner" view returns the order's current `OrderStatus`. The existing enum already maps to the spec's required UI states:

| Spec UI label | OrderStatus |
|---|---|
| Assigned | `assigned` |
| On the way | `en_route` |
| Arrived | (derived: status `en_route` + recent `cleaner.arrived` event) — or new `arrived` status, see below |
| Cleaning in progress | `in_progress` |
| Completed | `done` |

Open question: do we add an `arrived` status, or derive it from a `cleaner.arrived` event? Cheaper path is the event — adds no enum migration. Decision deferred until orders module lands.

## Verification badge

The `verificationStatus` field is operator-controlled, not user-controlled. A future admin endpoint flips `unverified → pending → verified` after document checks. The public profile shows the badge only for `verified`.

The *meaning* of "verified" is open — see [[../roadmap/open-questions]] #10.

## Related

- [[reviews]] — feeds `ratingAvg` / `ratingCount`
- [[../decisions/ADR-005-defer-uploads]] — `photoUrl` upload pipeline deferred
- [[../architecture/domain-model]]
