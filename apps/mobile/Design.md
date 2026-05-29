# Shine X — Android App Design Brief

> Brief for the **next-generation** Android design. The current shipped UI (warm green on white cards, plain RN primitives, text-symbol tab icons) is the floor — this document defines what to build above it. Read alongside the repo root `PRODUCT.md`.

---

## 1. Intent

Make Shine X feel like the **most premium cleaning booking app in Kazakhstan** — bolder, more delightful, more confident than the current build, while staying inside the *product* register (it serves task completion, not brand expression).

If a user opens the app once and screenshots it for a friend, the design has worked.

### Direction (chosen)

- **Bolder & more delightful** — richer color, larger display type, confident hero moments, characterful photography. Push past the current restraint without crossing into "VC pitch deck."
- **Light + dark, both first-class** — Android users expect system-following dark mode. Both modes are designed in parallel, not retrofitted.
- **Brief, not spec** — this doc defines principles, tokens, and screen directions. Pixel decisions belong in Figma.

---

## 2. Who we are designing for

(See `PRODUCT.md` for the canonical user. Summary for designers:)

- Astana-based, mid-to-high income, mobile-first.
- Inviting a stranger into their home — anxiety is the dominant emotion. Every friction point amplifies it.
- Reads Russian primarily; Kazakh and English are first-class locales.
- Skims fast, decides faster. Will not tolerate three taps where one would do.

Anti-personas (do not design for): bargain hunters, B2B procurement, classifieds browsers.

---

## 3. Design principles (this app)

These extend the five product principles in `PRODUCT.md` with **Android-specific delight tactics**:

1. **One screen, one job.** No screen does two things. Booking flow is booking. Orders list is orders. If we feel tempted to combine, we split.
2. **Confident hero, calm body.** Each screen has one hero moment (a price, a CTA, a state). Everything else recedes — neutrals, generous space.
3. **Photography earns the warmth.** Editorial cleaning photography (already established in web) is the primary warmth driver. Avoid stock-y, smiling-stranger imagery.
4. **Motion is feedback, never decoration.** Sheets slide, prices tick, success blooms. No idle drift, no parallax, no "premium" floatiness.
5. **Quiet typography, loud numbers.** Sans-serif body, but prices, durations, ratings get display weight. The user is comparing numbers — let them.
6. **Local before global.** ₸ formatting, KZ phone shapes, Astana neighborhood names in autocomplete. The app reads like Kazakhstan, not a translated template.

---

## 4. Visual language

### 4.1 Color

The current brand green (`#2d6a4f`) stays. The palette expands to give the bolder direction more registers to play in.

#### Light tokens

| Token | Hex | Use |
|---|---|---|
| `bg.page` | `#FAFAF7` | Page background, warm off-white (NOT the current `#f7f8fa` cool gray) |
| `bg.surface` | `#FFFFFF` | Cards, sheets |
| `bg.elevated` | `#FFFFFF` + shadow | Modals, popovers |
| `bg.sunken` | `#F1EFE9` | Sectional dividers, image placeholders |
| `ink.primary` | `#16201A` | Body text, deep green-black |
| `ink.secondary` | `#5A6661` | Supporting text |
| `ink.tertiary` | `#8A938F` | Hints, timestamps |
| `line.hairline` | `#E6E2D7` | 1px dividers, input borders at rest |
| `brand.500` | `#2D6A4F` | Primary CTAs, active states |
| `brand.600` | `#1F4F39` | Pressed CTA |
| `brand.100` | `#D8F3DC` | Soft brand fills (chips, badges) |
| `accent.500` | `#E07A2C` | Warm copper — secondary CTA, highlights, "new" badges |
| `accent.100` | `#FBE9D6` | Soft accent fills |
| `success.500` | `#2D6A4F` | (Same as brand — confirmed orders, paid states) |
| `warn.500` | `#B45309` | Pending payment, attention states |
| `danger.500` | `#B91C1C` | Errors, cancellation |
| `danger.100` | `#FEE2E2` | Soft danger fills |

