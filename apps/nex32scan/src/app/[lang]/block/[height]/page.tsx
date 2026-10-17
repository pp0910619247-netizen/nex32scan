import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddressCell, Badge, Card, HashValue, Shell, ShortAddress, Table, Nex, langFrom } from '@/components/shell';
import { HashChip } from '@/components/hash-chip';
import { RelativeTime } from '@/components/live';
import { dictionary, fill, timeWords } from '@/i18n';
import { indexer } from '@/lib/explorer';
import { formatCount, formatNex, optionText, optionsFor, revealedTextFor, truncate } from '@/lib/format';
import { GENESIS_FACTS, scheduledBlockReward } from '@/lib/reward';
import { pageAlternates } from '@/lib/seo';

/** True when `miner` is the block's fastest correct answerer (case-insensitive). */
function isWinner(winner: string | null | undefined, miner: string): boolean {
  return Boolean(winner) && winner?.toLowerCase() === miner.toLowerCase();
}

export function generateMetadata({ params }: { params: { lang: string; height: string } }): Metadata {
  return { alternates: pageAlternates(langFrom(params.lang), `/block/${params.height}`) };
}

export default async function Page({ params }: { params: { lang: string; height: string } }) {
  const lang = langFrom(params.lang);
  const t = dictionary(lang);
  const words = timeWords(lang);
  const height = Number(params.height);
  if (!Number.isSafeInteger(height) || height < 1) notFound();
  const explorer = await indexer();
  const [block, snapshot] = await Promise.all([explorer.getQuizBlock(height), explorer.snapshot()]);

  // Sealed quiz-chain block (commit-reveal): available in every source mode.
  if (block) {
    const latest = snapshot.stats.latestBlockHeight;
    const reward = scheduledBlockReward(block.height);
    const answers = block.answers ?? [];
    // EN option texts are display-only (node/snapshot derive them); Thai wins
    // when a legacy source has no EN yet.
    const options = optionsFor(block, lang);
    const poolRecipients = answers.filter((answer) => answer.correct);
    const eraFrom = reward ? reward.era * GENESIS_FACTS.halvingInterval + GENESIS_FACTS.startBlock : 0;
    const eraTo = reward ? eraFrom + GENESIS_FACTS.halvingInterval - 1 : 0;

    return (
      <Shell lang={lang}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-stone-900">
            {t.block} <span className="font-mono">#{formatCount(height)}</span>
          </h1>
          <div className="flex items-center gap-3 text-sm">
            {height > 1 ? (
              <Link className="text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700" href={`/${lang}/block/${height - 1}`}>
                ← {t.previousBlock}
              </Link>
            ) : null}
            {height < latest ? (
              <Link className="text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700" href={`/${lang}/block/${height + 1}`}>
                {t.nextBlock} →
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="soft">{lang === 'th' ? block.disciplineTh : block.disciplineEn}</Badge>
          {block.isHard ? <Badge tone="outline">{t.hard}</Badge> : null}
          {block.isMilestone ? <Badge tone="solid">{t.milestone}</Badge> : null}
          <Badge tone={block.revealedAnswerIndex === null ? 'muted' : 'solid'}>
            {block.revealedAnswerIndex === null
              ? t.notRevealed
              : `${t.publicAnswer}: ${truncate(revealedTextFor(block, lang) ?? t.answerUnknown, 60)}`}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card title={t.blockOverview}>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
                <dt className="text-stone-600">{t.timestamp}</dt>
                <dd className="text-stone-800">
                  <RelativeTime timestamp={block.timestamp} words={words} />{' '}
                  <span className="text-xs text-stone-500">{new Date(block.timestamp).toISOString()}</span>
                </dd>
                <dt className="text-stone-600">{t.tableAnswers}</dt>
                <dd className="text-stone-800">
                  {formatCount(block.totalAnswers)} · {t.correct}: {formatCount(block.correctAnswers)}
                </dd>
                <dt className="text-stone-600">{t.tableMiner}</dt>
                <dd>
                  <AddressCell address={block.miner} lang={lang} />
                </dd>
                <dt className="text-stone-600">{t.statDifficulty}</dt>
                <dd className="text-stone-800">{formatCount(block.difficultyBits)} bits</dd>
                <dt className="text-stone-600">{t.attempts}</dt>
                <dd className="text-stone-800">{formatCount(block.attempts)}</dd>
                <dt className="text-stone-600">{t.hash}</dt>
                <dd>
                  <HashChip value={block.blockHash} copyLabel={t.copy} copiedLabel={t.copied} />
                </dd>
                <dt className="text-stone-600">{t.parentHash}</dt>
                <dd>
                  {height > 1 ? (
                    <HashChip
                      value={block.parentHash}
                      href={`/${lang}/block/${height - 1}`}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                    />
                  ) : (
                    <HashChip value={block.parentHash} copyLabel={t.copy} copiedLabel={t.copied} />
                  )}
                </dd>
              </dl>
            </Card>

            <Card
              title={t.problem}
              action={
                <Link
                  className="text-xs text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
                  href={`/${lang}/problem/${height}`}
                >
                  {t.problem} #{formatCount(height)} →
                </Link>
              }
            >
              <p className="mb-3 text-sm text-stone-800">
                {lang === 'th' ? block.promptTh : block.promptEn}
              </p>
              <p className="mb-3 text-xs text-stone-500">{lang === 'th' ? block.promptEn : block.promptTh}</p>
              <ol className="grid gap-1.5">
                {options.map((option, index) => (
                  <li
                    key={index}
                    className={
                      index === block.revealedAnswerIndex
                        ? 'rounded bg-amber-700 px-3 py-1.5 text-sm text-white'
                        : 'rounded px-3 py-1.5 text-sm text-stone-700'
                    }
                  >
                    {option}
                    {index === block.revealedAnswerIndex ? ' ✓' : ''}
                  </li>
                ))}
              </ol>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-[10rem_1fr]">
                <dt className="text-stone-600">{t.answerProof}</dt>
                <dd className="break-all font-mono text-stone-700">{block.answerCommitment ?? '—'}</dd>
                <dt className="text-stone-600">{t.contentHash}</dt>
                <dd className="break-all font-mono text-stone-700">{block.contentHash}</dd>
              </dl>
            </Card>

            <Card title={`${t.blockAnswers} · ${formatCount(block.totalAnswers)}`} bodyClassName="">
              {answers.length === 0 ? (
                <p className="p-4 text-sm text-stone-600">{t.noData}</p>
              ) : (
                <Table
                  head={[t.tableMiner, t.tableChoice, t.tableResult, t.timestamp, t.tableCommitment]}
                  rows={answers.map((answer) => [
                    <div key="miner" className="flex flex-wrap items-center gap-2">
                      <AddressCell address={answer.miner} lang={lang} />
                      {isWinner(block.winnerMiner, answer.miner) ? <Badge tone="solid">{t.winner}</Badge> : null}
                    </div>,
                    <span key="choice" className="text-stone-800">
                      {truncate(optionText(options, answer.choice) ?? t.answerUnknown, 48)}
                    </span>,
                    <Badge key="result" tone={answer.correct ? 'solid' : 'outline'}>
                      {answer.correct ? t.correct : t.incorrect}
                    </Badge>,
                    <RelativeTime key="at" timestamp={answer.answeredAt} words={words} />,
                    <HashValue key="commit" value={answer.commitmentHash} />,
                  ])}
                />
              )}
            </Card>
          </div>

          <Card title={t.rewardSchedule}>
            {reward ? (
              <div className="space-y-2 text-sm">
                <dl className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-600">{t.rewardTotal}</dt>
                    <dd className="text-stone-900">{formatNex(reward.rewardWei)} NEX</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-600">{t.rewardTreasury}</dt>
                    <dd className="text-stone-900">{formatNex(reward.impactTreasuryWei)} NEX</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-600">{t.rewardWinner}</dt>
                    <dd className="text-stone-900">{formatNex(reward.winnerWei)} NEX</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-600">{t.rewardPool}</dt>
                    <dd className="text-stone-900">{formatNex(reward.coMinersWei)} NEX</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-600">{t.winnerLine}</dt>
                    <dd className="text-stone-900">
                      {block.revealedAnswerIndex === null ? (
                        <span className="text-xs text-stone-500">{t.winnerPending}</span>
                      ) : block.winnerMiner ? (
                        <AddressCell address={block.winnerMiner} lang={lang} />
                      ) : (
                        <span className="text-xs text-stone-500">{t.winnerNone}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {/* 60%-pool recipients, collapsed by default: the list may grow
                    past 1,000 wallets, so it expands to a scrollable panel. */}
                <details className="group rounded border border-stone-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 [&::-webkit-details-marker]:hidden">
                    <span>{fill(t.poolRecipients, { count: formatCount(poolRecipients.length) })}</span>
                    <span aria-hidden="true" className="text-stone-500 transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  {poolRecipients.length === 0 ? (
                    <p className="border-t border-stone-200 px-3 py-2 text-xs text-stone-500">{t.poolRecipientsEmpty}</p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto border-t border-stone-200 text-xs">
                      {poolRecipients.map((answer, index) => (
                        <li key={index} className="flex items-center justify-between gap-2 px-3 py-1.5">
                          <AddressCell address={answer.miner} lang={lang} />
                          {isWinner(block.winnerMiner, answer.miner) ? <Badge tone="solid">{t.winner}</Badge> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </details>

                <div className="space-y-1 pt-1 text-xs text-stone-500">
                  <p>
                    {fill(t.rewardEra, { era: reward.era, from: formatCount(eraFrom), to: formatCount(eraTo) })}
                  </p>
                  <p>{t.scheduledNote}</p>
                  <p>{t.winnerNote}</p>
                  <p>{t.poolNote}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-600">{t.rewardOutsideEra}</p>
            )}
          </Card>
        </div>
      </Shell>
    );
  }

  // Legacy treasury-block layout (needs the paired problem-bank entry).
  const problems = await explorer.latestProblems(10000);
  const problem = problems.find((item) => item.blockHeight === height);
  const legacy = await explorer.getBlock(height);
  if (!legacy || !problem) notFound();
  return (
    <Shell lang={lang}>
      <h1 className="mb-6 text-2xl font-bold">
        {t.block} #{height}
      </h1>
      <h2 className="mb-2 text-xl">{t.problem}</h2>
      <p className="mb-2">{problem.statement.en}</p>
      <p className="mb-4 text-stone-600">{problem.statement.th}</p>
      <div className="mb-4 flex gap-2">
        {problem.disciplines.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
        <span>
          {t.difficulty}: {problem.difficulty}/10
        </span>
      </div>
      <div className="mb-4">
        {t.answer}: {legacy.revealed ? legacy.answerHash : t.notRevealed}
      </div>
      <p>
        {t.winner}: <ShortAddress address={legacy.winner} />
      </p>
      <p>
        {t.amount}: <Nex value={legacy.winnerAmountWei} />
      </p>
      <p>
        {t.impactAmount}: <Nex value={legacy.impactAmountWei} />
      </p>
      <Card title={t.miners} bodyClassName="">
        <Table
          head={[t.addressHistory, t.weight, t.share]}
          rows={legacy.miners.map((miner) => [
            <ShortAddress key="addr" address={miner.address} />,
            miner.weight.toString(),
            <Nex key="amount" value={miner.amountWei} />,
          ])}
        />
      </Card>
    </Shell>
  );
}
