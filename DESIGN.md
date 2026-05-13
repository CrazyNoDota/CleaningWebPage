---
name: Shine X
description: Cleaning service booking platform for Astana — warm, reliable, frictionless.
colors:
  astana-sky: "#0088c7"
  astana-sky-deep: "#006b9f"
  astana-sky-light: "#e0f4fd"
  fresh-mint: "#24d6c6"
  fresh-mint-light: "#cffafe"
  social-proof-amber: "#f4a261"
  ink: "#1a1a2e"
  ink-secondary: "#4a4a5a"
  ink-muted: "#8a8a9a"
  page-wash: "#f4fafb"
  surface: "#ffffff"
  divider: "#e2e8f0"
  error-surface: "#fef2f2"
  error-text: "#b91c1c"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  pill: "50px"
  lg: "16px"
  md: "12px"
  sm: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.astana-sky}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.astana-sky-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.astana-sky}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-secondary-hover:
    backgroundColor: "{colors.astana-sky}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  chip:
    backgroundColor: "{colors.fresh-mint-light}"
    textColor: "{colors.astana-sky-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Shine X

## 1. Overview

**Creative North Star: "The Clear Home"**

The Clear Home is a product UI that reflects the service it delivers: uncluttered, trustworthy, immediately legible. Surfaces are white on a blue-washed page not because white is safe, but because white is what a clean apartment looks like. Every element earns its place on the screen the way every item earns its place in a tidy room.

This is a platform for busy professionals in Astana who are booking something time-consuming and personal. They are letting a stranger into their home, which means every moment of confusion or inconsistency costs trust. The interface's job is to remove friction and signal reliability, not to impress. Familiar affordances beat clever ones. Complete information beats progressive disclosure for the sake of drama. The step they don't have to take is the best UX.

The reference is top.kz: structured, direct, built for the Kazakh context without pretending to be imported from Silicon Valley. What this system explicitly rejects: the density and low-trust visual language of OLX/Avito classifieds, the cold navy formality of banking interfaces, and the generic aquamarine-and-white SaaS template that could be deployed in any market on any continent.

**Key Characteristics:**
- Near-flat surfaces; depth from page-wash vs. white card contrast, not decorative shadows
- Pill-shaped interactive elements (buttons, chips, tags): approachable and decisive
- Restrained color strategy: Astana Sky on actions and brand moments only
- Single typeface (Inter) differentiated by weight and size, not a display/body split
- Consistent 16px corner radius across all containers; pill (50px) for standalone interactive elements
- Three-language support (ru/kk/en) baked into every type scale and layout decision

## 2. Colors: The Astana Sky Palette

Restrained strategy: tinted page wash, white card surfaces, one primary action color, one warm secondary for chips and minor accents, and a strictly quarantined amber for social proof.

### Primary
- **Astana Sky** (`#0088c7`): CTAs, the brand mark, focus rings, active selection borders, interactive links. This is the color of trust and action. Use sparingly so users instantly recognize what they can tap.
- **Astana Sky Deep** (`#006b9f`): Hover and pressed state for all primary actions. Never used independently; only in response to user interaction.
- **Astana Sky Light** (`#e0f4fd`): Background tint for selected state rows and hover surfaces (service selector, address picker). Not a surface color; a state indicator.

### Secondary
- **Fresh Mint** (`#24d6c6`): Room counter increment button fill, occasional accent in brand illustrations. A secondary visual moment that adds warmth without competing.
- **Fresh Mint Light** (`#cffafe`): Chip and pill backgrounds, hover tints on selected states. The only secondary surface color.

### Tertiary
- **Social Proof Amber** (`#f4a261`): Star ratings and review signals only. Not an accent; not an icon color; not a highlight. One color, one job.

### Neutral
- **Ink** (`#1a1a2e`): Primary body text, headlines, high-emphasis labels.
- **Ink Secondary** (`#4a4a5a`): Nav labels, form labels, secondary body text.
- **Ink Muted** (`#8a8a9a`): Captions, meta, helper text, timestamps, disabled text.
- **Page Wash** (`#f4fafb`): Application background. Blue-micro-tinted so white cards above it read as surfaces without needing strong shadows.
- **Surface** (`#ffffff`): Card and form container backgrounds. The primary content layer.
- **Divider** (`#e2e8f0`): Card borders, form field strokes, section separators. Never colored.
- **Error Surface** (`#fef2f2`): Inline error message backgrounds only.
- **Error Text** (`#b91c1c`): Inline error message copy.

