// SPDX-License-Identifier: MIT
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ExplorerIndexer } from '../src/ExplorerIndexer.js';
import { EMPTY_EVENT_SNAPSHOT, FileEventAdapter } from '../src/FileEventAdapter.js';
import type { EventAdapter, HexAddress, HexHash } from '../src/types.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function bankWith(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'nexus-indexer-'));
  roots.push(root);
  await mkdir(path.join(root, 'problems'), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(root, 'problems', name), content, 'utf8');
  }
  return root;
}

const PROBLEM_YAML = (height: number): string =>
  `blockHeight: ${height}\ntype: DETERMINISTIC\ndisciplines: [mathematics]\ndifficulty: 3\nstatement:\n  en: Q${height}\n  th: Q${height}\nanswerCommitHash: 0x${'a'.repeat(64)}\n`;

/** Minimal adapter WITHOUT the optional quiz methods (covers fallback paths). */
function bareAdapter(): EventAdapter {
  return {
    getLatestBlockHeight: async () => 9,
    getBlock: async (height: number) =>
      height === 9
        ? {
            height,
            timestamp: 1n,
            winner: '0xWinner000000000000000000000000000000000001' as HexAddress,
            winnerAmountWei: 1n,
            impactAmountWei: 1n,
            txHash: `0x${'b'.repeat(64)}` as HexHash,
            miners: [
              {
                address: '0xWinner000000000000000000000000000000000001' as HexAddress,
                weight: 1n,
                amountWei: 1n,
                transactionHash: `0x${'c'.repeat(64)}` as HexHash,
              },
            ],
            revealed: true,
            answerHash: null,
          }
        : undefined,
    getAddressHistory: async () => [],
    search: async () => undefined,
    getImpactTreasuryBalance: async () => 5n,
    getProposals: async () => [],
  };
}

describe('problem bank directory scan', () => {
  it('lists heights descending and skips non-height files (happy path)', async () => {
    const root = await bankWith({ '1.yaml': PROBLEM_YAML(1), '2.yaml': PROBLEM_YAML(2), 'notes.txt': 'junk' });
    const service = new ExplorerIndexer({
      problemBankRoot: root,
      events: new FileEventAdapter(async () => EMPTY_EVENT_SNAPSHOT),
    });
    expect((await service.listProblems()).map((p) => p.blockHeight)).toEqual([2, 1]);
    expect(await service.latestProblems(1)).toHaveLength(1);
  });

  it('rethrows non-ENOENT read errors instead of hiding them (edge)', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'nexus-indexer-'));
    roots.push(root);
    // A FILE named `problems` makes readdir fail with ENOTDIR, not ENOENT.
    await writeFile(path.join(root, 'problems'), 'not a directory', 'utf8');
    const service = new ExplorerIndexer({
      problemBankRoot: root,
      events: new FileEventAdapter(async () => EMPTY_EVENT_SNAPSHOT),
    });
    await expect(service.listProblems()).rejects.toThrow();
  });
});

describe('indexer delegation', () => {
  it('forwards block, history, proposals and transaction lookups (happy path)', async () => {
    const service = new ExplorerIndexer({ problemBankRoot: 'missing-test-root', events: bareAdapter() });
    await expect(service.getBlock(9)).resolves.toMatchObject({ height: 9 });
    await expect(service.getBlock(10)).resolves.toBeUndefined();
    await expect(service.getAddressHistory('0xWinner000000000000000000000000000000000001' as HexAddress)).resolves.toEqual([]);
    await expect(service.getProposals()).resolves.toEqual([]);
    await expect(service.getTransaction(`0x${'d'.repeat(64)}` as HexHash)).resolves.toBeUndefined();
    await expect(service.search('nope')).resolves.toBeUndefined();
    await expect(service.stats()).resolves.toMatchObject({ latestBlockHeight: 9, totalMiners: 0 });
  });

  it('falls back to scanning quiz blocks when the adapter has no direct lookup (edge)', async () => {
    const service = new ExplorerIndexer({
      problemBankRoot: 'missing-test-root',
      events: new FileEventAdapter(async () => ({ ...EMPTY_EVENT_SNAPSHOT, quizBlocks: undefined })),
    });
    await expect(service.latestQuizBlocks(5)).resolves.toEqual([]);
    await expect(service.getQuizBlock(1)).resolves.toBeUndefined();
  });

  it('resolves quiz-block height search through the snapshot (edge)', async () => {
    const service = new ExplorerIndexer({
      problemBankRoot: 'missing-test-root',
      events: new FileEventAdapter(async () => ({
        ...EMPTY_EVENT_SNAPSHOT,
        quizBlocks: [
          {
            height: 4,
            blockHash: `0x${'b'.repeat(64)}`,
            parentHash: `0x${'0'.repeat(64)}`,
            timestamp: 1,
            difficultyBits: 12,
            isHard: false,
            isMilestone: false,
            attempts: 1,
            miner: 'm',
            questionId: 'q',
            disciplineId: 'math',
            disciplineTh: 't',
            disciplineEn: 'e',
            promptTh: 'p',
            promptEn: 'p',
            options: [],
            contentHash: `0x${'c'.repeat(64)}`,
            revealedAnswerIndex: null,
            revealedAnswerText: null,
            answerCommitment: null,
            totalAnswers: 0,
            correctAnswers: 0,
          },
        ],
      })),
    });
    await expect(service.search('4')).resolves.toEqual({ kind: 'block', height: 4 });
    await expect(service.search('zzz')).resolves.toBeUndefined();
  });
});
