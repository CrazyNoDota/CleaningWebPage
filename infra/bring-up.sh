#!/usr/bin/env bash
# Brings up the shinex.kz prod stack and seeds the database.
# Run on the server from /opt/shinex.

set -euo pipefail

cd /opt/shinex

echo "==> Starting postgres + redis first"
sudo docker compose --env-file .env up -d postgres redis

echo "==> Waiting for postgres to be healthy…"
for i in $(seq 1 60); do
  s=$(sudo docker inspect -f '{{.State.Health.Status}}' shinex_postgres 2>/dev/null || echo "starting")
  if [[ "$s" == "healthy" ]]; then
    echo "    postgres healthy"
    break
  fi
  sleep 2
done

echo "==> Starting api (will run prisma migrate deploy then boot)"
sudo docker compose --env-file .env up -d api

echo "==> Waiting for api health"
for i in $(seq 1 60); do
  s=$(sudo docker inspect -f '{{.State.Health.Status}}' shinex_api 2>/dev/null || echo "starting")
  if [[ "$s" == "healthy" ]]; then
    echo "    api healthy"
    break
  fi
  sleep 3
done

echo "==> Seeding catalog (idempotent)"
sudo docker compose --env-file .env exec -T api sh -c '
  set -e
  cd /app/apps/api
  if [ -x /app/node_modules/.bin/tsx ]; then
    /app/node_modules/.bin/tsx prisma/seed.ts
  elif [ -x ./node_modules/.bin/tsx ]; then
    ./node_modules/.bin/tsx prisma/seed.ts
  else
    node node_modules/.pnpm/tsx*/node_modules/tsx/dist/cli.mjs prisma/seed.ts
  fi
' || echo "    seed step exited non-zero (may be already seeded)"

echo "==> Starting web-client, web-admin, caddy"
sudo docker compose --env-file .env up -d web-client web-admin caddy

echo "==> Final ps:"
sudo docker compose --env-file .env ps
