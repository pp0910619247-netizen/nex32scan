import { describe, expect, it } from 'vitest';
import type { QuizExplorerBlock } from '@nexus/indexer';

import { disciplineGraph } from './discipline-graph';

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

describe('disciplineGraph', () => {
  it('counts blocks per discipline, biggest first (happy path)', () => {
    const { nodes, edges } = disciplineGraph([
      block({ disciplineId: 'math' }),
      block({ height: 2, disciplineId: 'math' }),
      block({ height: 3, disciplineId: 'phys', disciplineTh: 'ฟิสิกส์', disciplineEn: 'Physics' }),
    ]);
    expect(nodes.map((n) => n.id)).toEqual(['math', 'phys']);
    expect(nodes[0]?.blocks).toBe(2);
    expect(edges).toEqual([]);
  });

  it('draws edges only for genuinely cross items (edge)', () => {
    const { edges } = disciplineGraph([
      block({ disciplineId: 'math|phys', disciplineTh: 'mixed', disciplineEn: 'mixed' }),
    ]);
    expect(edges).toEqual([{ from: 'math', to: 'phys', blocks: 1 }]);
  });

  it('handles empty snapshots (edge)', () => {
    expect(disciplineGraph([])).toEqual({ nodes: [], edges: [] });
  });
});