#### Dark tokens

Dark is not "invert the light tokens." It is its own thoughtful surface system. Use **elevated overlays**, not pure black.

| Token | Hex | Use |
|---|---|---|
| `bg.page` | `#0F1411` | Deep warm green-black |
| `bg.surface` | `#161C18` | Cards |
| `bg.elevated` | `#1E2622` | Modals, sheets — elevation = warmer, lighter |
| `bg.sunken` | `#0A0E0C` | Image placeholders, recessed |
| `ink.primary` | `#F0EBDF` | Warm off-white, never `#FFFFFF` |
| `ink.secondary` | `#A8B0AB` | |
| `ink.tertiary` | `#6E7672` | |
| `line.hairline` | `#262E29` | |
| `brand.500` | `#52B788` | **Brightened** brand green for dark contrast |
| `brand.600` | `#74C699` | Pressed/hover |
| `brand.100` | `#1F3A2C` | Soft fills |
| `accent.500` | `#F0935A` | **Brightened** copper |
| `accent.100` | `#3A2A1C` | |

**Contrast targets:** all text/background pairs must clear WCAG AA (4.5:1 body, 3:1 large text). Brand-on-bg combinations must be verified in both modes.

**Photography in dark:** apply a 6% black overlay + slight saturation lift; never invert.

### 4.2 Typography

Replace ad-hoc font weights with a single Latin/Cyrillic family that supports Kazakh diacritics.

- **Primary:** **Inter** (Latin + Cyrillic + Kazakh-specific glyphs ə, ң, ү, ұ, қ, ғ, һ, і).
- **Display:** **Inter Display** for >24sp sizes (tighter letterspacing).
- **Mono:** only for order IDs (`SF Mono` / system mono is fine — not a brand voice).

Type scale (sp):

| Token | Size | Weight | Line | Use |
|---|---|---|---|---|
| `display.xl` | 40 | 700 | 44 | Booking total (the hero number) |
| `display.lg` | 32 | 700 | 36 | Screen-level heroes |
| `title.lg` | 24 | 600 | 30 | Screen titles |
| `title.md` | 20 | 600 | 26 | Card titles |
| `title.sm` | 17 | 600 | 22 | Section headers |
| `body.lg` | 17 | 400 | 24 | Body text |
| `body.md` | 15 | 400 | 22 | Default body |
| `body.sm` | 13 | 400 | 18 | Secondary, metadata |
| `label.lg` | 15 | 600 | 20 | Button labels |
| `label.sm` | 12 | 600 | 16 | Chips, tags |
| `mono.md` | 14 | 500 | 20 | Order IDs |

**Numerals are tabular by default** — `font-variant-numeric: tabular-nums`. Prices ticking up/down don't jitter.

### 4.3 Spacing & radius

8-point grid. Tokens:

- `space.1`–`space.10` → 4, 8, 12, 16, 20, 24, 32, 40, 56, 72.
- `radius.sm` 8 (chips, fields), `radius.md` 14 (cards), `radius.lg` 20 (bottom sheets, hero cards), `radius.pill` 999 (chips, CTAs in some screens).

CTAs are **18–20 radius** (not the current 12) — that's part of the "bolder" feel.

### 4.4 Elevation

Use shadow sparingly. Dark mode uses **brightness, not shadow**.

- `elev.0`: flat (most surfaces).
- `elev.1`: sticky bottom action bars — light: `0 -8 24 rgba(22,32,26,0.06)`; dark: surface lightens to `bg.elevated`.
- `elev.2`: modal sheets — light: `0 24 48 rgba(22,32,26,0.18)`; dark: `bg.elevated` + 1px hairline.

No floating cards in the middle of the screen. No double drop shadows.

### 4.5 Iconography

