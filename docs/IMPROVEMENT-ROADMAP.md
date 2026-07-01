# Shinex — Improvement Roadmap

_Generated 2026-07-01 from an 8-agent read-only audit (87 findings across api / web-client / web-admin / mobile). Owner priorities: (1) backend reliability, (2) mobile iOS/Android beauty, (3) website beauty. Execution model: each coding agent self-verifies with a Codex review pass to ≥9/10._

## Overview
Shinex is a competent, feature-complete platform with a few production-grade cracks a paying client will feel. The backend is architecturally sound (state machine, price recompute, signed webhooks, argon2 OTPs) but has real security and money bugs: any OTP-logged-in contractor can read every customer's PII, prod compose defaults to a stub payment provider and a hardcoded JWT secret, there is zero auth rate-limiting, and refunds/transitions aren't concurrency-safe. The web client is well-built and on-brand (blue "Astana Sky", full ru/kk/en) but ships a route-crashing `next/image` misconfig, developer placeholders on live pages, and i18n leaks on the pay button. The mobile app looks good in light mode but its dark theme is disabled at the config level, it renders fabricated account data and a hardcoded address next to the Pay button, and its network layer hangs/spuriously logs users out. Worst of all, **web is blue and mobile is forest-green — they read as two different companies.** The good news: the top wins are almost all S/M-effort, concentrated in a handful of files.

## Critical findings (fix first)
1. **web-client · `next/image` route crash** — homepage + every cleaner profile 500 the moment a real uploaded (Vercel Blob) photo exists; masked locally by demo images. Add `images.remotePatterns` for `*.public.blob.vercel-storage.com`.
2. **api · `cleaner` role = full admin-orders access** — a contractor logs in via normal OTP (JWT `role:'cleaner'`) and can enumerate every customer's name/phone, read address/email, reassign/transition any order. Remove `'cleaner'` from `AdminOrdersController` `@Roles`.
3. **api · fail-open secrets** — `auth.module.ts` falls back to repo-public `'dev_access_secret'` (total auth bypass if env blank); `PAYMENT_PROVIDER` defaults to `stub` (any client confirms own order paid for free). Fail-closed on boot.

## Top must-fix (ranked)
1. Configure `next/image` remotePatterns — web · critical · S
2. Strip `cleaner` from admin-orders `@Roles` — api · critical · S
3. Fail-closed on prod JWT secret & payment provider — api · critical/high · S
4. Activate mobile theming: dark mode (`app.json userInterfaceStyle:"automatic"`) + bundle Inter — mobile · high · S/M
5. Auth rate limiting (`@nestjs/throttler` + Redis OTP cooldown + admin lockout) — api · high · M
6. Harden mobile network layer (fetch timeout, single-flight refresh, session propagation, socket token + polling) — mobile · high · M
7. Show real order address (mobile ignores `order` prop; hardcodes "Астана, Казахстан") — mobile+web · high · M
8. Remove developer artifacts from live site (dev login hint, Contacts "map coming later") — web · high · S
9. Fix i18n leaks on money path (`Оплатить`, `от`, `rooms`, `кв.`) — web · high · S
10. Refund balance validation + atomic order transitions/counters — api · high · M
11. Web perf + SEO foundation (`next/font` Inter, `generateMetadata`/OG/hreflang/favicon, focus-visible rings) — web · high · S/M
12. Replace fabricated Profile data + fix wrong-day booking submit — mobile · high · M

## Tranches

### Tranche 1 — Ship-blockers & quick wins
Kill prod crashes and security fail-opens, remove visible "unfinished" tells. Mostly 1–few-line changes.
- `next/image` remotePatterns · strip `cleaner` role · fail-closed JWT+payment · mobile dark mode · remove dev login hint + Contacts map placeholder · i18n money-path strings · OTP dev-mode default false + gate log · gate Swagger to non-prod / block `/api/docs*` at Caddy · sanitize admin login `next` param (open-redirect) · canonicalize brand to "Shinex" + fix web `<title>` · branded `@shinex.kz` contact email

