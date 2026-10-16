'use client';

/**
 * Client table for the leaderboard board (see blocks-table.tsx for why the
 * columns live on the client side of the RSC boundary).
 */
import { DataTable, type DataColumn } from '@/components/data-table';
import { AddressCell } from '@/components/table-bits';
import { dictionary, type Lang } from '@/i18n';
import { formatCount, formatPercent } from '@/lib/format';

/** Plain (serializable) row shape built by the server page. */
export interface LeaderboardTableRow {
  readonly rank: number;
  readonly miner: string;
  readonly wins: number;
  readonly accuracy: number;
  readonly answers: number;
  readonly correct: number;
  readonly blocks: number;
}

export function LeaderboardTable({ lang, rows }: { lang: Lang; rows: readonly LeaderboardTableRow[] }) {
  const t = dictionary(lang);
  const columns: readonly DataColumn<LeaderboardTableRow>[] = [
    {
      key: 'rank',
      label: t.rank,
      sortable: true,
      sortValue: (row) => row.rank,
      text: (row) => `${row.rank}`,
      render: (row) => <span className="font-semibold text-stone-900">#{row.rank}</span>,
    },
    {
      key: 'miner',
      label: t.tableMiner,
      sortable: true,
      text: (row) => row.miner,
      render: (row) => <AddressCell address={row.miner} lang={lang} />,
    },
    {
      key: 'wins',
      label: t.wins,
      sortable: true,
      sortValue: (row) => row.wins,
      text: (row) => `${row.wins}`,
      render: (row) => <span>{formatCount(row.wins)}</span>,
    },
    {
      key: 'accuracy',
      label: t.accuracy,
      sortable: true,
      sortValue: (row) => row.accuracy,
      text: (row) => `${Math.round(row.accuracy * 100)}`,
      render: (row) => <span>{formatPercent(row.correct, row.answers)}</span>,
    },
    {
      key: 'answers',
      label: t.tableAnswers,
      sortable: true,
      sortValue: (row) => row.answers,
      text: (row) => `${row.answers}`,
      render: (row) => <span>{formatCount(row.answers)}</span>,
    },
    {
      key: 'blocks',
      label: t.block,
      sortable: true,
      sortValue: (row) => row.blocks,
      text: (row) => `${row.blocks}`,
      render: (row) => <span>{formatCount(row.blocks)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      pageSize={25}
      filterPlaceholder={t.searchHint}
      emptyLabel={t.noData}
      csvName="nex32scan-leaderboard.csv"
      csvLabel={t.csvExport}
      pageLabel={(page, total) => `${t.page} ${formatCount(page)}/${formatCount(total)}`}
    />
  );
}
