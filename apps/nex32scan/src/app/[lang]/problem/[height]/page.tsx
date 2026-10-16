import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddressCell, Badge, Card, Shell, langFrom } from '@/components/shell';
import { HashChip } from '@/components/hash-chip';
import { dictionary } from '@/i18n';
import { indexer } from '@/lib/explorer';
import { formatCount, formatPercent } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Problem view (PHASE 3.3): public metadata only — discipline, difficulty,
 * solve rate, commitment seal. The answer appears only after reveal;
 * holdout items never render here (no holdout set is published yet).
 */
export default async function Page({ params }: { params: { lang: string; height: string } }) {
  const lang = langFrom(params.lang);
  const t = dictionary(lang);
  const height = Number(params.height);
  if (!Number.isSafeInteger(height) || height < 1) notFound();

  const explorer = await indexer();
  const [quizBlock, problems] = await Promise.all([
    explorer.getQuizBlock(height),
    explorer.latestProblems(10000),
  ]);
  const problem = problems.find((entry) => entry.blockHeight === height);
  if (!quizBlock && !problem) notFound();

  const revealed = quizBlock?.revealedAnswerIndex ?? null;
  const solveRate =
    quizBlock && quizBlock.totalAnswers > 0
      ? formatPercent(quizBlock.correctAnswers, quizBlock.totalAnswers)
      : '—';

  return (
    <Shell lang={lang}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          className="text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
          href={`/${lang}/block/${height}`}
        >
          {t.block} #{formatCount(height)}
        </Link>
        {quizBlock?.isHard ? <Badge tone="outline">{t.hard}</Badge> : null}
        {quizBlock?.isMilestone ? <Badge tone="solid">{t.milestone}</Badge> : null}
        {revealed !== null ? <Badge tone="solid">{t.revealed}</Badge> : <Badge tone="muted">{t.notRevealed}</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title={t.problem}>
            <p className="mb-2 text-sm text-stone-800">
              {lang === 'th'
                ? (quizBlock?.promptTh ?? problem?.statement.th)
                : (quizBlock?.promptEn ?? problem?.statement.en)}
            </p>
            <p className="mb-3 text-xs text-stone-500">
              {lang === 'th'
                ? (quizBlock?.promptEn ?? problem?.statement.en)
                : (quizBlock?.promptTh ?? problem?.statement.th)}
            </p>
            {quizBlock ? (
              <ol className="grid gap-1.5">
                {quizBlock.options.map((option, index) => (
                  <li
                    key={index}
                    className={
                      index === revealed
                        ? 'rounded bg-amber-700 px-3 py-1.5 text-sm text-white'
                        : 'rounded px-3 py-1.5 text-sm text-stone-700'
                    }
                  >
                    {option}
                    {index === revealed ? ' ✓' : ''}
                  </li>
                ))}
              </ol>
            ) : null}
          </Card>

          <Card title={t.publicAnswer}>
            {revealed === null || !quizBlock ? (
              <p className="text-sm text-stone-600">{t.notRevealed}</p>
            ) : (
              <p className="text-sm text-stone-900">
                {quizBlock.revealedAnswerText ?? `#${revealed + 1}`}
              </p>
            )}
            {quizBlock?.answerCommitment ? (
              <div className="mt-3 text-xs text-stone-600">
                <span className="mr-2">{t.answerProof}:</span>
                <HashChip
                  value={quizBlock.answerCommitment}
                  copyLabel={t.copy}
                  copiedLabel={t.copied}
                />
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={t.blockOverview}>
            <dl className="grid gap-2 text-sm">
              <dt className="text-stone-600">{t.disciplines}</dt>
              <dd className="text-stone-900">
                {quizBlock
                  ? (lang === 'th' ? quizBlock.disciplineTh : quizBlock.disciplineEn)
                  : (problem?.disciplines.join(', ') ?? '—')}
              </dd>
              <dt className="text-stone-600">{t.difficulty}</dt>
              <dd className="text-stone-900">
                {quizBlock ? `${formatCount(quizBlock.difficultyBits)} bits` : (problem ? `${problem.difficulty}/10` : '—')}
              </dd>
              <dt className="text-stone-600">{t.statCorrectRate}</dt>
              <dd className="text-stone-900">{solveRate}</dd>
              <dt className="text-stone-600">{t.tableMiner}</dt>
              <dd>{quizBlock ? <AddressCell address={quizBlock.miner} lang={lang} /> : '—'}</dd>
              <dt className="text-stone-600">{t.contentHash}</dt>
              <dd>
                <HashChip value={quizBlock?.contentHash ?? problem?.answerCommitHash ?? null} copyLabel={t.copy} copiedLabel={t.copied} />
              </dd>
            </dl>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
