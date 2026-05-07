---
title: Open questions
tags: [roadmap, blockers]
updated: 2026-05-07
---

# Open questions

These need a client decision before the affected work can finish. Carried over from `global_plan.md` §2.

| # | Question | Affects |
|---|---|---|
| 1 | When does Kaspi Pay merchant onboarding start? Need merchant ID + API keys. | Payments adapter (Phase 2 step 2) |
| 2 | Specific SMS provider — confirm Mobizon, or alternative? | [[../modules/notifications-sms]] |
| 3 | B2B (corporate clients) included in MVP, or post-launch? | Order schema, billing, invoicing |
| 4 | Refund policy — automatic on cancel within X hours? Manual approval? | Order state machine |
| 5 | Cleaner shifts and assignment — manual by manager, or automatic round-robin? | Assignment logic, admin UI |
| 6 | SLA for first response after order placement | Notifications & manager workflow |
| 7 | Do we issue receipts (фискальный чек) directly, or via Kaspi? | Compliance — KKM integration |
| 8 | Logo, brand colors, typography | Web client styling pass |
| 9 | Object storage choice (S3 / Cloud.ru / MinIO self-hosted)? KZ data-residency rules apply. | Review photo upload, cleaner profile photo, job-app resume upload |
| 10 | Cleaner verification process — what does "verified" mean operationally? Document check, in-person interview, training certification? | Cleaner profile verification badge logic |
| 11 | Review moderation policy — auto-publish then take down on report, or hold all reviews until manager approves? | Review module default state |

## Why these are blockers, not just deferrals

Each one shapes the data model or external-integration contract. Building around an assumption and reversing later costs more than waiting. The current build-out has been routed around all of them — current Phase 2 work is fine to continue, but Step 2 (Kaspi) and the receipts piece need answers before they can ship.

## Related

- [[phase-2-progress]]
- [[../architecture/locked-decisions]]