### Named Rules
**The One Voice Rule.** Astana Sky (`#0088c7`) is the only color permitted for interactive calls-to-action, active selections, and the brand mark. It appears on no more than 10% of any screen. Its scarcity is what makes it instantly trustworthy.

**The Amber Quarantine Rule.** Social Proof Amber (`#f4a261`) is for star ratings only. Never apply it to buttons, tags, icons, headlines, or any interactive element. Violating this dilutes trust signaling.

**The No-Stripe Rule.** Colored `border-left` or `border-right` accents greater than 1px on cards or list items are prohibited. Use background tints (`{colors.astana-sky-light}`), full borders, or no decoration at all.

## 3. Typography

**Display Font:** Inter (system-ui, sans-serif)
**Body Font:** Inter (system-ui, sans-serif)

**Character:** One family, differentiated by weight. Inter at 800 weight is decisive and authoritative in hero headlines. At 400 it reads comfortably in three scripts (Cyrillic, Latin, Kazakh). The compressed scale (1.2 ratio) keeps UI elements readable without introducing newspaper drama in a service product.

### Hierarchy
- **Display** (800, clamp 30px to 48px, lh 1.1, ls -0.02em): Hero headlines only. One per page maximum.
- **Headline** (700, clamp 20px to 24px, lh 1.3): Section titles, page h2 elements.
- **Title** (700, 18px, lh 1.35): Card titles, modal headings, wizard step labels.
- **Body** (400, 16px, lh 1.6): Descriptions, content paragraphs. Max 65ch line length.
- **Body Strong** (600, 16px, lh 1.5): Pricing callouts, totals, emphasized values.
- **Label** (500, 14px, lh 1.4): Form labels, nav items, metadata, secondary UI text.
- **Caption** (400, 12px, lh 1.4, ls 0.01em): Chip text, timestamps, supplementary data.

### Named Rules
**The One-Family Rule.** Inter is the only typeface. No decorative display font, no mono secondary, no serif for headings. Weight and size alone create hierarchy.

**The Label-Above Rule.** Form field labels always appear above the input as visible text, not as placeholder strings. Placeholders may show format hints only (e.g., "+77001234567"). This is required for WCAG 2.1 AA and for usability in all three supported languages.

## 4. Elevation

Near-flat. The primary depth cue is Page Wash (`#f4fafb`) as the floor against Surface white (`#ffffff`) as the raised layer. Shadows are ambient and minimal at rest; they step up only in response to hover state or overlay context.

### Shadow Vocabulary
- **shadow-soft** (`0 1px 3px rgba(0,0,0,0.06)`): Cards, form panels, page header. The resting state. Barely visible; its job is to separate white from white.
- **shadow-soft-md** (`0 4px 12px rgba(0,0,0,0.08)`): Cards on hover (cleaner profiles, booking wizard container). Communicates interactivity.
- **shadow-soft-lg** (`0 8px 30px rgba(0,0,0,0.12)`): Modals and floating dropdowns only.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, floating, overlay). Depth hierarchy is: Page Wash floor, Surface card, shadow-md on hover, shadow-lg for modals. Nothing else.

## 5. Components

### Buttons
Friendly and decisive: pill-shaped (50px radius) across all variants. Rounded shapes signal approachability; solid fills signal commitment.

- **Shape:** Pill (50px radius) for standalone buttons. All variants share this radius.
- **Primary:** Astana Sky fill (`#0088c7`), white text, 12px 24px padding, font-weight 600, shadow-soft. Hover: Astana Sky Deep (`#006b9f`). Focus: 2px ring in Fresh Mint Light.
- **Secondary:** White fill, 2px Astana Sky border, Astana Sky text. Hover: fills with Astana Sky, text turns white.
- **Disabled:** 50% opacity, `cursor-not-allowed`, pointer-events blocked.
- **Loading:** Replace label with locale-aware "Загрузка..." / "Жүктелуде..." / "Loading...". No spinners.

### Chips / Pills
- **Style:** Fresh Mint Light background (`#cffafe`), Astana Sky Deep text, pill-shaped (50px), 4px 12px padding, 14px weight 500.
- **Use:** City tags ("Астана"), category labels, status indicators. Read-only; not used as filter toggles currently.

