'use client';

/**
 * DataTable — sortable, filterable, paginated table with CSV export.
 * All data stays in props (server components fetch, this only presents).
 */
import { useMemo, useState, type ReactNode } from 'react';

import { filterRows, sortRows, toCSV, type SortDir } from '@/lib/table';

export interface DataColumn<T> {
  /** Stable key for sort state + CSV column order. */
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly render: (row: T) => ReactNode;
  /** Comparable value for sorting (defaults to filter text). */
  readonly sortValue?: (row: T) => string | number | null;
  /** Plain text for filtering + CSV cells. */
  readonly text: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  pageSize = 25,
  filterPlaceholder,
  emptyLabel,
  csvName,
  csvLabel,
  pageLabel,
}: {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  pageSize?: number;
  filterPlaceholder: string;
  emptyLabel: string;
  csvName: string;
  csvLabel: string;
  pageLabel: (page: number, totalPages: number) => string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const filtered = filterRows(rows, filter, (row) =>
      columns.map((column) => column.text(row)).join(' '),
    );
    const column = columns.find((candidate) => candidate.key === sortKey);
    if (!column?.sortable) return filtered;
    const pick = column.sortValue ?? ((row: T) => column.text(row));
    return sortRows(filtered, pick, sortDir);
  }, [rows, columns, filter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    setPage(1);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    }
  };

  const downloadCSV = () => {
    const header = columns.map((column) => column.label);
    const body = visible.map((row) => columns.map((column) => column.text(row)));
    const blob = new Blob([toCSV(header, body)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = csvName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        <input
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPage(1);
          }}
          placeholder={filterPlaceholder}
          aria-label={filterPlaceholder}
          className="min-w-[12rem] flex-1 rounded border border-stone-200 px-2 py-1 text-sm outline-none placeholder:text-stone-400 focus:border-amber-500"
        />
        <button
          type="button"
          onClick={downloadCSV}
          className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:border-amber-400 hover:text-stone-900 focus:outline-2 focus:outline-amber-500"
        >
          {csvLabel} ({visible.length})
        </button>
        {totalPages > 1 ? (
          <span className="ml-auto flex items-center gap-2 text-xs text-stone-600">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded border border-stone-200 px-2 py-1 disabled:opacity-40"
            >
              ←
            </button>
            <span>
              {pageLabel(safePage, totalPages)}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded border border-stone-200 px-2 py-1 disabled:opacity-40"
            >
              →
            </button>
          </span>
        ) : null}
      </div>
      {pageRows.length === 0 ? (
        <p className="p-4 text-sm text-stone-600">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-stone-500">
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-2 font-medium" aria-sort={sortKey === column.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="uppercase tracking-wide hover:text-stone-900 focus:outline-2 focus:outline-amber-500"
                      >
                        {column.label}
                        {sortKey === column.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-stone-200 hover:bg-stone-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-2 align-middle">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
