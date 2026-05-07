---
title: Addresses module
tags: [module, backend]
status: shipped
---

# Addresses module

`apps/api/src/addresses/` + `apps/api/src/geocoding/`

Saved addresses for the current user, plus a geocoding adapter (stub today, 2GIS tomorrow). The schema for `Address` shipped with the initial migration; this module finally exposes it.

## Endpoints (all JWT-guarded)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/addresses` | Create a saved address |
| GET | `/api/v1/addresses` | List my addresses (excludes soft-deleted) |
| GET | `/api/v1/addresses/:id` | Get one of mine |
| PATCH | `/api/v1/addresses/:id` | Partial update |
| DELETE | `/api/v1/addresses/:id` | Soft-delete (sets `deletedAt`) |
| POST | `/api/v1/addresses/geocode/reverse` | `{lat,lng}` → address |
| POST | `/api/v1/addresses/geocode/forward` | `{query,city?}` → suggestions |

## Validation rules

- `city` must be a slug of an active `City` (`astana`, `almaty` seeded today).
- `street` and `building` are required on create.
- `lat` / `lng` use `class-validator`'s `@IsLatitude` / `@IsLongitude` so out-of-range numbers are rejected at the DTO layer.
- All optional fields capped (label 40, apartment 20, comment 500, etc.).

## Ownership

`requireOwned(userId, id)` returns **404** uniformly when:
- The address doesn't exist
- The address is soft-deleted
- The address belongs to someone else

No information leak across these three cases — same as the Orders pattern.

## Geocoding — adapter pattern

`GEOCODING_PROVIDER` injection token mirrors `SMS_PROVIDER`. One stub today; production swap-in is mechanical:

```
src/geocoding/
├── geocoding.module.ts          factory selects provider by env var
├── geocoding.service.ts         thin facade — what the rest of the app uses
├── geocoding.tokens.ts          GeocodingProvider interface + GeocodingResult
└── providers/
    └── stub.provider.ts         deterministic synthetic data
```

`GEOCODING_PROVIDER=stub` (default) returns canned data so the wire format and client code can be exercised before 2GIS keys arrive. When keys land:

1. Create `providers/2gis.provider.ts` implementing `GeocodingProvider`.
2. Add it to the factory's `inject` array and the `if` ladder.
3. Set `GEOCODING_PROVIDER=2gis` in env.

No service-level changes anywhere else.

## Verified live

| Scenario | Result |
|---|---|
| Anonymous POST | `401` |
| Unknown city slug | `400` "unknown or inactive city" |
| Out-of-range latitude (`999`) | `400` from `@IsLatitude` |
| Create full address (label, street, building, apartment, comment, lat, lng) | All fields persisted |
| Create minimal (no apartment / lat / lng) | Works |
| List newest-first | Correct order |
| GET single | Returns full row |
| PATCH partial (label + apartment only) | Other fields untouched |
| Reverse geocode | Returns `{citySlug, formatted, street, building, lat, lng}` |
| Forward geocode `query="Республики"` | 2 synthetic suggestions |
| DELETE | Returns `{id, deletedAt}` |
| GET after delete | `404` |
| LIST after delete | Excludes deleted row |
| Cross-user GET | `404` (no info leak) |

## Order integration: now required

`POST /orders` requires `addressId` as of the addressId-tightening change. The web-client wizard always provides one (either picked from saved or created inline at the address step). The Prisma `Order.addressId` column remains nullable to keep legacy pre-tightening rows; a future migration can backfill + add `NOT NULL` once those are cleaned up.

## Related

- [[../architecture/locked-decisions]] — 2GIS chosen for the KZ market
- [[orders]] — consumer of `addressId`
- [[notifications-sms]] — same adapter pattern reused here
