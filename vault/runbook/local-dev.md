---
title: Local dev
tags: [runbook]
---

# Local dev

## First-time setup

```sh
# from monorepo root
pnpm install
docker compose up -d           # postgres + redis
cd apps/api
pnpm prisma migrate dev        # apply migrations
pnpm db:seed                   # seed cities + services
```

If Prisma complains about `DATABASE_URL`, see [[../gotchas/prisma-env-path]].

## Day-to-day

| Task | Command |
|---|---|
| Start API (watch) | `cd apps/api && pnpm dev` |
| Start web client | `cd apps/web-client && pnpm dev` (port 3000, talks to API on 4000) |
| Postgres + Redis | `docker compose up -d` (idempotent) |
| Stop containers | `docker compose down` |
| Type-check api | `cd apps/api && pnpm typecheck` |
| Run pricing tests | `cd apps/api && pnpm test` |

## URLs

- API base: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/docs`
- Web client: `http://localhost:3000` (redirects to `/ru`)

> Port 4000 (not 3001) — set in `apps/api/.env` via `PORT=4000`. Update `NEXT_PUBLIC_API_URL` in the web client to match if you change it.

## Related

- [[database]]
- [[smoke-tests]]