### Cards / Containers
- **Corner Style:** 16px radius (rounded-2xl). All cards share this shape.
- **Background:** Surface white (`#ffffff`) on Page Wash floor.
- **Shadow Strategy:** shadow-soft at rest. Interactive cards (cleaner profiles) scale to shadow-soft-md on hover.
- **Border:** Divider (`#e2e8f0`) 1px solid. No colored border accents.
- **Internal Padding:** 24px standard; 16px compact on mobile.

### Inputs / Fields
- **Style:** 16px radius, 1px Divider border (`#e2e8f0`), Surface white background, 12px 16px padding.
- **Focus:** Astana Sky border, 2px ring in Fresh Mint Light. Clean border color shift; no glow.
- **Error:** Shown as a separate paragraph below the form with Error Surface background and Error Text copy. The field border itself does not change on error.
- **Disabled:** Slate-50 background, muted text.
- **Labels:** Always visible above the input (Label weight, 14px). Required fields show a red asterisk after the label.

### Navigation
- **Style:** Surface white background, 1px Divider border-bottom, max-width 6xl, centered.
- **Brand mark:** Astana Sky (`#0088c7`) for the primary word; Fresh Mint (`#24d6c6`) for the secondary suffix. Font-extrabold, 20px-24px.
- **Nav links:** Label weight (500, 14px), Ink Secondary at rest; Astana Sky on hover. Transition: color only.
- **Auth CTA:** Primary button (pill) at reduced padding (8px 16px) for the sign-in action.
- **Mobile:** 3-line icon toggle; full-width slide-down panel. Nav items become 48px-min-height touch rows with 12px 12px padding. Locale switcher stays in the collapsed bar.

### Wizard Container (Signature Component)
The 5-step booking wizard lives inside a single persistent container (16px radius, white surface, shadow-soft, 24px padding). Steps transition in place; the container does not re-mount or animate position.

- **Step indicator:** Plain text "Шаг 2 из 5 · Настройка" above the container. No progress bar; no step dots.
- **Service selector rows:** Full-width touch targets, 1px Divider border at rest. Selected: Astana Sky border + Astana Sky Light fill. Unselected hover: slightly darker border only.
- **Room counter:** Inline incrementer inside a 16px-radius row. Minus button on left, value centered, Plus button (Astana Sky fill) on right. Not a number input.
- **Navigation:** Back (secondary button) and Next/Submit (primary button) inside the container, bottom of each step. On mobile: full-width stacked.

## 6. Do's and Don'ts

### Do:
- **Do** show pricing tiers before the booking flow. Complete information before the user has to ask.
- **Do** use Astana Sky (`#0088c7`) only on CTAs, the brand mark, active borders, and focus rings. Its scarcity is why users trust it.
- **Do** use pill shapes (50px radius) for all standalone buttons and chip elements.
- **Do** use `#f4fafb` as the page surface with white cards above it. The contrast creates the depth layer without relying on shadows alone.
- **Do** maintain 16px radius on all containers. Consistent rounding is an affordance; variation creates visual uncertainty.
- **Do** place form labels above inputs as visible text, never as placeholder-only labels.
- **Do** keep the booking wizard inside a single persistent container with its navigation controls inside it.
- **Do** support all three locales (ru/kk/en) with tested layout at each breakpoint. Kazakh and Russian text is longer than English; design for the longest string.

### Don't:
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, or callouts. Replace with background tints or full borders.
- **Don't** create identical card grids: the same layout (icon + heading + body) repeated 4+ times in a row. Use lists, numbered rows, or varied tile compositions.
- **Don't** use Social Proof Amber (`#f4a261`) anywhere except star ratings.
- **Don't** use dark navy or heavy blue tones. The anti-reference is corporate cold blue: the visual language of a bank or utility bill.
- **Don't** create the OLX/Avito classifieds aesthetic: dense borders, low whitespace, cluttered hierarchy. Breathing room is trust.
- **Don't** use placeholder text as a label replacement. It disappears on focus and fails WCAG 2.1 AA requirements.
- **Don't** use decorative motion or choreographed page-load sequences. State changes only: 150-200ms, ease-out, color and opacity transitions only.
- **Don't** use a second typeface. Inter is the only typeface in the system; weight and scale create all hierarchy.