- **Replace text-symbol tab icons** (`+`, `≡`, `•` currently in `app/(tabs)/_layout.tsx:33-41`) with a proper icon set.
- **Lucide Icons** as the base — 24×24, 1.75px stroke, rounded caps.
- Brand icons (logo lockup, splash) stay as the existing transparent-logo asset.
- One custom set: **service icons** (general clean, deep clean, post-renovation, office) — drawn in-house, 32×32, filled with brand or accent at 12% opacity behind the line.

### 4.6 Photography

- Continue the unified premium photo set already in the web client (`commit 38b589c`).
- On mobile: photos appear in **service cards** (16:9, radius.md), **empty-state illustrations** (3:2), and **profile/cleaner cards** (square 80×80 with rounded `radius.md`).
- No flat illustrations of cartoon characters. No emoji-as-art.

### 4.7 Motion

Tokens (ms / easing):

- `motion.fast`: 120 / `ease-out` — taps, ripples, toggles.
- `motion.med`: 220 / `ease-out-quint` — sheet sliding, screen transitions.
- `motion.slow`: 360 / spring(0.6, 0.8) — success states, price reveals.

**Required interactions:**
- Price recalculates with a 220ms tick animation (number rolls), not a hard swap.
- Bottom sheets spring up, dim background to 60%.
- Successful order: confirmation screen blooms — checkmark scales 0→1.1→1.0 over 360ms.
- Tab switching: cross-fade body, never slide horizontally (we are not a horizontal-paging app).

**Respect `prefers-reduced-motion`**. Every motion above must have a static fallback (instant state change, no spring).

---

## 5. Layout system

- **Edge-to-edge**, status bar transparent, system bars dynamic-tinted to current screen surface.
- **Safe-area aware** on all four edges. Screens with sticky bottom CTAs add `safe.bottom + space.4` of padding.
- **Max content width** is the device width on phones; on tablets, content centers at 600 dp.
- **Sticky bottom action bar** is the standard pattern for any screen ending in a commit (booking, order detail with "Pay" action). It's `bg.surface` with `elev.1` and respects safe area.

---

## 6. Component inventory

The current `apps/mobile/src/components/ui.tsx` exports `Screen`, `Title`, `Muted`, `Field`, `Button`, `Chip`, `Card`, `ErrorText`. **Keep these names**, rebuild internals.

### 6.1 Button

- Variants: `primary` (brand fill), `secondary` (surface + 1px brand outline), `ghost` (text only), `danger`.
- Sizes: `lg` (52 dp, default for screen-level commits), `md` (44 dp), `sm` (36 dp, inline).
- States: rest / pressed (brand.600 fill, 0.97 scale) / disabled (40% opacity) / loading (spinner + label dims).
- Haptic on press: `light` for nav, `medium` for commit.

### 6.2 Card

- `radius.md`, `bg.surface`, no shadow at rest.
- Pressable cards (`order card`, `service card`) get a 0.98 scale + faint hairline brighten on press.
- Cards never nest cards. If we feel the urge, use a sunken `bg.sunken` block instead.

### 6.3 Chip

- Two roles: **filter chip** (selectable, brand.100 fill when on) and **status chip** (brand/warn/danger soft fill, label.sm weight).
- `radius.pill`, 32 dp height.

### 6.4 Field

- 56 dp height, 1px `line.hairline` border, focus = 2px `brand.500` border + 0.5 dp inner glow.
- Floating label (Material-style) — label sits on the border line when filled.
- Error state: 2px `danger.500` border + helper text below.

### 6.5 Bottom sheet

- Full replacement for any "modal" today. Drag handle (32×4 dp), 60% scrim, `radius.lg` top corners.
- For destructive confirms, the sheet's primary action is `danger`, secondary is `ghost`.

### 6.6 Tab bar

- **Replace text icons with Lucide.** Suggested mapping:
  - Booking → `plus-circle` (or custom "spray bottle" if we want delight).
  - Orders → `list-checks`.
  - Profile → `user-round`.
- Active state: icon stroke thickens to 2.25px, label color = `brand.500`, micro-bounce on switch.
- Tab bar background blurs the content behind it on iOS, solid on Android.