### Tranche 2 — Backend hardening (priority #1)
Make money/auth paths correct under concurrency and abuse.
- Auth rate limiting · refund balance + transactional/idempotent refunds · atomic transitions + DB-side counter/rating increments · global exception filter (P2002→409, P2025→404, P2003→400) + request-id logging · revalidate deactivated/demoted users in guard + `TokenService.rotate`, revoke refresh tokens on deactivation · health 503 when DB/Redis down + live/ready probes · `enableShutdownHooks()` · double-booking guard + `Order(cleanerId, scheduledAt)` index · resume-upload rate limit + `@IsUrl` validation · per-admin accounts (argon2, constant-time) · integration tests (webhook idempotency, refund limits, transition concurrency, OTP/refresh, role scoping)
- **Ops/reliability (this outage):** `restart: unless-stopped` + container healthchecks, docker log rotation, disk alert, external uptime monitoring → alert on down

### Tranche 3 — Mobile reliability & redesign (priority #2)
- Harden network layer · real order address · replace fabricated Profile + wire edit · fix wrong-day booking · Inter + Inter Display · haptics · tab-bar safe-area inset · success bloom + price tick (reduce-motion) · Lucide icons + route hex through `useTheme()` · skeletons + ErrorBoundary + home loading/error/retry · fix splash + Android adaptive icon · login Google "G" + brand logo hero · mobile i18n (i18next/expo-localization) ru/kk/en

### Tranche 4 — Web & admin elevation (priority #3)
- `next/font` Inter + branded localized `generateMetadata` (OG/hreflang/sitemap/robots/favicon/manifest) · focus-visible rings · not-found/error/loading boundaries · order-tracking stepper with labels · ISR for public catalog · `next/image` for catalog photos · cabinet skeletons · homepage prices from live catalog · SVG star ratings + aria-label · admin: pagination/totals, confirm dialogs + cancel reason, session-expiry redirect, human-readable event log, review photos + order links, customer directory (search), dashboard metrics, cleaner photo upload

### Tranche 5 — Brand & imagery unification
**Owner decision (2026-07-01): unify on FOREST GREEN** — primary `#1f6f4a`, mint-soft `#d1fae5`, ink `#0b1f16` (keep mobile's palette; bring WEB + logo to match it; NOT blue).
- Reskin **web-client** from blue "Astana Sky" → green tokens (globals.css, tailwind, ServiceAudienceSection, hero) · update the logo to green · keep `apps/mobile/src/lib/tokens.ts` green (light+dark) · regenerate one coherent bright photo set (green/mint accents) used on web + mobile · four custom service icons in green/mint · rebuild icon/splash/OG on green

## Images to generate
> **Brand palette = FOREST GREEN** (owner decision): primary `#1f6f4a`, mint-soft `#d1fae5`. Every image below uses **green/mint accents, NOT blue.** "Astana Sky blue" in any brief → replace with forest-green + mint.
- **Service — Standard clean** (16:9): bright sunlit Astana apartment living room mid-clean, airy white-and-blue, photoreal, no text.
- **Service — Deep clean** (16:9): sparkling kitchen/bathroom close-up, droplets and shine, cool blue tint, photoreal.
- **Service — Post-renovation clean** (16:9): freshly renovated empty room, light dust clearing, crisp daylight, bright hopeful mood.
- **Service — Office clean** (16:9): tidy modern small Astana office, glass + light wood, blue accent chairs, morning light.
- **iOS app icon** (1024²): simplified Shinex spray-bottle/monogram on Astana-Sky blue gradient, no wordmark.
- **Android adaptive foreground** (432², ~33% safe padding): same single mark centered, transparent bg.
- **Splash logo** (light+dark): Shinex wordmark white on brand-blue, minimal, subtle sparkle.
- **Open Graph card** (1200×630): wordmark + "Уборка квартир и офисов в Астане" over bright clean-apartment scene, blue band.
- **Web hero** (3:2): sunlit modern Astana interior freshly cleaned, blue+mint accents, room for left-third headline.
- **Mobile service icons ×4** (duotone line, square): general/deep/post-renovation/office, brand-blue+mint, Lucide-matched.
- **Empty-state illustration** ("no orders yet"): friendly line-art tidy room + spray bottle, soft blue, optimistic.
- **Cleaner avatar fallback**: neutral branded silhouette in a rounded blue chip.
- **Play Store feature graphic** (1024×500): lockup + phone mockup on blue gradient.
- **Contacts static map card**: stylized light Astana map tile, brand-blue pin, "Open in 2GIS".
