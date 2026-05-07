---
title: Web admin
tags: [module, frontend, admin]
status: shipped (cleaners section only)
---

# Web admin

`apps/web-admin/` — separate Next.js 15 app on **port 3001**, Russian-only.

The operator console. First slice covers cleaner CRUD; sidebar reserves slots for Orders / Reviews / Applications which use endpoints already shipped on the API.

## Stack

Same as `apps/web-client` minus `next-intl` (single language for now to ship faster). Tailwind, brand colors, fetch wrapper with refresh-on-401, localStorage session — all the same patterns.

```
apps/web-admin/
├── package.json                next dev -p 3001
├── next.config.mjs             reactStrictMode + poweredByHeader off
├── tailwind.config.ts          brand-blue palette matching web-client
├── postcss.config.mjs
├── tsconfig.json               extends tsconfig.base.json
├── next-env.d.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css         component utility classes incl. badges
    │   ├── page.tsx            dashboard placeholder
    │   ├── login/page.tsx      phone OTP, role-gated to manager/admin
    │   └── cleaners/
    │       ├── page.tsx        list with filters
    │       ├── new/page.tsx    create form
    │       └── [id]/page.tsx   profile + verification + suspend
    ├── components/
    │   └── AdminShell.tsx      sidebar + auth gate + sign out
    └── lib/
        ├── api.ts              fetch wrapper, refresh-on-401, all helpers
        ├── auth.ts             localStorage session (key prefixed `cleaning.admin.`)
        ├── use-session.ts      hook that **redirects non-managers to /login**
        └── types.ts            TS types for the admin API surface
```

## Backend endpoints consumed

`AdminCleanersController` (`/api/v1/admin/cleaners`):

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/cleaners` | Onboard. Creates `User` if needed; promotes existing `client` → `cleaner`; refuses if user is already manager/admin or already has a cleaner profile. |
| GET | `/admin/cleaners?isActive=&verificationStatus=` | List with filters (manager view, includes contact PII) |
| GET | `/admin/cleaners/:id` | Single, with full bio + stats + linked user phone/email |
| PATCH | `/admin/cleaners/:id` | Update profile, verification status, or `isActive`. Setting `verificationStatus=verified` stamps `verifiedAt=now`; any other value clears it. |

All admin endpoints are gated `@Roles('manager', 'admin')` via the same `JwtAuthGuard` the rest of the API uses.

## Session model

- `cleaning.admin.session` localStorage key — separate namespace from the web-client's session, so an operator can be logged into the admin app on the same browser without colliding with their customer-app session (handy for testing).
- `useAdminSession()` is the only place the role check lives. Non-managers are bounced to `/login` with a `?next=` redirect target. Login itself rejects with a friendly message if the OTP-verified user lacks `manager` / `admin` role.

## Verified live

| Path | Result |
|---|---|
| `GET /login` | "Вход в админку" / "Только для менеджеров" / "Получить код" |
| `GET /` | "Дашборд" / "Панель оператора" |
| `GET /cleaners` | renders; useAdminSession redirects to /login when unauthenticated |
| `GET /cleaners/new` | redirects-then-renders form |
| `POST /admin/cleaners` (smoke from CLI) | new cleaner created; duplicate phone returns 409 |
| `PATCH /admin/cleaners/:id verificationStatus=verified` | stamps `verifiedAt`; UI shows green badge |
| `PATCH /admin/cleaners/:id isActive=false` | suspends; UI shows "Заблокирован" badge |
| Non-manager OTP → admin app | login refuses with "У этой учётной записи нет прав менеджера (роль: client)." |

## What's intentionally not here yet

- **Locale switching** — Russian only. `next-intl` can be added when an English-speaking ops user appears.
- **Orders / Reviews / Applications sections** — sidebar shows them as "скоро" placeholders. Backend endpoints exist; UI is the only missing piece.
- **Cleaner photo upload UI** — `photoUrl` field exists in API but the form just accepts a URL string. Real upload waits on storage decision (ADR-005).
- **Bulk actions / pagination cursors** — list uses `take/skip`; default 50 rows is plenty for current scale.
- **Audit log of admin actions** — every endpoint touches `prisma.user.update` / `cleaner.update` directly. A `AdminAuditEvent` table is the natural place for this once compliance asks.

## Related

- [[cleaner-profile]] — public-facing read of the data this app manages
- [[../runbook/local-dev]] — how to run admin alongside web-client
