---
title: Database
tags: [runbook, prisma]
---

# Database

Postgres 16 in `docker-compose.yml`. Prisma 6 owns the schema.

## Common commands (run from `apps/api/`)

| Goal | Command |
|---|---|
| Apply migrations | `pnpm prisma migrate dev` |
| New migration | `pnpm prisma migrate dev --name <name>` |
| Regenerate client | `pnpm prisma:generate` |
| Open Studio (GUI) | `pnpm prisma:studio` |
| Reseed | `pnpm db:seed` |
| Reset DB | `pnpm prisma migrate reset` (destructive — wipes data) |

## Seed contents

`prisma/seed.ts` creates:

- 1 city — Astana
- 1 service — `apartment-standard` with the formula:
  `5000_00 + 60*250_00 + 2*1500_00 + 3000_00` (when used with default inputs)
- 3 service options — `windows`, `carpet`, `fridge_inside`

## Schema location

`apps/api/prisma/schema.prisma` — see [[../architecture/domain-model]] for narrative.

## Gotchas

- Env file lookup: [[../gotchas/prisma-env-path]]
- The seed script runs via `tsx`, not the build. It does not need a built `dist/`.

## Related

- [[../architecture/domain-model]]
- [[local-dev]]
