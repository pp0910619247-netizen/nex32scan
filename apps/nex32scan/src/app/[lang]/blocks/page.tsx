import Link from 'next/link';
import { AddressCell, Badge, Card, Shell, langFrom } from '@/components/shell';
import { DataTable, type DataColumn } from '@/components/data-table';
import { RelativeTime } from '@/components/live';
import { dictionary, timeWords, type TimeWords } from '@/i18n';
import { indexer } from '@/lib/explorer';
import { formatCount, formatNex } from '@/lib/format';
import { scheduledBlockReward } from '@/lib/reward';
import type { QuizExplorerBlock } from '@nexus/indexer';

export const dynamic = 'force-dynamic';

interface BlockRow {
  readonly block: QuizExplorerBlock;
  readonly rewardWei: string | null;
}

function toRow(block: QuizExplorerBlock): BlockRow {
  const reward = scheduledBlockReward(block.height);
  return { block, rewardWei: reward ? reward.rewardWei.toString() : null };
}

function columns(
  lang: ReturnType<typeof langFrom>,
  t: ReturnType<typeof dictionary>,
  words: TimeWords,
): readonly DataColumn<BlockRow>[] {
  return [
    {
      key: 'height',
      label: t.block,
      sortable: true,
      sortValue: (row) => row.block.height,
      text: (row) => `#${row.block.height}`,
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
            href={`/${lang}/block/${row.block.height}`}
          >
            #{formatCount(row.block.height)}
          </Link>
          {row.block.isHard ? <Badge tone="outline">{t.hard}</Badge> : null}
          {row.block.isMilestone ? <Badge tone="solid">{t.milestone}</Badge> : null}
        </div>
      ),
    },
    {
      key: 'age',
      label: t.tableAge,
      sortable: true,
      sortValue: (row) => row.block.timestamp,
      text: (row) => new Date(row.block.timestamp).toISOString(),
      render: (row) => <RelativeTime timestamp={row.block.timestamp} words={words} />,
    },
    {
      key: 'miner',
      label: t.tableMiner,
      sortable: true,
      text: (row) => row.block.miner,
      render: (row) => <AddressCell address={row.block.miner} lang={lang} />,
    },
    {
      key: 'answers',
      label: t.tableAnswers,
      sortable: true,
      sortValue: (row) => row.block.totalAnswers,
      text: (row) => `${row.block.totalAnswers} ${row.block.correctAnswers}`,
      render: (row) => (
        <span>
          {formatCount(row.block.totalAnswers)}
          <span className="ml-2 text-xs text-stone-600">
            {t.correct}: {formatCount(row.block.correctAnswers)}
          </span>
        </span>
      ),
    },
    {
      key: 'difficulty',
      label: t.statDifficulty,
      sortable: true,
      sortValue: (row) => row.block.difficultyBits,
      text: (row) => `${row.block.difficultyBits}`,
      render: (row) => (
        <span className="text-xs text-stone-600">{formatCount(row.block.difficultyBits)} bits</span>
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
}

export default async function Page({ params }: { params: { lang: string } }) {
  const lang = langFrom(params.lang);
  const t = dictionary(lang);
  const words = timeWords(lang);
  const snapshot = await (await indexer()).snapshot();
  const rows = (snapshot.quizBlocks ?? []).slice().reverse().map(toRow);

  return (
    <Shell lang={lang}>
      <Card title={`${t.blocksPage} · ${formatCount(rows.length)}`} bodyClassName="">
        <DataTable
          columns={columns(lang, t, words)}
          rows={rows}
          pageSize={25}
          filterPlaceholder={t.searchHint}
          emptyLabel={t.noData}
          csvName="nex32scan-blocks.csv"
          csvLabel={t.csvExport}
          pageLabel={(page, total) => `${t.page} ${formatCount(page)}/${formatCount(total)}`}
        />
      </Card>
    </Shell>
  );
}
