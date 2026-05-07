---
title: Job applications module
tags: [module, backend]
status: shipped
---

# Job applications module

`apps/api/src/applications/` (planned)

The "Become a Cleaner" / "Work with us" funnel. Replaces the suggested Google Form because (a) we want the data inside our admin panel and (b) hiring conversion analytics needs first-party events.

## Schema

`JobApplication` entity:

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `fullName` | string | |
| `phone` | string | Indexed — used for dedup. |
| `cityId` | uuid? | FK; null if applicant picks "other". |
| `cityFreeText` | string? | When cityId is null. |
| `age` | int? | Optional per spec. |
| `experience` | string? | Free-text "years + previous employers". |
| `resumeUrl` | string? | Reserved column. Upload deferred — see [[../decisions/ADR-005-defer-uploads]]. |
| `documentUrls` | string[] | Same. |
| `source` | string | `web / mobile / referral / ad-campaign-id`. |
| `status` | enum | `new / contacted / interviewing / hired / rejected`. |
| `notes` | string? | Internal. Recruiter scratchpad. |
| `createdAt` / `updatedAt` | DateTime | |

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/applications` | public (rate-limited) | Submit application |
| GET | `/api/v1/admin/applications` | manager | List with filters |
| PATCH | `/api/v1/admin/applications/:id` | manager | Update status / notes |

## Side effects on submit

- **Fan-out notification to all manager + admin users** via `NotificationsService.dispatchToUser`. Each operator gets the alert via *their own* preferred channel (push / WhatsApp / Telegram / email / SMS) — no extra config needed. Template `application.received` exists in ru/kk/en.
- **Rate-limit: 1 submission per phone per 24h** (DB lookup, not Redis — fine for this volume). Stops accidental double-submits and bot spam. Returns 409.

## Public response shape

The POST returns a **sanitized** body — only `id`, `fullName`, `createdAt`. Internal fields (`status`, `notes`, `cityFreeText`) are not echoed back. Recruiters see them via the admin queue.

## Verified live

| Scenario | Result |
|---|---|
| `POST /applications` with `city=astana` | `201` + sanitized `{id, fullName, createdAt}` |
| `POST /applications` with `cityFreeText="Karaganda"` (unknown city) | accepted, `cityId=null`, free-text preserved |
| Duplicate within 24h (same phone) | `409 Conflict` with friendly message |
| Malformed phone (`77017771234`, no `+`) | `400` with E.164 hint |
| `Notification` rows for each manager/admin user | one per channel attempted, in their own locale; SMS landed on manager since email/device weren't configured |
| `GET /admin/applications` anonymously | `401` |
| `GET /admin/applications` as manager | full list, includes `city` relation |
| `GET ?status=interviewing` filter | works |
| `GET ?phone=…` filter | works |
| `PATCH /admin/applications/:id` with `status` + `notes` | applied; sanitized response includes the update |
| `PATCH` with bogus enum value | `400` |

## What's intentionally not here yet

- **Resume / document upload** — `resumeUrl` and `documentUrls[]` columns exist; pipeline deferred per [[../decisions/ADR-005-defer-uploads]].
- **No applicant-side status updates** — once submitted, applicants don't get email follow-ups. That's a future feature ("we'll be in touch by Friday" auto-reply).
- **Source attribution beyond a string** — UTM tracking would need its own column; for now `source` is free-text (`web` / `mobile` / `referral` / `ad-id`).
- **Per-IP rate limit on the public POST** — phone dedup catches the simple case; bot spam at scale would need an additional throttle (Nest's `@nestjs/throttler` or a Cloudflare rule).

## Related

- [[../decisions/ADR-005-defer-uploads]]
- [[../architecture/locked-decisions]]
- [[notifications]] — used for ops fan-out
