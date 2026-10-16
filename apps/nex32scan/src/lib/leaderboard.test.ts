import { describe, expect, it } from 'vitest';
import type { QuizExplorerBlock } from '@nexus/indexer';

import { buildLeaderboard, topByDiscipline } from './leaderboard';

function block(overrides: Partial<QuizExplorerBlock> = {}): QuizExplorerBlock {
  return {
    height: 1,
    blockHash: '0xh',
    parentHash: '0xp',
    timestamp: 1,
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
    totalAnswers: 0,
    correctAnswers: 0,
    ...overrides,
  } as QuizExplorerBlock;
}

const ANSWER = (miner: string, correct: boolean) => ({
  miner,
  choice: 0,
  correct,
  answeredAt: 1,
  commitmentHash: '0xs' as const,
});

describe('buildLeaderboard', () => {
  it('attributes blocks, answers and wins per miner (happy path)', () => {
    const rows = buildLeaderboard([
      block({ height: 1, miner: '0xaaa', answers: [ANSWER('0xaaa', true), ANSWER('0xbbb', false)], winnerMiner: '0xaaa' }),
      block({ height: 2, miner: '0xbbb', answers: [ANSWER('0xbbb', true)], winnerMiner: '0xbbb' }),
    ]);
    expect(rows.map((r) => r.miner)).toEqual(['0xaaa', '0xbbb']);
    expect(rows[0]).toMatchObject({ blocks: 1, answers: 1, correct: 1, accuracy: 1, wins: 1 });
    expect(rows[1]).toMatchObject({ blocks: 1, answers: 2, correct: 1, accuracy: 0.5, wins: 1 });
  });

  it('never credits block totals to one miner (edge)', () => {
    const rows = buildLeaderboard([
      block({ miner: '0xaaa', totalAnswers: 10, correctAnswers: 9 }),
    ]);
    expect(rows[0]).toMatchObject({ blocks: 1, answers: 0, correct: 0, accuracy: 0, wins: 0 });
  });

  it('handles empty input (edge)', () => {
    expect(buildLeaderboard([])).toEqual([]);
  });
});

describe('topByDiscipline', () => {
  it('groups leaders per discipline (happy path)', () => {
    const groups = topByDiscipline(
      [
        block({ disciplineId: 'math', miner: '0xaaa', answers: [ANSWER('0xaaa', true)] }),
        block({ disciplineId: 'phys', disciplineTh: 'ฟิสิกส์', disciplineEn: 'Physics', miner: '0xbbb' }),
      ],
      3,
    );
    expect(groups.map((g) => g.disciplineId).sort()).toEqual(['math', 'phys']);
    expect(groups.find((g) => g.disciplineId === 'math')?.leaders).toHaveLength(1);
  });
});
