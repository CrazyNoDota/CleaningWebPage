---
title: Monorepo layout
tags: [architecture]
---

# Monorepo layout

```
CleaningWebPage/
├── apps/
│   ├── api/              NestJS backend (built)
│   ├── web-client/       Next.js public site (scaffolded with i18n)
│   ├── web-admin/        TBD — admin console
│   └── mobile/           TBD — Expo / React Native
├── design/
│   ├── reference/        index.html + styles.css visual reference
│   └── ТЗ Клининговое приложение.docx   original Russian spec
├── vault/                this knowledge base
├── global_plan.md        long-form architecture plan
├── docker-compose.yml    postgres + redis for local dev
├── pnpm-workspace.yaml   workspace defs + native build allowlist
├── turbo.json            pipeline graph
└── .env                  shared env, symlinked into apps/api/.env
```

## Workspace conventions

- All apps named `@cleaning/<name>` in their `package.json`.
- Shared `.env` at root, symlinked where needed (see [[gotchas/prisma-env-path]]).
- `pnpm-workspace.yaml` has an `allowBuilds` list — Argon2 / Prisma / better-sqlite3 etc. need explicit opt-in to run install scripts.

## Module boundaries inside `apps/api`

NestJS modular monolith. Each module is a folder under `src/` and **must not** import another module's repository or service via relative paths — it goes through that module's `*.module.ts` exports.

Current modules: `auth`, `users`, `catalog`, `pricing`, `notifications/sms`, `prisma`, `health`.

## Related

- [[stack]]
- [[domain-model]]
