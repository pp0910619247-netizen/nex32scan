import { describe, expect, it } from 'vitest';

import {
  ALLOCATION_PUBLIC_SALE_BPS,
  ALLOCATION_TEAM_BPS,
  TOTAL_SUPPLY_NEX,
  TOTAL_SUPPLY_WEI,
  LOCK_RELEASE_BPS,
  LOCK_TRANCHE_COUNT,
  SALE_ROUNDS,
  SALE_TOTAL_DAYS,
  UNSOLD_RETURN_AFTER_DAY,
  UNSOLD_RETURN_MONTHS,
  formatUsdMicro,
  roundAllocationNex,
  roundAllocationWei,
  roundEndDay,
  roundRaiseUsdMicro,
  roundStartDay,
  saleTotals,
  trancheNex,
  trancheReleaseMonth,
  trancheWei,
  validateSaleSchedule,
} from '../src/index.js';

describe('sale schedule validity', () => {
  it('sells exactly the locked public-sale allocation across ordered rounds (happy path)', () => {
    expect(validateSaleSchedule()).toEqual([]);
    expect(saleTotals().allocationBps).toBe(ALLOCATION_PUBLIC_SALE_BPS);
    expect(saleTotals().allocationNex).toBe(6_300_000n);
  });

  it('keeps the price ladder rising and every round open (edge)', () => {
    let previous = 0n;
    for (const round of SALE_ROUNDS) {
      expect(round.allocationBps).toBeGreaterThan(0n);
      expect(round.durationDays).toBeGreaterThan(0);
      expect(round.priceUsdMicro).toBeGreaterThanOrEqual(previous);
      previous = round.priceUsdMicro;
    }
  });

  it('never allocates more NEX than the supply (edge)', () => {
    const allocated = SALE_ROUNDS.reduce((total, round) => total + roundAllocationNex(round), 0n);
    expect(allocated).toBeLessThanOrEqual(TOTAL_SUPPLY_NEX);
    expect(roundAllocationWei(SALE_ROUNDS[0]!)).toBeLessThanOrEqual(TOTAL_SUPPLY_WEI);
  });
});

describe('round timing', () => {
  it('starts round 1 on day 1 and runs back to back (happy path)', () => {
    expect(roundStartDay(SALE_ROUNDS[0]!)).toBe(1);
    expect(roundEndDay(SALE_ROUNDS[0]!)).toBe(SALE_ROUNDS[0]!.durationDays);
    expect(roundStartDay(SALE_ROUNDS[1]!)).toBe(roundEndDay(SALE_ROUNDS[0]!) + 1);
  });

  it('ends the last round exactly on the unsold-return day (edge)', () => {
    const last = SALE_ROUNDS[SALE_ROUNDS.length - 1]!;
    expect(roundEndDay(last)).toBe(SALE_TOTAL_DAYS);
    expect(UNSOLD_RETURN_AFTER_DAY).toBe(SALE_TOTAL_DAYS);
    expect(UNSOLD_RETURN_MONTHS).toBe(3n);
  });
});

describe('raise math', () => {
  it('multiplies allocation by price with no float drift (happy path)', () => {
    // Round 1: 1,260,000 NEX at $0.01 = $12,600.
    expect(roundRaiseUsdMicro(SALE_ROUNDS[0]!)).toBe(12_600_000_000n);
    expect(formatUsdMicro(roundRaiseUsdMicro(SALE_ROUNDS[0]!))).toBe('12,600.00');
  });

  it('totals the whole ladder (happy path)', () => {
    const totals = saleTotals();
    expect(totals.allocationNex).toBe(6_300_000n);
    expect(formatUsdMicro(totals.targetRaiseUsdMicro)).toBe('126,000.00');
    expect(totals.days).toBe(SALE_TOTAL_DAYS);
  });

  it('keeps fractional prices instead of truncating them (edge)', () => {
    expect(formatUsdMicro(22_500n)).toBe('0.0225');
    expect(formatUsdMicro(10_000n)).toBe('0.01');
    expect(formatUsdMicro(30_000n)).toBe('0.03');
  });

  it('rejects negative USD amounts (edge)', () => {
    expect(() => formatUsdMicro(-1n)).toThrow(RangeError);
    expect(formatUsdMicro(0n)).toBe('0.00');
  });
});

describe('locked allocation release', () => {
  it('releases four equal 5% tranches summing to the locked allocation (happy path)', () => {
    expect(LOCK_RELEASE_BPS * LOCK_TRANCHE_COUNT).toBe(ALLOCATION_TEAM_BPS);
    expect(trancheNex()).toBe(1_050_000n);
    expect(trancheNex() * LOCK_TRANCHE_COUNT).toBe(4_200_000n);
    expect(trancheWei()).toBe(TOTAL_SUPPLY_WEI / 20n);
  });

  it('unlocks on months 3, 6, 9 and 12 (happy path)', () => {
    expect([0, 1, 2, 3].map(trancheReleaseMonth)).toEqual([3n, 6n, 9n, 12n]);
  });

  it('rejects a tranche index outside the schedule (edge)', () => {
    expect(() => trancheReleaseMonth(-1)).toThrow(RangeError);
    expect(() => trancheReleaseMonth(4)).toThrow(RangeError);
  });
});
