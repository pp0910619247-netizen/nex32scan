/**
 * Pure helpers behind `HashChip`: deterministic identicon hue + copy text.
 * Kept UI-free so they unit-test in Node (no React Native / DOM imports).
 */

/** Deterministic hue (0–359) from any hash/address string. */
export function identiconHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

/** CSS background for the identicon dot: stable per value, theme-aware. */
export function identiconBackground(value: string): string {
  const hue = identiconHue(value);
  return `conic-gradient(from 0deg, hsl(${hue} 70% 55%), hsl(${(hue + 60) % 360} 70% 45%), hsl(${hue} 70% 55%))`;
}
