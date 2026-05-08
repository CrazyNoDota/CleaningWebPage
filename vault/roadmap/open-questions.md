---
title: Open questions
tags: [roadmap, blockers]
updated: 2026-05-08
---

# Open questions

Decisions still owed by the client. Each one blocks specific work — the Severity column says how badly.

| # | Question | Affects | Severity |
|---|---|---|---|
| 1 | When does Kaspi Pay merchant onboarding start? Need merchant ID + API keys. | Payments adapter | **Hard blocker** — no money flows |
| 2 | Specific SMS provider — confirm Mobizon, or alternative? | OTP delivery in production | **Hard blocker** — stub only logs |
| 7 | Receipts (фискальный чек) — directly, or via Kaspi? | Compliance, KKM integration | **Hard blocker** — KZ tax law |
| 9 | Object storage choice (S3 / Cloud.ru / MinIO self-hosted)? KZ residency rules apply. | Photo + resume upload | Soft — UI works without uploads |
| 8 | Logo, brand colors, typography | Final styling pass | Soft — green palette stands in |
| 11 | Review moderation policy — auto-publish then moderate, or hold-then-approve? | `REVIEWS_AUTO_PUBLISH` default | Soft — env-flippable |
| 4 | Refund policy — auto on cancel within X hours? Manual approval? | Order state machine | Soft — affects cancellation UX |
| 5 | Cleaner shifts + assignment — manual or automatic round-robin? | Admin UI flow | Soft — manual is fine for first ~50 orders |
| 6 | SLA for first response after order placement | Manager workflow + notification timing | Soft — operations decision |
| 10 | "Verified" cleaner — document check / interview / certification? | Verification badge logic | Soft — admin can verify on whatever process |
| 3 | B2B in MVP scope, or post-launch? | Order schema, billing, audience toggle | Soft — toggle is decorative today |

## Why these are blockers, not just deferrals

Each one shapes a data model or external-integration contract. Building around an assumption and reversing later is expensive. The current build is routed around all of them — see [[plan]] §3a for what's still moving even with these unresolved, and §3b for what's actually waiting.

## Related

- [[plan]] — the full forward roadmap
- [[done]] — what's already shipped
- [[../architecture/locked-decisions]] — what's already nailed down