### 6.7 New components to introduce

- **PriceBlock** — the hero number on booking. `display.xl`, brand color, tabular, animated tick.
- **CleanerCard** — square photo + name + rating + price-from. Tap → cleaner detail.
- **TimeSlotPicker** — horizontal scroll of next 7 days as pill columns, each column scrolls vertically through hourly slots. (Replaces the dropdown in `app/(tabs)/index.tsx:48`.)
- **OrderTimeline** — vertical stepper for order status (placed → confirmed → en route → in progress → complete), with each step's timestamp.
- **AddressAutocomplete** — typeahead with Astana districts/streets, recent addresses pinned to top.

---

## 7. Screens

Six screens to design. Each screen has: **purpose · hero · primary action · states**.

### 7.1 Login (`app/login.tsx`)

- **Purpose:** unblock a returning user fast; new users get a single-screen sign-up.
- **Hero:** logo lockup + one-line value prop ("Order a cleaning in Astana, in a minute.").
- **Primary action:** phone-number login (KZ +7 mask), OTP. Email/password as secondary fallback.
- **States:** loading (skeleton input), OTP-sent (timer + resend), error (inline under field), offline (banner top).

### 7.2 Booking (`app/(tabs)/index.tsx`) — the most important screen

- **Purpose:** complete a booking in <60 seconds.
- **Hero:** the **PriceBlock** at top, ticking as inputs change.
- **Layout:** scrollable form → service selector (large image chips) → area/rooms (steppers, not text inputs) → schedule (TimeSlotPicker) → address (saved address selector or autocomplete) → optional comment.
- **Sticky bottom:** primary "Book for ₸ X,XXX" button.
- **States:** loading services (skeleton chips), price recalculating (subtle pulse on PriceBlock), submission error (inline above sticky button), success (transitions to confirmation bloom screen).

### 7.3 Confirmation (new screen, post-booking)

- **Purpose:** reassure. The most anxious moment is "did it actually go through."
- **Hero:** large success bloom (checkmark animation), order ID, scheduled time in human form ("Tomorrow, 14:00").
- **Primary action:** "View order details." Secondary: "Book another."
- **States:** none — this screen is terminal.

### 7.4 Orders list (`app/(tabs)/orders/index.tsx`)

- **Purpose:** see what's coming up and what's done.
- **Hero:** the **next upcoming order** as a large card at top (cleaner photo, time, address, status chip).
- **Layout:** below the hero — segmented control (Upcoming / Past), then list of order cards.
- **Empty state:** illustration + "No bookings yet" + primary "Book a cleaning" button.

### 7.5 Order detail (`app/orders/[id].tsx`)

- **Purpose:** see exactly what's happening and act on it (cancel, message cleaner, pay).
- **Hero:** **OrderTimeline** at top.
- **Below:** cleaner card (photo, name, rating, "Message" button), address card (with mini-map placeholder), service breakdown, price breakdown, total.
- **Sticky bottom:** context-sensitive — "Pay ₸ X" when unpaid, "Message cleaner" when in progress, hidden when complete.

### 7.6 Profile (`app/(tabs)/profile.tsx`)

- **Purpose:** account management, settings, locale switch, sign out.
- **Hero:** avatar (or initials) + name + phone.
- **Sections:** Addresses, Payment methods, Notifications, Language (ru/kk/en — segmented), Theme (System / Light / Dark — segmented), About, Sign out.

---

## 8. States (every screen must define these)

| State | Treatment |
|---|---|
| **Loading** | Skeleton blocks matching the final layout shape. Never spinners on full screens. Spinners only for in-button actions. |
| **Empty** | Illustration + one-line copy + one action. Never just "No data." |
| **Error** | Inline where possible. Full-screen errors only when navigation is impossible. Always offer a retry. |
| **Offline** | Persistent banner at top of any screen that needs network. Cached data shown if available, with a "Last updated X minutes ago" line. |
| **Success** | Where action terminates (booking, payment), use the bloom animation. For inline saves (address added), use a toast at bottom. |

