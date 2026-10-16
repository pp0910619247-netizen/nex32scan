import { describe, expect, it } from 'vitest';

import { nlHref, parseNlQuery } from './nl-search';

describe('parseNlQuery', () => {
  it('understands block and problem references in both languages (happy path)', () => {
    expect(parseNlQuery('block 12')).toEqual({ page: 'block', height: 12 });
    expect(parseNlQuery('บล็อก #7')).toEqual({ page: 'block', height: 7 });
    expect(parseNlQuery('problem 3')).toEqual({ page: 'problem', height: 3 });
    expect(parseNlQuery('โจทย์ 9')).toEqual({ page: 'problem', height: 9 });
  });

  it('understands page intents in both languages (happy path)', () => {
    expect(parseNlQuery('latest block')).toEqual({ page: 'latest' });
    expect(parseNlQuery('ล่าสุด')).toEqual({ page: 'latest' });
    expect(parseNlQuery('leaderboard')).toEqual({ page: 'leaderboard' });
    expect(parseNlQuery('ลีดเดอร์บอร์ด')).toEqual({ page: 'leaderboard' });
    expect(parseNlQuery('token')).toEqual({ page: 'token' });
    expect(parseNlQuery('impact')).toEqual({ page: 'impact' });
    expect(parseNlQuery('blocks')).toEqual({ page: 'blocks' });
  });

  it('rejects empties, zero heights and anything outside the allowlist (edge)', () => {
    expect(parseNlQuery('')).toBeNull();
    expect(parseNlQuery('block 0')).toBeNull();
    expect(parseNlQuery('delete everything')).toBeNull();
    expect(parseNlQuery('0x1234')).toBeNull();
  });
});

describe('nlHref', () => {
  it('maps targets to locale hrefs (happy path)', () => {
    expect(nlHref('en', { page: 'blocks' }, 10)).toBe('/en/blocks');
    expect(nlHref('th', { page: 'block', height: 4 }, 10)).toBe('/th/block/4');
    expect(nlHref('en', { page: 'latest' }, 10)).toBe('/en/block/10');
  });

  it('refuses latest without a chain height (edge)', () => {
    expect(nlHref('en', { page: 'latest' }, 0)).toBeNull();
  });
});
