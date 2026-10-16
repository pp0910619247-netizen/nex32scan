/**
 * Pure leaderboard aggregation over sealed quiz blocks.
 * No miner classification (human/AI/centaur) — the chain does not record
 * solver kind, so the board ranks addresses only. Never invent categories.
 */
import type { QuizExplorerBlock } from '@nexus/indexer';

export interface LeaderRow {
  readonly miner: string;
  /** Sealed blocks mined. */
  readonly blocks: number;
  /** Answers submitted across those blocks. */
  readonly answers: number;
  /** Correct answers. */
  readonly correct: number;
  /** Accuracy in [0, 1] (0 when no answers). */
  readonly accuracy: number;
  /** Blocks where this miner was the fastest correct (winner). */
  readonly wins: number;
}

export interface DisciplineTop {
  readonly disciplineId: string;
  readonly disciplineTh: string;
  readonly disciplineEn: string;
  readonly leaders: readonly LeaderRow[];
}

export function buildLeaderboard(blocks: readonly QuizExplorerBlock[]): LeaderRow[] {
  const byMiner = new Map<string, { blocks: number; answers: number; correct: number; wins: number }>();
  const touch = (miner: string) => {
    let entry = byMiner.get(miner);
    if (!entry) {
      entry = { blocks: 0, answers: 0, correct: 0, wins: 0 };
      byMiner.set(miner, entry);
    }
    return entry;
  };
  for (const block of blocks) {
    // Blocks are always attributable to the sealing miner.
    touch(block.miner).blocks += 1;
    // Answers are attributed ONLY from per-answer rows. Block-level totals
    // count every miner at once and must never be credited to one address.
    for (const answer of block.answers ?? []) {
      const entry = touch(answer.miner);
      entry.answers += 1;
      if (answer.correct) entry.correct += 1;
    }
    if (block.winnerMiner) touch(block.winnerMiner).wins += 1;
  }
  return [...byMiner.entries()]
    .map(([miner, entry]) => ({
      miner,
      blocks: entry.blocks,
      answers: entry.answers,
      correct: entry.correct,
      accuracy: entry.answers > 0 ? entry.correct / entry.answers : 0,
      wins: entry.wins,
    }))
    .sort((a, b) => b.wins - a.wins || b.accuracy - a.accuracy || b.blocks - a.blocks);
}

/** Top `take` miners per discipline, ordered by wins then accuracy. */
export function topByDiscipline(
  blocks: readonly QuizExplorerBlock[],
  take = 3,
): DisciplineTop[] {
  const groups = new Map<string, { th: string; en: string; blocks: QuizExplorerBlock[] }>();
  for (const block of blocks) {
    const group = groups.get(block.disciplineId) ?? { th: block.disciplineTh, en: block.disciplineEn, blocks: [] };
    group.blocks.push(block);
    groups.set(block.disciplineId, group);
  }
  return [...groups.entries()]
    .map(([disciplineId, group]) => ({
      disciplineId,
      disciplineTh: group.th,
      disciplineEn: group.en,
      leaders: buildLeaderboard(group.blocks).slice(0, take),
    }))
    .sort((a, b) => (b.leaders.length - a.leaders.length) || a.disciplineId.localeCompare(b.disciplineId));
}
