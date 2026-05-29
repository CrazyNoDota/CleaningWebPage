// Legacy flat exports kept for screens that haven't migrated to useTheme() yet.
// New code should consume tokens via `useTheme()` from '@/lib/theme-provider'.
// These values mirror the LIGHT token map in '@/lib/tokens'.

import { colorTokens, radius as radiusTokens } from '@/lib/tokens';

const light = colorTokens.light;

export const colors = {
  page: light.bg.page,
  card: light.bg.surface,
  ink: light.ink.primary,
  muted: light.ink.secondary,
  faint: light.line.hairline,
  brand: light.brand[500],
  brandDark: light.brand[600],
  brandSoft: light.brand[100],
  danger: light.danger[500],
  dangerSoft: light.danger[100],
  amber: light.warn[500],
  amberSoft: light.accent[100],
};

export const radius = {
  card: radiusTokens.md,
  field: radiusTokens.sm,
  pill: radiusTokens.pill,
};
