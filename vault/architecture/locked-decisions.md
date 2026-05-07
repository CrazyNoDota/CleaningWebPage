---
title: Locked decisions
tags: [architecture, decisions]
---

# Locked decisions

Confirmed by the client. Everything below is now scope, not opinion.

| Topic | Decision |
|---|---|
| Payment provider | **Kaspi Pay** as the primary rail. Adapter abstracts it so a second rail can slot in. |
| Map provider | **2GIS** — best KZ coverage and pricing. Adapter pattern in case we swap later. |
| Languages at launch | **Russian, Kazakh, English** — three together. |
| Cleaners | **In-house only** (no marketplace flow yet). `Cleaner` table exists from day 1, but no public-facing onboarding. |
| Cities | **Multi-city schema from day 1**, single city at launch. `City` is FK on `Address`/`Order`. |
| CRM | **None at launch.** Plan for **Bitrix24** later. Webhook outbox planned as the integration point. |
| VPS | **KZ-resident.** Required for personal-data law compliance. |
| OTP / SMS | **Mobizon** (or equivalent KZ provider) — only used for first-touch OTP. See [[modules/notifications-sms]]. |
| Transactional notifications | Push / WhatsApp / Telegram / Email preferred; SMS only as fallback. |
| Logo / branding | Provided later. Visual reference is `index.html` + `styles.css` from `design/reference/`. |

## Open questions

See [[roadmap/open-questions]].

## Related

- [[stack]]
- [[../global_plan.md]]
