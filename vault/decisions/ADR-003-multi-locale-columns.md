---
title: ADR-003 — Multi-locale columns over a join table
status: accepted
date: 2026-05-07
tags: [decision, i18n, data-model]
---

# ADR-003 — Multi-locale columns over a join table

## Context

Three launch languages: Russian, Kazakh, English. Catalog rows (services, options, cities) all need translated names + descriptions.

Two common shapes:

1. **Join table** — `ServiceTranslation { serviceId, locale, name, description }`
2. **Columns** — `Service { nameRu, nameKk, nameEn, descRu, descKk, descEn }`

## Decision

Use **columns** for all currently-supported launch locales.

## Why

- Catalog reads are the hottest read path for the public site. No join, no filter.
- Three locales is concrete and small; the schema cost is bounded.
- Type-safety: Prisma generates `nameRu: string` so we can't forget a locale at compile time.
- A new locale = a migration + a code change. That's the right friction level for adding a launch language.

## When this would flip

If we ever support 10+ locales, or per-row locale availability becomes dynamic (some services only translated to some langs), revisit and migrate to a join table.

## Implementation

`src/common/locale.ts` — `pickLocalized(row, field, locale)` does the column lookup. Catalog service uses it for projection; everything else stays untouched.

## Related

- [[../modules/catalog]]
- [[../architecture/domain-model]]
