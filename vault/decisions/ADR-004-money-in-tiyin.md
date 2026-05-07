---
title: ADR-004 — Money in minor units (tiyin)
status: accepted
date: 2026-05-07
tags: [decision, money]
---

# ADR-004 — Money in minor units (tiyin)

## Context

KZT has 100 tiyin per tenge. JavaScript's `number` cannot represent decimal tenge values without floating-point rounding errors that compound across additions.

## Decision

Every monetary value — DB column, API field, in-memory variable — is an **integer** in **tiyin**.

- `Service.basePrice` — bigint/int in tiyin
- `ServiceOption.unitPrice` — same
- `Order.totalAmount` — same
- API responses return tiyin
- The frontend divides by 100 only for display

## Why not BigInt?

Prices are small enough (< Number.MAX_SAFE_INTEGER / 100) that `number` is fine. BigInt is more painful to use and serialize than it's worth here.

## Consequence

A 5,000 ₸ base price is `500000` in code. Initially confusing, but the alternative — silently corrupting totals — is unacceptable.

## Related

- [[../modules/pricing]]
- [[ADR-001-pricing-dsl]]
