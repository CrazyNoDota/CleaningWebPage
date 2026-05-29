# syntax=docker/dockerfile:1.7
# NestJS API — multi-stage build for the cleaning platform monorepo.

FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /repo

# ---- deps: install full workspace deps from lockfile ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web-client/package.json apps/web-client/
COPY apps/web-admin/package.json apps/web-admin/
COPY apps/mobile/package.json apps/mobile/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build: compile NestJS + generate Prisma client ----
FROM deps AS build
COPY apps/api ./apps/api
RUN pnpm --filter @cleaning/api exec prisma generate
RUN pnpm --filter @cleaning/api build

# ---- runtime: keep full deps so the Prisma CLI is available for migrations ----
FROM node:20-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl tini curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=4000
EXPOSE 4000

# Bring over the fully-installed workspace + compiled API output.
COPY --from=build /repo/package.json /repo/pnpm-lock.yaml /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api ./apps/api

WORKDIR /app/apps/api

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4000/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/tini","--"]
# Run pending Prisma migrations, then start the compiled Nest server.
CMD ["sh","-c","node ./node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
