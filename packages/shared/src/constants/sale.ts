import {
  ALLOCATION_PUBLIC_SALE_BPS,
  ALLOCATION_TEAM_BPS,
  BPS_DENOMINATOR,
  TOTAL_SUPPLY_NEX,
  TOTAL_SUPPLY_WEI,
} from './tokenomics.js';

/**
 * Public-sale schedule (AGENTS.md §4: public sale = 30% of TOTAL_SUPPLY).
 *
 * The 30% is released in four themed rounds instead of one open-ended sale, so
 * the price ladder is published up front and every round has a hard close.
 *
 * Mechanics fixed here (single source of truth — the explorer page and the
 * mobile Project tab both render these numbers, never a copy):
 *
 * - Rounds run back to back for 90 days in total (~3 months).
 * - Allocation **not sold** when a round closes rolls into the next round.
 * - Allocation still unsold after the final round returns to the owner's
 *   wallet (UNSOLD_RETURN_MONTHS = 3).
 * - Proceeds split 50% DEX liquidity lock / 50% Dev Treasury (AGENTS.md §4).
 *
 * Prices are `bigint` micro-USD (1 USD = 1_000_000) so nothing is ever a
 * float. USD figures are a testnet-preview proposal, not an offer.
 */

/** Micro-USD scale: 1 USD = 1_000_000 micro. */
export const USD_MICRO = 1_000_000n;

export interface SaleRound {
  /** 1-based round number, also the display order. */
  readonly round: number;
  /** Share of TOTAL_SUPPLY sold in this round, in basis points of total supply. */
  readonly allocationBps: bigint;
  /** Price per 1 NEX in micro-USD (e.g. 10_000 = $0.01). */
  readonly priceUsdMicro: bigint;
  /** Days this round stays open. */
  readonly durationDays: number;
  /** i18n key for the round's display name. */
  readonly nameKey: 'sale.round1' | 'sale.round2' | 'sale.round3' | 'sale.round4';
}

/**
 * Round ladder: 6% + 8% + 8% + 8% = 30% of total supply (6,300,000 NEX).
 * Prices rise each round, so early supporters are rewarded for the risk taken.
 */
export const SALE_ROUNDS: readonly SaleRound[] = [
  { round: 1, allocationBps: 600n, priceUsdMicro: 10_000n, durationDays: 21, nameKey: 'sale.round1' },
  { round: 2, allocationBps: 800n, priceUsdMicro: 15_000n, durationDays: 21, nameKey: 'sale.round2' },
  { round: 3, allocationBps: 800n, priceUsdMicro: 22_500n, durationDays: 21, nameKey: 'sale.round3' },
  { round: 4, allocationBps: 800n, priceUsdMicro: 30_000n, durationDays: 27, nameKey: 'sale.round4' },
] as const;

/** Total length of the sale window in days (sum of every round). */
export const SALE_TOTAL_DAYS = SALE_ROUNDS.reduce((total, round) => total + round.durationDays, 0);

/**
 * Days after the sale opens at which unsold allocation goes back to the owner
 * wallet — the owner's rule: "ไม่หมดเหรียญจะกลับเขามาในกระเป๋าผมในเวลา 3 เดือน".
 */
export const UNSOLD_RETURN_MONTHS = 3n;
export const UNSOLD_RETURN_AFTER_DAY = SALE_TOTAL_DAYS;

/* ------------------------------- locked 20% ------------------------------- */

/**
 * The locked allocation (20% of supply) is released in equal quarterly
 * tranches: 5% at month 3, 6, 9 and 12 — four tranches of 5% (AGENTS.md §4,
 * "cliff 0, unlock เท่าๆ กันทุก 3 เดือน").
 */
export const LOCK_RELEASE_BPS = 500n;
export const LOCK_RELEASE_INTERVAL_MONTHS = 3n;
export const LOCK_TRANCHE_COUNT = 4n;

/** Months (1-based) at which each tranche unlocks: 3, 6, 9, 12. */
export function trancheReleaseMonth(trancheIndex: number): bigint {
  if (trancheIndex < 0 || BigInt(trancheIndex) >= LOCK_TRANCHE_COUNT) {
    throw new RangeError(`Tranche index out of range: ${trancheIndex}`);
  }
  return BigInt(trancheIndex + 1) * LOCK_RELEASE_INTERVAL_MONTHS;
}

/** NEX released by one tranche (whole tokens). */
export function trancheNex(): bigint {
  return (TOTAL_SUPPLY_NEX * LOCK_RELEASE_BPS) / BPS_DENOMINATOR;
}

