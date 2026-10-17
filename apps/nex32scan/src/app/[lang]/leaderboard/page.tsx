import type { Metadata } from 'next';
import { AddressCell, Badge, Card, Shell, langFrom } from '@/components/shell';
import { LeaderboardTable, type LeaderboardTableRow } from '@/components/leaderboard-table';
import { dictionary } from '@/i18n';
import { buildLeaderboard, topByDiscipline } from '@/lib/leaderboard';
import { indexer } from '@/lib/explorer';
import { formatCount, formatPercent } from '@/lib/format';
import { pageAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return { alternates: pageAlternates(langFrom(params.lang), '/leaderboard') };
}

/**
 * Leaderboards (PHASE 3.9, v1): one address board (wins → accuracy → blocks)
 * plus top-3 per discipline. Human / AI / centaur splits are NOT shown —
 * the chain records no solver kind, and inventing one would fake the data.
 * Rows are mapped to plain serializable fields because the board table is a
 * client component.
 */
export default async function Page({ params }: { params: { lang: string } }) {
  const lang = langFrom(params.lang);
  const t = dictionary(lang);
  const snapshot = await (await indexer()).snapshot();
  const blocks = snapshot.quizBlocks ?? [];
  const board: readonly LeaderboardTableRow[] = buildLeaderboard(blocks).map((row, index) => ({
    rank: index + 1,
    miner: row.miner,
    wins: row.wins,
    accuracy: row.accuracy,
    answers: row.answers,
    correct: row.correct,
    blocks: row.blocks,
  }));
  const disciplines = topByDiscipline(blocks, 3);

  return (
    <Shell lang={lang}>
      <Card title={`${t.leaderboard} · ${formatCount(board.length)}`} bodyClassName="">
        <LeaderboardTable lang={lang} rows={board} />
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
