# syntax=docker/dockerfile:1.7
# Next.js web-admin (admin.shinex.kz) — standalone output.

FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web-client/package.json apps/web-client/
COPY apps/web-admin/package.json apps/web-admin/
COPY apps/mobile/package.json apps/mobile/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
COPY apps/web-admin ./apps/web-admin
RUN pnpm --filter @cleaning/web-admin build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
EXPOSE 3001
WORKDIR /app

COPY --from=build /repo/apps/web-admin/.next/standalone ./
COPY --from=build /repo/apps/web-admin/.next/static ./apps/web-admin/.next/static

CMD ["node","apps/web-admin/server.js"]