/** NEX released by one tranche in wei. */
export function trancheWei(): bigint {
  return (TOTAL_SUPPLY_WEI * LOCK_RELEASE_BPS) / BPS_DENOMINATOR;
}

/* -------------------------------- helpers --------------------------------- */

/** NEX allocated to one round (whole tokens). */
export function roundAllocationNex(round: SaleRound): bigint {
  return (TOTAL_SUPPLY_NEX * round.allocationBps) / BPS_DENOMINATOR;
}

/** NEX allocated to one round in wei. */
export function roundAllocationWei(round: SaleRound): bigint {
  return (TOTAL_SUPPLY_WEI * round.allocationBps) / BPS_DENOMINATOR;
}

/** Raised by fully selling one round, in micro-USD. */
export function roundRaiseUsdMicro(round: SaleRound): bigint {
  return roundAllocationNex(round) * round.priceUsdMicro;
}

/** Day index (1-based) on which each round opens. */
export function roundStartDay(round: SaleRound): number {
  return (
    SALE_ROUNDS.filter((candidate) => candidate.round < round.round).reduce(
      (total, candidate) => total + candidate.durationDays,
      0,
    ) + 1
  );
}

/** Day index of each round's last day (inclusive). */
export function roundEndDay(round: SaleRound): number {
  return roundStartDay(round) + round.durationDays - 1;
}

export interface SaleTotals {
  readonly allocationBps: bigint;
  readonly allocationNex: bigint;
  readonly targetRaiseUsdMicro: bigint;
  readonly days: number;
}

/** Totals across every round, for headline numbers on the site/app. */
export function saleTotals(): SaleTotals {
  return SALE_ROUNDS.reduce<SaleTotals>(
    (totals, round) => ({
      allocationBps: totals.allocationBps + round.allocationBps,
      allocationNex: totals.allocationNex + roundAllocationNex(round),
      targetRaiseUsdMicro: totals.targetRaiseUsdMicro + roundRaiseUsdMicro(round),
      days: totals.days + round.durationDays,
    }),
    { allocationBps: 0n, allocationNex: 0n, targetRaiseUsdMicro: 0n, days: 0 },
  );
}

/** Groups a non-negative integer with thousands separators. */
function groupThousands(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats micro-USD as a plain USD string with no float math and no rounding.
 *
 * Fractional prices survive: $0.01 and $0.0225 render as `0.01` / `0.0225`
 * (whole amounts still show two decimals, `12600.00`).
 */
export function formatUsdMicro(micro: bigint): string {
  if (micro < 0n) {
    throw new RangeError(`USD amount cannot be negative: ${micro}`);
  }
  const whole = groupThousands(micro / USD_MICRO);
  const remainder = micro % USD_MICRO;
  if (remainder === 0n) {
    return `${whole}.00`;
  }
  const digits = remainder.toString().padStart(6, '0').replace(/0+$/, '');
  const fraction = digits.length < 2 ? digits.padEnd(2, '0') : digits;
  return `${whole}.${fraction}`;
}

/**
 * Self-check used by tests and by the pages that render the ladder: every
 * round must be sellable, ordered, and the rounds must add up to exactly the
 * locked public-sale allocation.
 */
export function validateSaleSchedule(): string[] {
  const issues: string[] = [];
  if (SALE_ROUNDS.length === 0) {
    issues.push('no sale rounds defined');
    return issues;
  }
  let previousPrice = 0n;
  for (const round of SALE_ROUNDS) {
    if (round.allocationBps <= 0n) {
      issues.push(`round ${round.round} has no allocation`);
    }
    if (round.durationDays <= 0) {
      issues.push(`round ${round.round} has no duration`);
    }
    if (round.priceUsdMicro < previousPrice) {
      issues.push(`round ${round.round} is cheaper than the round before it`);
    }
    previousPrice = round.priceUsdMicro;
  }
  const totals = saleTotals();
  if (totals.allocationBps !== ALLOCATION_PUBLIC_SALE_BPS) {
    issues.push(
      `sale rounds cover ${totals.allocationBps.toString()} bps, expected ${ALLOCATION_PUBLIC_SALE_BPS.toString()}`,
    );
  }
  if (LOCK_RELEASE_BPS * LOCK_TRANCHE_COUNT !== ALLOCATION_TEAM_BPS) {
    issues.push('locked tranches do not add up to the locked allocation');
  }
  if (UNSOLD_RETURN_AFTER_DAY !== SALE_TOTAL_DAYS) {
    issues.push('unsold return day must equal the end of the sale window');
  }
  return issues;
}
