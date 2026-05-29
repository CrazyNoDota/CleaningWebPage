// Design tokens for Shine X mobile. Source of truth: apps/mobile/Design.md
// + Stitch project "Shine X Design System" (projects/13811563208880664143).
// Components must consume tokens via useTheme(); never hardcode hexes.

export type ColorTokens = {
  bg: { page: string; surface: string; elevated: string; sunken: string };
  ink: { primary: string; secondary: string; tertiary: string; onBrand: string };
  line: { hairline: string };
  brand: { 500: string; 600: string; 100: string };
  accent: { 500: string; 100: string };
  success: { 500: string };
  warn: { 500: string };
  danger: { 500: string; 100: string };
  // Elevation shadow color (light) / overlay color (dark).
  shadow: string;
};

const light: ColorTokens = {
  bg: {
    page: '#FAFAF7',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    sunken: '#F1EFE9',
  },
  ink: {
    primary: '#16201A',
    secondary: '#5A6661',
    tertiary: '#8A938F',
    onBrand: '#FFFFFF',
  },
  line: { hairline: '#E6E2D7' },
  brand: { 500: '#2D6A4F', 600: '#1F4F39', 100: '#D8F3DC' },
  accent: { 500: '#E07A2C', 100: '#FBE9D6' },
  success: { 500: '#2D6A4F' },
  warn: { 500: '#B45309' },
  danger: { 500: '#B91C1C', 100: '#FEE2E2' },
  shadow: 'rgba(22,32,26,0.18)',
};

const dark: ColorTokens = {
  bg: {
    page: '#0F1411',
    surface: '#161C18',
    elevated: '#1E2622',
    sunken: '#0A0E0C',
  },
  ink: {
    primary: '#F0EBDF',
    secondary: '#A8B0AB',
    tertiary: '#6E7672',
    onBrand: '#0F1411',
  },
  line: { hairline: '#262E29' },
  brand: { 500: '#52B788', 600: '#74C699', 100: '#1F3A2C' },
  accent: { 500: '#F0935A', 100: '#3A2A1C' },
  success: { 500: '#52B788' },
  warn: { 500: '#F59E0B' },
  danger: { 500: '#F87171', 100: '#3A1212' },
  shadow: 'rgba(0,0,0,0.55)',
};

export const colorTokens = { light, dark } as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 56,
  10: 72,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export type TypeToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
};

export const type = {
  displayXl: { fontSize: 40, lineHeight: 44, fontWeight: '700', letterSpacing: -0.8 },
  displayLg: { fontSize: 32, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  titleLg: { fontSize: 24, lineHeight: 30, fontWeight: '600' },
  titleMd: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  titleSm: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  bodyLg: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  labelLg: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  labelSm: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} satisfies Record<string, TypeToken>;

export const motion = {
  fast: { duration: 120 },
  med: { duration: 220 },
  slow: { duration: 360 },
} as const;

export const elevation = {
  // Sticky bottom action bar — light only; dark relies on `bg.elevated` lift.
  bottomBar: {
    shadowColor: '#16201A',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  // Modal sheets — light shadow; dark uses surface lift + hairline.
  sheet: {
    shadowColor: '#16201A',
    shadowOpacity: 0.18,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  },
} as const;

export type Theme = {
  scheme: 'light' | 'dark';
  color: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  motion: typeof motion;
  elevation: typeof elevation;
};

export function buildTheme(scheme: 'light' | 'dark'): Theme {
  return {
    scheme,
    color: scheme === 'dark' ? dark : light,
    space,
    radius,
    type,
    motion,
    elevation,
  };
}
