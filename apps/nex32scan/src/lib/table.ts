/**
 * Pure helpers behind `DataTable`: sort, filter and CSV export.
 * UI-free so they unit-test in Node.
 */

export type SortDir = 'asc' | 'desc';

/** Sort rows by a comparable key; stable, nulls last. */
export function sortRows<T>(rows: readonly T[], pick: (row: T) => string | number | null, dir: SortDir): T[] {
  const factor = dir === 'asc' ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const va = pick(a.row);
      const vb = pick(b.row);
      if (va === null && vb === null) return a.index - b.index;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return a.index - b.index;
    })
    .map((entry) => entry.row);
}

/** Case-insensitive substring filter over a row's searchable text. */
export function filterRows<T>(rows: readonly T[], query: string, text: (row: T) => string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter((row) => text(row).toLowerCase().includes(needle));
}

/** Quote one CSV cell (RFC 4180: wrap when it holds `",` or newline). */
export function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Build a CSV document (header + rows, `\r\n` line endings). */
export function toCSV(header: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  const lines = [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))];
  return lines.join('\r\n') + '\r\n';
}
