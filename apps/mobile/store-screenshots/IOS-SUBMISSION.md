# Shinex iOS — App Store submission guide

App: **ShineX** · Bundle `kz.shinex.app` · Apple Team `278KT64WSV` · ASC version **1.0**
Store copy (RU/EN, all fields) lives in `apps/mobile/StoreListing.md`.

---

## Feature parity with Android — ✅
Single Expo (SDK 55) codebase. Every screen renders on both platforms from the
same source — home, services, cleaners list/detail, booking, confirmation,
orders list/detail, profile, login, about, careers, contacts, privacy, terms.
There is no Android-only screen, so iOS content/pages/abilities match Android.

---

## What was changed in this branch for iOS
1. **Sign in with Apple added** (App Store Guideline 4.8 — required because the app
   also offers Google login):
   - Mobile: `app/login.tsx` shows the native Apple button on iOS only; `app.json`
     sets `ios.usesAppleSignIn: true`; new dep `expo-apple-authentication`;
     `src/lib/api.ts` gains `appleLogin()`.
   - API: `POST /auth/apple` verifies the Apple identity token and links an
     `OAuthAccount(provider=apple)` — mirrors Google. **No DB migration** (the
     `AuthProvider` enum already had `apple`). New dep `apple-signin-auth`.
2. **iOS screenshots generator**: `store-screenshots/generate-ios.js` →
   `store-screenshots/ios-6.5/` (1242×2688) and `ios-6.9/` (1320×2868).

### Install the new deps before building
```bash
cd apps/mobile && npx expo install expo-apple-authentication
cd ../../apps/api && pnpm add apple-signin-auth
pnpm install   # from repo root, to refresh the lockfile
```
> The API change must be deployed (push to `main` → deploy.yml) before Apple login
> works in the shipped iOS build.

---

## iOS Google OAuth client — ✅ DONE
Google Sign-In on iOS is now wired up (committed in `89f47ee`):
- `app.json` → `extra.googleClientIdIos` =
  `207945527400-aog63t6o16o98e839i6l4l8vqvs2le4u.apps.googleusercontent.com`
- `app.json` → google-signin plugin `iosUrlScheme` =
  `com.googleusercontent.apps.207945527400-aog63t6o16o98e839i6l4l8vqvs2le4u`

No `GoogleService-Info.plist` is needed — the client ID + URL scheme are enough.
Nothing further required here; the Google button will work in the next iOS build.

---

## Build & upload the iOS app
No iOS build has been uploaded yet (that's why TestFlight and the screenshot slots
are empty in App Store Connect).
```bash
cd apps/mobile
eas build --platform ios --profile production   # creates iOS credentials interactively
eas submit --platform ios --latest              # or upload the .ipa via Transporter
```

---

## App Store Connect page — fill in
| Field | Value / source |
|---|---|
| 6.5" screenshots (required, ≥3) | `store-screenshots/ios-6.5/` |
| Name / Subtitle / Description / Keywords | `apps/mobile/StoreListing.md` (RU primary, EN secondary) |
| Promotional text | short description in StoreListing.md |
| Support URL / Marketing URL | https://shinex.kz |
| Privacy Policy URL | https://shinex.kz/privacy |
| Category | Lifestyle (secondary: House & Home) |
| Age rating | 4+ |
| Copyright | 2026 Shinex |
| Build | attach after the upload step above |

### App Privacy
- Phone number (account/auth) — linked to identity
- Email (Google/Apple sign-in, optional) — linked to identity
- Address / order notes — linked to identity
- Tracking? **No.**

### App Review notes (reviewer can't receive a real SMS — include this!)
> Sign-in required. Demo account — Phone: **+77000000001**, OTP: **123456**.
> Sign in with Apple and Google are also available. (Controlled by REVIEW_PHONE/REVIEW_OTP on the API.)

---

## Pre-flight before "Add for Review"
- [ ] `npx expo install expo-apple-authentication` + `pnpm add apple-signin-auth` run; lockfile updated
- [ ] API deployed with `/auth/apple`
- [x] iOS Google client created and wired (`googleClientIdIos` + `iosUrlScheme` set)
- [ ] Production iOS build uploaded and attached
- [ ] 6.5" screenshots uploaded (≥3) from `ios-6.5/`
- [ ] RU + EN metadata, privacy URL, App Privacy answers
- [ ] App Review demo credentials in notes
