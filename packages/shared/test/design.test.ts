import { describe, expect, it } from 'vitest';

import {
  chartPalette,
  darkPalette,
  fontSizes,
  lightPalette,
  motion,
  palettes,
  radii,
  spacing,
  webVitalsBudgets,
} from '../src/design/tokens.js';
import type { HexColor } from '../src/design/tokens.js';

function luminance(hex: HexColor): number {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

function contrastRatio(a: HexColor, b: HexColor): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe('design tokens — structure', () => {
  it('exposes dark + light palettes with identical keys', () => {
    expect(Object.keys(palettes.dark).sort()).toEqual(Object.keys(palettes.light).sort());
    expect(Object.keys(darkPalette)).toContain('accent');
  });

  it('keeps spacing on a 4px base and radii ordered', () => {
    expect(spacing.one).toBe(4);
    expect(spacing.two).toBe(8);
    expect(radii.sm).toBeLessThan(radii.md);
    expect(radii.md).toBeLessThan(radii.lg);
  });

  it('keeps type scale and motion sane (edge)', () => {
    expect(fontSizes.xs).toBeLessThan(fontSizes.md);
    expect(fontSizes.md).toBeLessThan(fontSizes.display);
    expect(motion.fast).toBeLessThan(motion.normal);
    expect(motion.normal).toBeLessThan(motion.slow);
  });

  it('ships a viz palette with ≥6 distinct entries', () => {
    expect(new Set(chartPalette).size).toBeGreaterThanOrEqual(6);
  });
});

describe('design tokens — WCAG 2.2 AA pairs', () => {
  it('dark text on dark background ≥ 7:1 (happy path)', () => {
    expect(contrastRatio(darkPalette.text, darkPalette.background)).toBeGreaterThanOrEqual(7);
  });

  it('light text on light background ≥ 7:1 (happy path)', () => {
    expect(contrastRatio(lightPalette.text, lightPalette.background)).toBeGreaterThanOrEqual(7);
  });

  it('secondary text on background ≥ 4.5:1 in both modes (edge)', () => {
    expect(contrastRatio(darkPalette.textSecondary, darkPalette.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightPalette.textSecondary, lightPalette.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('accent text on accent ≥ 4.5:1 in both modes (edge)', () => {
    expect(contrastRatio(darkPalette.accentText, darkPalette.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightPalette.accentText, lightPalette.accent)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('design tokens — budgets', () => {
  it('matches the DoD Core Web Vitals thresholds', () => {
    expect(webVitalsBudgets.lcpMs).toBe(2500);
    expect(webVitalsBudgets.inpMs).toBe(200);
    expect(webVitalsBudgets.cls).toBe(0.1);
    expect(webVitalsBudgets.lighthouseMin).toBe(90);
  });
});
