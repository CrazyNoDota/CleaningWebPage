# syntax=docker/dockerfile:1.7
# Next.js web-client (shinex.kz) — standalone output.

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
COPY apps/web-client ./apps/web-client
RUN pnpm --filter @cleaning/web-client build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
WORKDIR /app

# Next standalone output bundles a minimal runtime.
COPY --from=build /repo/apps/web-client/.next/standalone ./
COPY --from=build /repo/apps/web-client/.next/static ./apps/web-client/.next/static
COPY --from=build /repo/apps/web-client/public ./apps/web-client/public

CMD ["node","apps/web-client/server.js"]
