---
title: "Gotcha — Prisma can't find DATABASE_URL"
tags: [gotcha, prisma, env]
---

# Gotcha — Prisma can't find DATABASE_URL

## Symptom

```
Error: Environment variable not found: DATABASE_URL
```

When running `pnpm prisma migrate dev` from `apps/api/`.

## Cause

The shared `.env` lives at the **monorepo root**, not in `apps/api/`. Prisma CLI looks for `.env` in the current working directory and in the schema directory — neither contains it.

## Fix

Symlink the root `.env` into `apps/api/`:

```sh
cd apps/api && ln -s ../../.env .env
```

`apps/api/.env` is gitignored, so the symlink doesn't get committed. The file it points to is the canonical source.

## Why not duplicate the file

Two copies = inevitable drift. One canonical `.env` at the root, symlinked where any tool insists on local lookup.

## Related

- [[../runbook/local-dev]]
- [[../runbook/database]]
