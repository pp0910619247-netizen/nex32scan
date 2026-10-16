import { describe, expect, it } from 'vitest';

import { barCenters, scaleBars } from './chart';

describe('scaleBars', () => {
  it('normalizes the peak to maxHeight (happy path)', () => {
    expect(scaleBars([0, 50, 100], 200)).toEqual([0, 100, 200]);
  });

  it('returns zeros for empty, flat or non-positive input (edge)', () => {
    expect(scaleBars([], 100)).toEqual([]);
    expect(scaleBars([0, 0], 100)).toEqual([0, 0]);
    expect(scaleBars([5], 0)).toEqual([0]);
  });

  it('clamps negatives instead of drawing below zero (edge)', () => {
    expect(scaleBars([-10, 10], 100)).toEqual([0, 100]);
  });
});

describe('barCenters', () => {
  it('spaces centers evenly (happy path)', () => {
    expect(barCenters(4, 200)).toEqual([25, 75, 125, 175]);
  });

  it('returns empty for degenerate input (edge)', () => {
    expect(barCenters(0, 200)).toEqual([]);
    expect(barCenters(4, 0)).toEqual([]);
  });
});
