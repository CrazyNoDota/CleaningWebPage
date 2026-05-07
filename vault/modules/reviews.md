---
title: Reviews module
tags: [module, backend]
status: shipped
---

# Reviews module

`apps/api/src/reviews/` (planned — depends on Orders)

## Shape

`Review` entity — one per completed `Order`:

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `orderId` | uuid (unique) | One review per order. |
| `userId` | uuid | The reviewer. |
| `cleanerId` | uuid? | The cleaner being reviewed (denormalized from order at write time). |
| `rating` | int (1-5) | |
| `comment` | string? | |
| `tags` | string[] | Reserved column. UI deferred. |
| `photos` | string[] | Reserved column. Upload pipeline deferred — see [[../decisions/ADR-005-defer-uploads]]. |
| `status` | enum | `pending / published / hidden / rejected`. |
| `publishedAt` | DateTime? | Set on moderation approval (or auto if policy is auto-publish). |
| `moderatedById` | uuid? | Admin who approved/rejected. |
| `moderationNote` | string? | Internal. |
| `createdAt` | DateTime | |

Default `status` depends on policy — see [[../roadmap/open-questions]] #11. Schema supports both auto-publish-then-moderate and hold-then-publish.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/orders/:id/review` | order owner | Submit review (only on `done`) |
| GET | `/api/v1/cleaners/:id/reviews` | public | Published reviews for a cleaner |
| GET | `/api/v1/reviews/aggregate` | public | Company-wide rating + count |
| GET | `/api/v1/admin/reviews` | manager | Moderation queue |
| PATCH | `/api/v1/admin/reviews/:id` | manager | Approve / hide / reject |

## Triggers

When a review is **submitted**:

1. Order must be `done` and owned by the requester.
2. `OrderStatus` advances to `reviewed` regardless of moderation outcome — the customer DID submit, even if the review isn't yet public.
3. An `order.reviewed` event is appended.
4. If `REVIEWS_AUTO_PUBLISH=true` (default) → review status is `published`, `publishedAt` set, cleaner stats updated.
5. If `false` → review lands as `pending`, no stats update yet.

When a review's status crosses the **published / not-published boundary** (via moderation):

- `not-published → published`: `addRating(cleaner.ratingAvg, cleaner.ratingCount, review.rating)`
- `published → hidden | rejected`: `removeRating(...)` (clamped to zero if it would go negative)

All happens inside one DB transaction. Stats can never drift from the set of currently-published reviews.

The math is in `running-stats.ts` — pure helpers, 5 unit tests passing including the round-trip property `removeRating(addRating(x), r) ≈ x`.

> Floating-point note: long sequences of add/remove will accumulate small FP drift. Acceptable for MVP. A periodic full re-aggregate cron is the long-term fix — left for later.

## Moderation policy

Controlled by env var `REVIEWS_AUTO_PUBLISH`:

| Value | Behavior | Default |
|---|---|---|
| `true` | Publish immediately. Manager hides bad reviews after the fact. | ✓ MVP default |
| `false` | Hold all reviews as `pending` until manager approves. | for higher-trust mode |

Trade-off: friction vs. risk. We default to auto-publish because (a) the cleaner is in-house & vetted, (b) review submission rates die with friction, and (c) the cost of a bad review going briefly public is low (manager can hide within a transaction). Flip to `false` if review spam becomes a problem — no code change.

This is **open question #11** in [[../roadmap/open-questions]] — the env-var design lets us defer the policy decision.

## Verified live

| Scenario | Result |
|---|---|
| Submit (rating=4) on `done` order with auto-publish on | `status: published`, `publishedAt` set |
| Order status transitions `done → reviewed`, event log shows `order.reviewed` | ✓ |
| Cleaner stats: 4.9 / 37 → 4.876 / 38 (running mean) | ✓ |
| Aggregate endpoint reflects the new review | ✓ |
| Moderate to `hidden` → stats roll back to 4.9 / 37 | ✓ |
| Re-publish → stats return to 4.876 / 38 | ✓ |
| Moderate to `pending` rejected (`400`) | ✓ |
| Customer attempting moderation rejected (`401`) | ✓ |
| Duplicate submission rejected (in practice via `order.status != done` check fires first; DB unique constraint on `Review.orderId` is the backstop) | ✓ |

## Related

- [[cleaner-profile]] — receives the stats updates
- [[orders]] — the `done → reviewed` transition source
- [[../decisions/ADR-005-defer-uploads]] — `photos[]` column reserved; upload pipeline deferred
- [[../roadmap/open-questions]] — moderation policy default lives behind an env var
