---
title: Auth module
tags: [module, backend]
---

# Auth module

`apps/api/src/auth/`

## Flow

1. **Request OTP** — `POST /api/v1/auth/otp/request` with `{ phone }`. Server generates a 6-digit code, hashes with Argon2id, stores `OtpCode` row, dispatches via [[notifications-sms]] adapter. Dev mode logs the code to stdout.
2. **Verify OTP** — `POST /api/v1/auth/otp/verify` with `{ phone, code }`. Validates within TTL (5min) and attempt budget (5). On success: upsert `User`, mint a JWT pair, persist refresh-token hash.
3. **Refresh** — `POST /api/v1/auth/refresh` with the refresh token. Old token row is revoked, new pair issued (rotation).
4. **Logout** — `POST /api/v1/auth/logout`. Revokes the refresh token.

## Token shape

- Access — 15 minutes. Carries `sub` (userId), `role`, `phone`.
- Refresh — 30 days. Stored as `sha256(token)` so a DB leak is non-catastrophic.

## Guard / decorator

- `JwtAuthGuard` reads `Authorization: Bearer <token>`, populates `req.user`.
- `@Roles('admin', 'manager')` decorator restricts route access. Guard reads metadata via `Reflector`.

## Module exports (important)

`AuthModule` exports `JwtModule` and `JwtAuthGuard` so other modules (e.g. `UsersModule`) can use the guard without re-registering JWT config. Forgetting this triggers a Nest DI error at boot.

```ts
exports: [AuthService, TokenService, JwtModule, JwtAuthGuard]
```

## Files

- `auth.module.ts` — wiring + exports
- `auth.controller.ts` — request/verify/refresh/logout
- `auth.service.ts` — orchestration
- `otp.service.ts` — issue / verify, Argon2id
- `token.service.ts` — JWT pair issuance + refresh rotation
- `jwt-auth.guard.ts` — guard + role check
- `dto/*.dto.ts` — request bodies

## Related

- [[users]]
- [[notifications-sms]]
- [[gotchas/express-type-import]]