---

## 9. Accessibility

- **WCAG 2.1 AA** for all text/contrast pairs in both modes.
- **Dynamic Type:** all screens must reflow at 130% system font scale. No text truncation, no overlapping CTAs.
- **Touch targets:** 44×44 dp minimum. Tab bar icons get 48 dp hit slop.
- **Screen reader:** every interactive element has `accessibilityLabel`. Price changes use `accessibilityLiveRegion="polite"`.
- **Reduced motion:** every animation defined in §4.7 has a static fallback.
- **Color is not the only signal:** status chips have an icon, not just a color. Errors have an icon, not just red.

---

## 10. Android specifics

- **Material 3 components are NOT the base.** We use our own design system. Where Material patterns are user expectations (back gesture, ripple feedback, system back), we conform.
- **Edge-to-edge** with `enableOnBackInvokedCallback="true"` (currently `false` in `AndroidManifest.xml:14` — flag for migration).
- **Splash screen:** uses `expo-splash-screen`. Background = `brand.500` (light) or `bg.page` (dark), centered logo at 40% width.
- **Adaptive icon:** keep current `#2d6a4f` background. Foreground logo gets a redraw for the bolder direction (more confident lockup, slightly larger).
- **Haptics:** use `expo-haptics`. Light on nav, medium on commit, success on booking confirmation.
- **System bars:** match current screen surface. Sheets pull the nav bar to `bg.elevated`.
- **Back behavior:** `MainActivity.invokeDefaultOnBackPressed` is already correct — do not regress.

---

## 11. Internationalization

- **Three locales: ru, kk, en.** Russian is the default for in-Kazakhstan installs.
- All strings live in i18n files — no hardcoded UI text (current `app/(tabs)/_layout.tsx:25,31,39` hardcodes "Бронь / Заказы / Профиль", needs lifting).
- Kazakh strings get layout review — words run longer than Russian. Buttons and chips must not truncate.
- Numbers and currency: `₸ 12 500` style (space thousand-separator, ₸ symbol prefixed in ru/kk, suffixed in en — verify with a Kazakh speaker).
- Dates: ru/kk in long form ("вторник, 21 мая"); en in `Tue, 21 May` short form.
- **No RTL required.** None of the three locales are RTL.

---

## 12. Tokens — implementation note

The current `apps/mobile/src/lib/theme.ts` exports a single flat `colors` object. The new system needs:

- A `tokens.ts` with light + dark token maps under one `Theme` shape.
- A `ThemeProvider` that reads `Appearance.getColorScheme()` and the user's profile preference (System / Light / Dark from §7.6).
- All components consume tokens via `useTheme()` — no direct hex in components.

Not in scope of this doc to write — flagged so the implementer knows the structural change is part of the redesign, not a follow-up.

---

## 13. Out of scope (for this design pass)

- iOS-specific HIG deviations — we ship Android first; iOS gets its own pass.
- Cleaner-facing app (separate product).
- Web admin redesign.
- Marketing screens (referrals, promo banners) — TBD with growth.

---

## 14. Open questions

1. **Custom service icons** — in-house or commissioned? Cost / timeline?
2. **Phone-number login OTP** — confirmed provider? Affects login screen flow.
3. **Map provider** — Yandex Maps (KZ-native) or Google Maps? Affects address picker UX and order-detail mini-map.
4. **Payment methods** — Kaspi only? Card? Affects sticky-bottom action labels on order detail.
5. **Cleaner profiles** — do we expose individual cleaner ratings/photos, or only the platform brand? Affects Booking and CleanerCard.

Answer these before Figma work begins.

---

## 15. References

- `PRODUCT.md` (repo root) — product register, brand personality, accessibility floor.
- top.kz — Kazakhstan structured product reference.
- Anti-references: OLX, Avito, generic Material 3 starter apps.
