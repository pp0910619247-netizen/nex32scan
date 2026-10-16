'use client';

/**
 * Client table for the blocks list.
 *
 * Column definitions contain functions (sortValue/text/render) and JSX, which
 * cannot cross a server→client prop boundary — so the server page passes only
 * serializable rows and the columns are built here, inside the client
 * component. (Passing functions directly from an async server component to
 * this table was the original `/blocks` 500: "Functions cannot be passed
 * directly to Client Components".)
 */
import Link from 'next/link';
import { DataTable, type DataColumn } from '@/components/data-table';
import { AddressCell, Badge, LINK_CLASS } from '@/components/table-bits';
import { RelativeTime } from '@/components/live';
import { dictionary, timeWords, type Lang } from '@/i18n';
import { formatCount, formatNex } from '@/lib/format';
import type { BlocksTableRow } from '@/lib/blocks-table-rows';

export function BlocksTable({ lang, rows }: { lang: Lang; rows: readonly BlocksTableRow[] }) {
  const t = dictionary(lang);
  const words = timeWords(lang);
  const columns: readonly DataColumn<BlocksTableRow>[] = [
    {
      key: 'height',
      label: t.block,
      sortable: true,
      sortValue: (row) => row.height,
      text: (row) => `#${row.height}`,
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link className={LINK_CLASS} href={`/${lang}/block/${row.height}`}>
            #{formatCount(row.height)}
          </Link>
          {row.isHard ? <Badge tone="outline">{t.hard}</Badge> : null}
          {row.isMilestone ? <Badge tone="solid">{t.milestone}</Badge> : null}
        </div>
      ),
    },
    {
      key: 'age',
      label: t.tableAge,
      sortable: true,
      sortValue: (row) => row.timestamp,
      text: (row) => new Date(row.timestamp).toISOString(),
      render: (row) => <RelativeTime timestamp={row.timestamp} words={words} />,
    },
    {
      key: 'miner',
      label: t.tableMiner,
      sortable: true,
      text: (row) => row.miner,
      render: (row) => <AddressCell address={row.miner} lang={lang} />,
    },
    {
      key: 'answers',
      label: t.tableAnswers,
      sortable: true,
      sortValue: (row) => row.totalAnswers,
      text: (row) => `${row.totalAnswers} ${row.correctAnswers}`,
      render: (row) => (
        <span>
          {formatCount(row.totalAnswers)}
          <span className="ml-2 text-xs text-stone-600">
            {t.correct}: {formatCount(row.correctAnswers)}
          </span>
        </span>
      ),
    },
    {
      key: 'difficulty',
      label: t.statDifficulty,
      sortable: true,
      sortValue: (row) => row.difficultyBits,
      text: (row) => `${row.difficultyBits}`,
      render: (row) => (
        <span className="text-xs text-stone-600">{formatCount(row.difficultyBits)} bits</span>
      ),
    },
    {
      key: 'reward',
      label: t.tableReward,
      sortable: true,
      sortValue: (row) => (row.rewardWei === null ? null : BigInt(row.rewardWei).toString().padStart(30, '0')),
      text: (row) => (row.rewardWei === null ? '' : formatNex(BigInt(row.rewardWei))),
      render: (row) => (
        <span className="text-stone-700">
          {row.rewardWei === null ? '—' : `${formatNex(BigInt(row.rewardWei))} NEX`}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      pageSize={25}
      filterPlaceholder={t.searchHint}
      emptyLabel={t.noData}
      csvName="nex32scan-blocks.csv"
      csvLabel={t.csvExport}
      pageLabel={(page, total) => `${t.page} ${formatCount(page)}/${formatCount(total)}`}
    />
  );
}
