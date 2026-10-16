import { describe, expect, it } from 'vitest';

import { csvCell, filterRows, sortRows, toCSV } from './table';

const ROWS = [
  { id: 'b', n: 2 },
  { id: 'a', n: 1 },
  { id: 'c', n: 3 },
];

describe('sortRows', () => {
  it('sorts ascending and descending by key (happy path)', () => {
    expect(sortRows(ROWS, (r) => r.id, 'asc').map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(sortRows(ROWS, (r) => r.n, 'desc').map((r) => r.n)).toEqual([3, 2, 1]);
  });

  it('keeps nulls last and stays stable (edge)', () => {
    const mixed = [{ v: null }, { v: 1 }, { v: null }, { v: 0 }];
    expect(sortRows(mixed, (r) => r.v, 'asc').map((r) => r.v)).toEqual([0, 1, null, null]);
  });
});

describe('filterRows', () => {
  it('matches case-insensitively and trims (happy path)', () => {
    expect(filterRows(ROWS, ' B ', (r) => r.id).map((r) => r.id)).toEqual(['b']);
  });

  it('returns everything on a blank query (edge)', () => {
    expect(filterRows(ROWS, '   ', (r) => r.id)).toHaveLength(3);
  });
});

describe('CSV', () => {
  it('quotes cells holding commas, quotes or newlines (happy path)', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('plain')).toBe('plain');
  });

  it('builds a header-plus-rows document (happy path)', () => {
    expect(toCSV(['h1', 'h2'], [[1, 'x'], [2, 'y,z']])).toBe('h1,h2\r\n1,x\r\n2,"y,z"\r\n');
  });
});
