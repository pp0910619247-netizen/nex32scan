import { describe, expect, it } from 'vitest';

import { resolveSearchHref } from './palette';

describe('resolveSearchHref', () => {
  it('links blocks by height in both locales (happy path)', () => {
    expect(resolveSearchHref('en', { kind: 'block', height: 12 })).toBe('/en/block/12');
    expect(resolveSearchHref('th', { kind: 'block', height: 1 })).toBe('/th/block/1');
  });

  it('links checksummed addresses lowercased (happy path)', () => {
    const mixed = '0xAbCDEF1234567890AbCDEF1234567890AbCDEF12';
    expect(resolveSearchHref('en', { kind: 'address', address: mixed })).toBe(
      `/en/address/${mixed.toLowerCase()}`,
    );
  });

  it('falls back to the search page for transaction hashes (happy path)', () => {
    const hash = `0x${'ab'.repeat(32)}`;
    expect(resolveSearchHref('th', { kind: 'transaction', hash })).toBe(`/th/search?q=${hash}`);
  });

  it('returns null for misses and malformed payloads (edge)', () => {
    expect(resolveSearchHref('en', { kind: 'notFound' })).toBeNull();
    expect(resolveSearchHref('en', { kind: 'invalid' })).toBeNull();
    expect(resolveSearchHref('en', { kind: 'block', height: 0 })).toBeNull();
    expect(resolveSearchHref('en', { kind: 'address', address: 'not-an-address' })).toBeNull();
    expect(resolveSearchHref('en', { kind: 'transaction', hash: '0x123' })).toBeNull();
  });
});
