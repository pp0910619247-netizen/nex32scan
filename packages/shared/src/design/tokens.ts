/**
 * Nex32 Future UI — design tokens (PHASE 2).
 *
 * Single source of truth for color, typography, spacing, radius, elevation
 * and motion, shared by the web explorer and the mobile app (AGENTS.md §3:
 * no new package — tokens live in `@nexus/shared`).
 *
 * Rules:
 * - Dark-first + light mode. Amber/gold accent inherited from the brand mark.
 * - No UI strings here (AGENTS.md §6 i18n rule); values only.
 * - All colors are sRGB hex; text/background pairs are chosen for WCAG 2.2 AA
 *   (verified in `test/design.test.ts`).
 */

/** Hex color string (`#rrggbb`). */
export type HexColor = `#${string}`;

export interface ThemePalette {
  readonly background: HexColor;
  readonly surface: HexColor;
  readonly surfaceRaised: HexColor;
  readonly border: HexColor;
  readonly text: HexColor;
  readonly textSecondary: HexColor;
  readonly accent: HexColor;
  readonly accentText: HexColor;
  readonly success: HexColor;
  readonly warning: HexColor;
  readonly danger: HexColor;
  readonly info: HexColor;
}

/** Dark-first palette (default). */
export const darkPalette = {
  background: '#0B0B10',
  surface: '#14141C',
  surfaceRaised: '#1E1E28',
  border: '#2E2E3D',
  text: '#F5F3EE',
  textSecondary: '#B0B4BA',
  accent: '#FFAB00',
  accentText: '#1A1200',
  success: '#34D399',
  warning: '#FFB020',
  danger: '#F87171',
  info: '#60A5FA',
} as const satisfies ThemePalette;

/** Light palette (warm cream, matches explorer chrome). */
export const lightPalette = {
  background: '#FAF6EC',
  surface: '#FFFFFF',
  surfaceRaised: '#F3EEDF',
  border: '#E7E0CE',
  text: '#1C1917',
  textSecondary: '#6B6259',
  accent: '#B45309',
  accentText: '#FFFFFF',
  success: '#047857',
  warning: '#B45309',
  danger: '#B91C1C',
  info: '#1D4ED8',
} as const satisfies ThemePalette;

export type ThemeMode = 'dark' | 'light';

export const palettes = { dark: darkPalette, light: lightPalette } as const;

/** Font stacks. Load via `next/font` (web) or `expo-font` (mobile); names only. */
export const fontStacks = {
  sans: ['"IBM Plex Sans Thai"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
} as const;

/** Type scale in px (mobile + web share the ramp). */
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 44,
} as const;

/** 4 px base spacing scale (steps, not raw px, to keep density consistent). */
export const spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

/** Elevation levels (web `box-shadow`, mobile maps to `elevation`). */
export const elevations = {
  flat: 'none',
  raised: '0 1px 2px rgb(0 0 0 / 0.18)',
  overlay: '0 8px 28px rgb(0 0 0 / 0.35)',
} as const;

/** Motion durations in ms; honor `prefers-reduced-motion` at call sites. */
export const motion = {
  instant: 0,
  fast: 120,
  normal: 220,
  slow: 380,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;

/** Status pill tones (maps explorer `Badge` + mobile pills to one vocabulary). */
export const statusTones = {
  solid: 'solid',
  outline: 'outline',
  muted: 'muted',
  soft: 'soft',
} as const;
export type StatusTone = (typeof statusTones)[keyof typeof statusTones];

/** Data-viz palette (muted, print-safe, distinguishable without hue alone). */
export const chartPalette = [
  '#FFAB00',
  '#60A5FA',
  '#34D399',
  '#F472B6',
  '#A78BFA',
  '#FBBF24',
  '#2DD4BF',
  '#F87171',
] as const;

/** Core Web Vitals budgets (DoD reference for Lighthouse CI). */
export const webVitalsBudgets = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  lighthouseMin: 90,
} as const;
