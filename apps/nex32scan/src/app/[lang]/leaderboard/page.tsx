import { AddressCell, Badge, Card, Shell, langFrom } from '@/components/shell';
import { DataTable, type DataColumn } from '@/components/data-table';
import { dictionary } from '@/i18n';
import { buildLeaderboard, topByDiscipline, type LeaderRow } from '@/lib/leaderboard';
import { indexer } from '@/lib/explorer';
import { formatCount, formatPercent } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Leaderboards (PHASE 3.9, v1): one address board (wins → accuracy → blocks)
 * plus top-3 per discipline. Human / AI / centaur splits are NOT shown —
 * the chain records no solver kind, and inventing one would fake the data.
 */
function boardColumns(
  t: ReturnType<typeof dictionary>,
  lang: ReturnType<typeof langFrom>,
): readonly DataColumn<{ rank: number; row: LeaderRow }>[] {
  return [
    {
      key: 'rank',
      label: t.rank,
      sortable: true,
      sortValue: (entry) => entry.rank,
      text: (entry) => `${entry.rank}`,
      render: (entry) => <span className="font-semibold text-stone-900">#{entry.rank}</span>,
    },
    {
      key: 'miner',
      label: t.tableMiner,
      sortable: true,
      text: (entry) => entry.row.miner,
      render: (entry) => <AddressCell address={entry.row.miner} lang={lang} />,
    },
    {
      key: 'wins',
      label: t.wins,
      sortable: true,
      sortValue: (entry) => entry.row.wins,
      text: (entry) => `${entry.row.wins}`,
      render: (entry) => <span>{formatCount(entry.row.wins)}</span>,
    },
    {
      key: 'accuracy',
      label: t.accuracy,
      sortable: true,
      sortValue: (entry) => entry.row.accuracy,
      text: (entry) => `${Math.round(entry.row.accuracy * 100)}`,
      render: (entry) => <span>{formatPercent(entry.row.correct, entry.row.answers)}</span>,
    },
    {
      key: 'answers',
      label: t.tableAnswers,
      sortable: true,
      sortValue: (entry) => entry.row.answers,
      text: (entry) => `${entry.row.answers}`,
      render: (entry) => <span>{formatCount(entry.row.answers)}</span>,
    },
    {
      key: 'blocks',
      label: t.block,
      sortable: true,
      sortValue: (entry) => entry.row.blocks,
      text: (entry) => `${entry.row.blocks}`,
      render: (entry) => <span>{formatCount(entry.row.blocks)}</span>,
    },
  ];
}

export default async function Page({ params }: { params: { lang: string } }) {
  const lang = langFrom(params.lang);
  const t = dictionary(lang);
  const snapshot = await (await indexer()).snapshot();
  const blocks = snapshot.quizBlocks ?? [];
  const board = buildLeaderboard(blocks).map((row, index) => ({ rank: index + 1, row }));
  const disciplines = topByDiscipline(blocks, 3);

  return (
    <Shell lang={lang}>
      <Card title={`${t.leaderboard} · ${formatCount(board.length)}`} bodyClassName="">
        <DataTable
          columns={boardColumns(t, lang)}
          rows={board}
          pageSize={25}
          filterPlaceholder={t.searchHint}
          emptyLabel={t.noData}
          csvName="nex32scan-leaderboard.csv"
          csvLabel={t.csvExport}
          pageLabel={(page, total) => `${t.page} ${formatCount(page)}/${formatCount(total)}`}
        />
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-stone-900">{t.disciplines}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {disciplines.map((group) => (
          <Card
            key={group.disciplineId}
            title={lang === 'th' ? group.disciplineTh : group.disciplineEn}
          >
            {group.leaders.length === 0 ? (
              <p className="text-sm text-stone-600">{t.noData}</p>
            ) : (
              <ul className="space-y-2">
                {group.leaders.map((leader, index) => (
                  <li key={leader.miner} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Badge tone={index === 0 ? 'solid' : 'muted'}>#{index + 1}</Badge>
                      <AddressCell address={leader.miner} lang={lang} />
                    </span>
                    <span className="text-xs text-stone-600">
                      {formatCount(leader.wins)} {t.wins} · {formatPercent(leader.correct, leader.answers)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </Shell>
  );
}
