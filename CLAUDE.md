# Shinex — project context for Claude

## What this is
Cleaning service platform for Kazakhstan (brand: **Shinex**, city: Astana).  
Monorepo: NestJS API · Next.js web client · Next.js admin · React Native (Expo) mobile app.  
Production domain: **shinex.kz**  
GitHub: `https://github.com/CrazyNoDota/CleaningWebPage`

---

## Monorepo layout

```
apps/api             NestJS 10 + Prisma 6 + PostgreSQL 16 + Redis 7
apps/web-client      Next.js 15 App Router — public site + client cabinet (ru/kk/en)
apps/web-admin       Next.js 15 App Router — internal admin panel
apps/mobile          React Native + Expo 55 — customer app (kz.shinex.app)
infra/               Dockerfiles + docker-compose.prod.yml + Caddyfile
```

---

## Production infrastructure

| What | Value |
|---|---|
| VPS host | `213.155.22.202` |
| VPS user | `ubuntu` (key-based only, no root password login) |
| Personal SSH key | `C:/Users/Jalil/.ssh/shinex_id_ed25519` |
| GitHub Actions deploy key | `C:/Users/Jalil/.ssh/shinex_deploy` (public key is in `~/.ssh/authorized_keys` on VPS) |
| Connect (personal) | `ssh -i ~/.ssh/shinex_id_ed25519 ubuntu@213.155.22.202` |
| Project root on VPS | `/opt/shinex/` |
| Source tree on VPS | `/opt/shinex/src/` — **not a git repo**, files are rsynced in |
| Compose file | `/opt/shinex/docker-compose.yml` (symlink → `src/infra/docker-compose.prod.yml`) |
| Env file | `/opt/shinex/.env` (owner ubuntu, mode 600) — never commit this |
| Previous source backup | `/opt/shinex/src.prev/` |

### Running containers

| Container | Image | Internal port |
|---|---|---|
| `shinex_postgres` | postgres:16-alpine | 5432 |
| `shinex_redis` | redis:7-alpine | 6379 |
| `shinex_api` | shinex/api:latest | 4000 |
| `shinex_web` | shinex/web-client:latest | 3000 |
| `shinex_admin` | shinex/web-admin:latest | 3001 |
| `shinex_caddy` | caddy:2-alpine | 80/443 (only public-facing) |

---

## CI/CD — GitHub Actions

### Deploy workflow (`.github/workflows/deploy.yml`)
- **Trigger:** push to `main`
- **Strategy:** path-filtered — only the changed app rebuilds
- **How it works:** GitHub Actions runner rsyncs changed files to VPS, then SSHes in to `docker compose build + up`
- `apps/api/**` → rebuilds `shinex_api`
- `apps/web-client/**` → rebuilds `shinex_web`
- `apps/web-admin/**` → rebuilds `shinex_admin`
- `pnpm-lock.yaml` changes trigger the relevant service too

### Mobile build workflow (`.github/workflows/mobile.yml`)
- **Trigger:** push a tag matching `v*` (e.g. `git tag v1.0.1 && git push --tags`)
- **What it does:** EAS Build for Android (AAB → Google Play) + iOS (IPA → TestFlight)
- Builds run on Expo's cloud infrastructure, not the GitHub runner

### GitHub repo secrets (all set)

| Secret | Purpose |
|---|---|
| `VPS_HOST` | `213.155.22.202` |
| `VPS_USER` | `ubuntu` |
| `VPS_SSH_KEY` | Private key (`shinex_deploy`) for CI SSH/rsync access |
| `EXPO_TOKEN` | Expo access token for EAS builds |

### Manual deploy (emergency / first time)

```bash
# 1. Upload changed files via SSH pipe (brackets in path require this trick)
ssh -i ~/.ssh/shinex_id_ed25519 ubuntu@213.155.22.202 \
  "cat > '/opt/shinex/src/path/to/file'" < local/path/to/file

# 2. Rebuild and restart a service
ssh -i ~/.ssh/shinex_id_ed25519 ubuntu@213.155.22.202 \
  "cd /opt/shinex && sudo docker compose --env-file .env build web-client && sudo docker compose --env-file .env up -d web-client"
```

> **Note:** rsync is not installed on the VPS — use the SSH `cat >` pipe trick for individual files,
> or the GitHub Actions `burnett01/rsync-deployments` action (which installs rsync on the runner side).

---

## EAS / Mobile

- **Bundle ID:** `kz.shinex.app` (Android + iOS)
- **Expo slug:** `shinex`
- **EAS profiles:** `development` (dev client), `preview` (internal APK), `production` (AAB + auto-increment iOS build number)
- **Config:** `apps/mobile/eas.json`

---

## Auth

### API routes (easy to get wrong)
```
POST /api/v1/auth/otp/request   — NOT /auth/request-otp
POST /api/v1/auth/otp/verify    — NOT /auth/verify-otp
POST /api/v1/auth/admin/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Review / store-reviewer bypass
For Google Play / App Store reviewers who can't receive a real SMS:

- **Phone:** `+77000000001`
- **OTP code:** `123456`

Controlled by `REVIEW_PHONE` / `REVIEW_OTP` env vars in `/opt/shinex/.env`.  
If either var is absent, the normal SMS-OTP path runs.  
Do **not** put these in `.env.example` or commit them.

---

## Important gotchas

- `OTP_DEV_MODE` is hard-coded `"false"` in `docker-compose.prod.yml` — setting it in `.env` does nothing in production.
- The VPS source tree has **no git** — files must be rsynced or piped in. The CI/CD workflow handles this via `burnett01/rsync-deployments`.
- `scp` with bracket paths (e.g. `[locale]`) fails due to shell escaping — use the SSH `cat >` pipe approach instead.
- Caddy handles TLS and routing — API is at `shinex.kz/api/v1`, web client at `shinex.kz`.
- Prisma migrations run automatically on API container start (entrypoint runs `prisma migrate deploy`).
- The `User` model has `deletedAt` + `isActive` — `getUserById` rejects soft-deleted users automatically.

---

## Local dev

```bash
pnpm install
cp .env.example .env        # then fill in values
pnpm db:up                  # start Postgres + Redis
cd apps/api && pnpm prisma:generate && pnpm prisma:migrate && pnpm db:seed
pnpm dev                    # all apps in parallel via turbo
```

- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/api/docs
- Web (RU): http://localhost:3000/ru
- Mobile: Expo dev server (points to https://cleaning-api-six.vercel.app/api/v1 by default — change `extra.apiUrl` in `app.json` for local)
