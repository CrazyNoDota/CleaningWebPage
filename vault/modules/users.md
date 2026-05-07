---
title: Users module
tags: [module, backend]
---

# Users module

`apps/api/src/users/`

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/users/me` | JWT | Current user profile |
| PATCH | `/api/v1/users/me` | JWT | Update name / email / locale |

## Notes

- Imports `AuthModule` to use `JwtAuthGuard` (do not re-register JWT here — see [[auth]]).
- Locale stored on `User.locale` is the *preferred* locale. The catalog still respects per-request `?locale=` overrides.
- Soft delete via `deletedAt`. Cascade rules don't auto-purge orders — those keep their FK for audit.

## Related

- [[auth]]
