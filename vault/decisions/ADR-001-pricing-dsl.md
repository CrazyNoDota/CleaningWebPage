---
title: ADR-001 — Pricing as JSON DSL
status: accepted
date: 2026-05-07
tags: [decision, pricing]
---

# ADR-001 — Pricing as JSON DSL

## Context

The cleaning business needs **frequently tweaked pricing**: per-m² rate, per-room surcharge, add-on flat fees, multipliers for "deep clean", weekend modifiers, city-specific rates, etc. Hardcoding this in TypeScript means a deploy for every adjustment.

## Decision

Store the pricing formula as a JSON expression on `Service.pricingExpr` and evaluate it in a small interpreter (`src/pricing/pricing-engine.ts`).

## Trade-offs

| Pro | Con |
|---|---|
| Admins (later) edit prices without a deploy | One more thing to validate |
| Same engine on server for trustworthy totals | Slightly opaque to read at first |
| Easy to add new ops (`if`, percentage, tiered) | Must keep a strict allow-list of ops |

## Constraints

- Engine is **pure** — no DB / network access from inside `evaluate`.
- Unknown ops throw `PricingError`. Never silently produce a number.
- All math is integer (tiyin) — see [[ADR-004-money-in-tiyin]].

## Related

- [[../modules/pricing]]
- [[ADR-004-money-in-tiyin]]
