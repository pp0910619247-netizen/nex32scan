/**
 * Pure scaling behind the SVG charts. UI-free so it unit-tests in Node.
 * Display-only: exact accounting stays in `lib/reward` (bigint wei).
 */

/** Normalize values into bar heights within `0..maxHeight` (flat zero when all are 0). */
export function scaleBars(values: readonly number[], maxHeight: number): number[] {
  const peak = Math.max(0, ...values);
  if (peak <= 0 || maxHeight <= 0) return values.map(() => 0);
  return values.map((value) => Math.max(0, Math.min(maxHeight, (Math.max(0, value) / peak) * maxHeight)));
}

/** Evenly spaced x-centers for `count` bars across `width`. */
export function barCenters(count: number, width: number): number[] {
  if (count <= 0 || width <= 0) return [];
  const slot = width / count;
  return Array.from({ length: count }, (_, index) => slot * index + slot / 2);
}
