import { describe, expect, it } from 'vitest';

import {
  FORGE_DISCIPLINES,
  FORGE_FORMAT_QUOTAS,
  FORGE_INTEGRITY,
  FORGE_TIERS,
  forgeTotalItems,
  mcqPassRateCap,
  validateForgeConfig,
} from '../src/forge/config.js';

describe('forge config (spec §5.1–5.2)', () => {
  it('defines 13 disciplines with taxonomy + verification paths (happy path)', () => {
    expect(FORGE_DISCIPLINES).toHaveLength(13);
    expect(FORGE_DISCIPLINES.map((d) => d.code)).toContain('MATH');
    expect(FORGE_DISCIPLINES.map((d) => d.code)).toContain('LING');
    for (const discipline of FORGE_DISCIPLINES) {
      expect(discipline.taxonomy.trim().length).toBeGreaterThan(0);
      expect(discipline.verification.trim().length).toBeGreaterThan(0);
    }
  });

  it('requires human experts exactly for BIO/MED/PSYN/PHIL/HIST/LING/QUANT (happy path)', () => {
    const expert = new Set(
      FORGE_DISCIPLINES.filter((d) => d.requiresExpert).map((d) => d.code),
    );
    expect([...expert].sort()).toEqual(['BIO', 'HIST', 'LING', 'MED', 'PHIL', 'PSYN', 'QUANT']);
  });

  it('ships 5 tiers of 2,500 (2,000 public + 500 holdout) = 12,500 (happy path)', () => {
    expect(FORGE_TIERS.map((t) => t.id)).toEqual(['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'OMEGA']);
    for (const tier of FORGE_TIERS) {
      expect(tier.items).toBe(2500);
      expect(tier.publicItems).toBe(2000);
      expect(tier.holdoutItems).toBe(500);
    }
    expect(forgeTotalItems()).toBe(12500);
  });

  it('ramps single:cross 80:20 → 40:60 with falling pass-rate caps (happy path)', () => {
    expect(FORGE_TIERS.map((t) => t.singleShare)).toEqual([80, 70, 60, 50, 40]);
    expect(FORGE_TIERS.map((t) => t.passRateCap)).toEqual([0.3, 0.25, 0.2, 0.15, 0.1]);
  });

  it('passes its own consistency check (happy path)', () => {
    expect(validateForgeConfig()).toEqual([]);
  });

  it('caps MCQ at min(tier cap, guessing floor) and rejects bad counts (edge)', () => {
    expect(mcqPassRateCap(0.3, 5)).toBe(0.2);
    expect(mcqPassRateCap(0.1, 5)).toBe(0.1);
    expect(() => mcqPassRateCap(0.3, 0)).toThrow(RangeError);
  });

  it('keeps format quotas and integrity thresholds sane (edge)', () => {
    expect(FORGE_FORMAT_QUOTAS.exactMatchMinShare).toBe(0.7);
    expect(FORGE_FORMAT_QUOTAS.multipleChoiceMaxShare).toBe(0.3);
    expect(FORGE_FORMAT_QUOTAS.multipleChoiceMinOptions).toBe(5);
    expect(FORGE_INTEGRITY.dedupCosine).toBe(0.85);
  });
});
