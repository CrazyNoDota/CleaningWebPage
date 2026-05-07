---
title: Catalog module
tags: [module, backend]
---

# Catalog module

`apps/api/src/catalog/`

Provides the public list of services and their add-on options, localized.

## Endpoints

| Method | Path | Query | Purpose |
|---|---|---|---|
| GET | `/api/v1/services` | `?city=astana&locale=ru` | List active services in a city |
| GET | `/api/v1/services/:slug` | `?locale=` | Service detail with options |

## Locale resolution

`src/common/locale.ts`:

- `resolveLocale(query, acceptLanguage)` picks one of `ru`/`kk`/`en`. Query string wins over `Accept-Language`. Falls back to `ru`.
- `pickLocalized(row, 'name', locale)` returns `row.nameRu` / `row.nameKk` / `row.nameEn`.

## Why two `getServiceBy*` methods

- `getServiceBySlug` — returns the **localized projection** for the public API.
- `getServiceRawBySlug` — returns full row including `pricingExpr`. Only used by [[pricing]] to evaluate quotes. Not exposed.

## Related

- [[pricing]]
- [[../decisions/ADR-003-multi-locale-columns]]
