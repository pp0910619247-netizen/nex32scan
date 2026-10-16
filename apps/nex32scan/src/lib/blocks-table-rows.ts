/**
 * Blocks-list row mapping (pure, server-safe).
 *
 * The blocks page is a server component and the table is a client component,
 * so rows must be plain serializable data (strings/numbers/booleans only).
 * This module is the single place that maps indexer blocks to that shape,
 * which keeps the RSC boundary honest and lets a unit test prove it.
 */
import type { QuizExplorerBlock } from '@nexus/indexer';
import { scheduledBlockReward } from './reward';

/** Plain (serializable) row shape consumed by the client blocks table. */
export interface BlocksTableRow {
  readonly height: number;
  readonly timestamp: number;
  readonly miner: string;
  readonly totalAnswers: number;
  readonly correctAnswers: number;
  readonly difficultyBits: number;
  readonly isHard: boolean;
  readonly isMilestone: boolean;
  /** Scheduled reward in wei as a decimal string (bigint is not serializable). */
  readonly rewardWei: string | null;
}

/** Newest first, one plain row per block. */
export function toBlocksTableRows(blocks: readonly QuizExplorerBlock[]): readonly BlocksTableRow[] {
  return blocks
    .slice()
    .reverse()
    .map((block) => {
      const reward = scheduledBlockReward(block.height);
      return {
        height: block.height,
        timestamp: block.timestamp,
        miner: block.miner,
        totalAnswers: block.totalAnswers,
        correctAnswers: block.correctAnswers,
        difficultyBits: block.difficultyBits,
        isHard: block.isHard,
        isMilestone: block.isMilestone,
        rewardWei: reward ? reward.rewardWei.toString() : null,
      };
    });
}
