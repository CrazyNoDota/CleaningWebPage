---
title: Pricing module
tags: [module, backend, pricing]
---

# Pricing module

`apps/api/src/pricing/`

## What it does

Computes a quote for a service from user inputs and selected options. The formula is **stored in the database** as a JSON expression on `Service.pricingExpr`, so admins can change pricing without a deploy.

See [[../decisions/ADR-001-pricing-dsl]] for the why.

## Endpoint

`POST /api/v1/pricing/quote`

```json
{
  "serviceSlug": "apartment-standard",
  "city": "astana",
  "locale": "ru",
  "inputs": { "area_m2": 60, "rooms": 2 },
  "options": [{ "key": "windows", "qty": 1 }, { "key": "carpet", "qty": 0 }]
}
```

Response (money in **tiyin** — see [[../decisions/ADR-004-money-in-tiyin]]):

```json
{
  "serviceSlug": "apartment-standard",
  "currency": "KZT",
  "basePrice": 500000,
  "options": [{ "key": "windows", "qty": 1, "lineTotal": 300000 }],
  "total": 2600000
}
```

## DSL

`src/pricing/pricing-engine.ts` — pure function `evaluate(expr, ctx)`.

| Op | Form | Meaning |
|---|---|---|
| `const` | `{ op: "const", value: 500000 }` | Literal |
| `var` | `{ op: "var", name: "area_m2" }` | Reference into `ctx.inputs` |
| `input` | `{ op: "input", name: "rooms", default: 1 }` | Like `var` but with default |
| `add` / `sub` / `mul` | `{ op: "add", args: [a, b, ...] }` | n-ary arithmetic |
| `min` / `max` | same | clamp |
| `sum_options` | `{ op: "sum_options" }` | Sum of `qty * unitPrice` for selected options |

Throws `PricingError` on malformed expressions or unknown ops. The controller converts these to HTTP 400.

## Why server-recomputes

Order creation will not trust a client-supplied total. It will call `PricingService.quote()` server-side using the same code and snapshot the result onto the `Order` row. Any tampering is silently ignored.

## Tests

`pricing-engine.spec.ts` — 7 unit tests, all green. Locks down the seeded apartment formula:

```
5000_00 (base) + 60*250_00 (per m²) + 2*1500_00 (per room) + 3000_00 (windows)
= 2_600_000 tiyin
```

## Related

- [[catalog]]
- [[../decisions/ADR-001-pricing-dsl]]
- [[../decisions/ADR-004-money-in-tiyin]]
