import { describe, expect, it } from 'vitest';
import type { QuizExplorerBlock } from '@nexus/indexer';

import { toBlocksTableRows } from './blocks-table-rows';
import { scheduledBlockReward } from './reward';

function block(overrides: Partial<QuizExplorerBlock> = {}): QuizExplorerBlock {
  return {
    height: 1,
    blockHash: '0xh',
    parentHash: '0xp',
    timestamp: 1_700_000_000_000,
    difficultyBits: 12,
    isHard: false,
    isMilestone: false,
    attempts: 10,
    miner: '0xaaa',
    questionId: 'q',
    disciplineId: 'math',
    disciplineTh: 'คณิตศาสตร์',
    disciplineEn: 'Mathematics',
    promptTh: 'p',
    promptEn: 'p',
    options: ['a', 'b'],
    contentHash: '0xc',
    revealedAnswerIndex: 0,
    revealedAnswerText: 'a',
    answerCommitment: '0xs',
    totalAnswers: 3,
    correctAnswers: 2,
    ...overrides,
  } as QuizExplorerBlock;
}

describe('toBlocksTableRows (RSC-safe row mapping)', () => {
  it('returns newest first (happy path)', () => {
    const rows = toBlocksTableRows([block({ height: 1 }), block({ height: 2 }), block({ height: 3 })]);
    expect(rows.map((row) => row.height)).toEqual([3, 2, 1]);
  });

  it('produces only JSON-serializable primitives (edge)', () => {
    const rows = toBlocksTableRows([block({ height: 1, isHard: true, isMilestone: true })]);
    expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
    expect(typeof rows[0]!.miner).toBe('string');
    expect(rows[0]!.isHard).toBe(true);
    expect(rows[0]!.isMilestone).toBe(true);
  });

  it('carries the scheduled reward as a wei string inside the genesis era, null after it (edge)', () => {
    const [inEra] = toBlocksTableRows([block({ height: 1 })]);
    expect(inEra!.rewardWei).toBe(scheduledBlockReward(1)!.rewardWei.toString());
    expect(BigInt(inEra!.rewardWei!)).toBeGreaterThan(0n);

    const [afterEra] = toBlocksTableRows([block({ height: 10_001 })]);
    expect(afterEra!.rewardWei).toBeNull();
  });
});
