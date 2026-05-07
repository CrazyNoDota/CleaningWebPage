# Cleaning Service Platform

Monorepo for the cleaning company platform — backend API, client web, admin web, and mobile.
Architecture and decisions are documented in [`global_plan.md`](./global_plan.md). Visual reference for the UI is in [`design/reference/`](./design/reference).

## Stack

- **Backend** — NestJS 10, Prisma 6, PostgreSQL 16, Redis 7
- **Web (client + admin)** — Next.js 15 (App Router), Tailwind, next-intl (ru / kk / en)
- **Mobile** — React Native + Expo *(planned, not yet scaffolded)*
- **Monorepo** — pnpm workspaces + Turborepo
- **Target market** — Kazakhstan; Kaspi Pay, 2GIS, Mobizon SMS

## Layout

```
apps/
  api/                 NestJS backend (port 4000)
  web-client/          Public site + client cabinet (port 3000)
  web-admin/           Admin panel (planned)
  mobile/              React Native + Expo (planned)
packages/              Shared types / api-client / ui-kit (planned)
design/reference/      Original static mockup — visual reference only
docker-compose.yml     Local Postgres + Redis
global_plan.md         Architecture & roadmap
```

## First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Start Postgres + Redis
pnpm db:up

# 4. Generate Prisma client + apply migrations
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate          # creates the dev migration
pnpm db:seed                 # seeds cities + a sample service
cd ../..
```

## Running in dev

```bash
# Both api + web-client at once (turbo runs them in parallel):
pnpm dev

# Or individually:
pnpm --filter @cleaning/api dev          # http://localhost:4000
pnpm --filter @cleaning/web-client dev   # http://localhost:3000
```

- API root: <http://localhost:4000/api/v1>
- Swagger UI: <http://localhost:4000/api/docs>
- Web (RU): <http://localhost:3000/ru>
- Web (KK): <http://localhost:3000/kk>
- Web (EN): <http://localhost:3000/en>

## Auth — phone OTP flow (in dev)

1. `POST /api/v1/auth/otp/request` with `{ "phone": "+77001234567" }`
2. `OTP_DEV_MODE=true` makes the API log the code to its console (`[DEV-OTP]`).
3. `POST /api/v1/auth/otp/verify` with `{ "phone": "+77001234567", "code": "123456", "name": "Ansar" }`
4. Use the returned `accessToken` as `Authorization: Bearer ...` to call `GET /api/v1/users/me`.

In production, set `OTP_DEV_MODE=false` and `SMS_PROVIDER=mobizon` with a real `MOBIZON_API_KEY`.

## Common scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run all dev servers |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm db:up` / `db:down` | Start / stop local Postgres + Redis |
| `pnpm --filter @cleaning/api prisma:studio` | Open Prisma Studio |

## What's done so far

- [x] Monorepo + tooling
- [x] Docker Compose for Postgres + Redis
- [x] NestJS api skeleton (health, Swagger, Prisma)
- [x] Initial Prisma schema (User, OAuth, RefreshToken, OTP, City, Address, Service, ServiceOption, Order, OrderEvent, Cleaner)
- [x] Auth: phone OTP request/verify, JWT access + refresh, refresh rotation, logout
- [x] SMS adapter pattern with stub + Mobizon implementations
- [x] `GET /users/me` protected by JWT guard
- [x] Next.js client with ru/kk/en routing and a placeholder home page

## What's next (per `global_plan.md` Phase 2)

1. Catalog module + pricing engine (DSL evaluator)
2. Quote endpoint (`POST /pricing/quote`) used by web/mobile calculators
3. Orders module + state machine + WebSocket order-status push
4. Payments adapter + Kaspi Pay integration
5. Notifications module (Push + WhatsApp + Telegram + Email + SMS-fallback router)
6. Admin app scaffold
