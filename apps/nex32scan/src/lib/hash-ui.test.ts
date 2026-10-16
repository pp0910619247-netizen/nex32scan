import { describe, expect, it } from 'vitest';

import { identiconBackground, identiconHue } from './hash-ui';

describe('identiconHue', () => {
  it('is deterministic for the same input (happy path)', () => {
    expect(identiconHue('0xabc')).toBe(identiconHue('0xabc'));
  });

  it('stays inside 0–359 for varied inputs (edge)', () => {
    for (const value of ['', '0x0', '0x' + 'f'.repeat(40), 'quiz-block-1397']) {
      const hue = identiconHue(value);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it('usually differs between distinct addresses (edge)', () => {
    const hues = new Set(
      ['0x1111', '0x2222', '0x3333', '0x4444', '0x5555'].map(identiconHue),
    );
    expect(hues.size).toBeGreaterThan(1);
  });
});

describe('identiconBackground', () => {
  it('embeds the hue and stays stable (happy path)', () => {
    const a = identiconBackground('0xabc');
    expect(a).toContain(`hsl(${identiconHue('0xabc')}`);
    expect(a).toBe(identiconBackground('0xabc'));
  });
});
