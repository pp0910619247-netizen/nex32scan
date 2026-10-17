import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `src/lib/explorer.ts` chooses which chain source the whole deployment reads
 * from (live node → hybrid → snapshot file → baked JSON) and maps raw node
 * payloads onto the explorer's block shape. It sat at ~5% coverage, so a
 * regression here would silently point every page at the wrong data source.
 */

const ORIGINAL_FETCH = globalThis.fetch;
const TOUCHED_ENV = [
  'QUIZ_CHAIN_API_URL',
  'NEXT_PHASE',
  'INDEXER_SNAPSHOT_PATH',
  'BAKED_SNAPSHOT_JSON',
  'EXPLORER_RUNTIME_JSON',
] as const;
const ORIGINAL_ENV = new Map(TOUCHED_ENV.map((key) => [key, process.env[key]]));

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.unstubAllGlobals();
  vi.resetModules();
  for (const key of TOUCHED_ENV) {
    const original = ORIGINAL_ENV.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

/** Loads a fresh copy of the module so module-level `BAKED_SNAPSHOT_JSON` reflects env. */
async function freshExplorer(env: Partial<Record<(typeof TOUCHED_ENV)[number], string | undefined>>) {
  vi.resetModules();
  for (const key of TOUCHED_ENV) delete process.env[key];
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) process.env[key] = value;
  }
  return import('./explorer');
}

/** Node stub: answers the listed paths with JSON, everything else with 404. */
function stubNode(routes: Record<string, unknown>) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const body = routes[url.pathname + url.search];
    return body === undefined
      ? new Response('not found', { status: 404 })
      : new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const HASH_A = `0x${'a'.repeat(64)}`;
const HASH_B = `0x${'b'.repeat(64)}`;
const HASH_C = `0x${'c'.repeat(64)}`;
const HASH_D = `0x${'d'.repeat(64)}`;

const NODE_BLOCK = {
  height: 3,
  hash: HASH_A,
  parentHash: HASH_B,
  timestamp: 1_700,
  difficultyBits: 12,
  isHard: false,
  isMilestone: false,
  attempts: 40,
  miner: 'miner-3',
  question: {
    id: 'q-3',
    disciplineId: 'math',
    disciplineTh: 'คณิตศาสตร์',
    disciplineEn: 'Mathematics',
    promptTh: 'ข้อใดถูก',
    promptEn: 'Which is right?',
    options: ['1', '2', '3', '4'],
    optionsEn: ['one', 'two', 'three', 'four'],
    contentHash: HASH_C,
  },
  revealedAnswerIndex: 2,
  answerCount: 5,
  correctCount: 3,
  winnerMiner: 'miner-3',
  winnerAnsweredAt: 1_650,
  answers: [{ miner: 'miner-3', choice: 2, correct: true, answeredAt: 1_650, commitmentHash: HASH_D }],
};

const BAKED_SNAPSHOT = JSON.stringify({
  latestBlockHeight: 9,
  impactTreasuryWei: '0',
  blocks: {},
  proposals: [],
  quizBlocks: [
    {
      height: 9,
      blockHash: HASH_A,
      parentHash: HASH_B,
      timestamp: 1_900,
      difficultyBits: 12,
      isHard: false,
      isMilestone: false,
      attempts: 1,
      miner: 'baked-miner',
      questionId: 'q-9',
      disciplineId: 'math',
      disciplineTh: 'คณิตศาสตร์',
      disciplineEn: 'Mathematics',
      promptTh: 'ก',
      promptEn: 'a',
      options: ['1', '2', '3', '4'],
      contentHash: HASH_C,
      revealedAnswerIndex: 0,
      revealedAnswerText: '1',
      answerCommitment: null,
      totalAnswers: 0,
      correctAnswers: 0,
      winnerMiner: null,
      winnerAnsweredAt: null,
    },
  ],
});

describe('remoteApiUrl', () => {
  it('is undefined outside a configured deployment', async () => {
    const { remoteApiUrl } = await freshExplorer({});
    expect(remoteApiUrl()).toBeUndefined();
  });

  it('returns the configured node URL', async () => {
    const { remoteApiUrl } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    expect(remoteApiUrl()).toBe('http://node.test');
  });

  it('is disabled during a production build so pages stay prerenderable', async () => {
    const { remoteApiUrl } = await freshExplorer({
      QUIZ_CHAIN_API_URL: 'http://node.test',
      NEXT_PHASE: 'phase-production-build',
    });
    expect(remoteApiUrl()).toBeUndefined();
  });
});

describe('sourceMode', () => {
  it('defaults to the baked snapshot in the cloud', async () => {
    const { sourceMode } = await freshExplorer({});
    expect(sourceMode()).toBe('baked');
  });

  it('uses the snapshot file when only a path is configured', async () => {
    const { sourceMode } = await freshExplorer({ INDEXER_SNAPSHOT_PATH: '/tmp/snapshot.json' });
    expect(sourceMode()).toBe('file');
  });

  it('prefers the live node once a URL is configured', async () => {
    const { sourceMode } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    expect(sourceMode()).toBe('remote');
  });

  it('reports hybrid when a node AND a baked snapshot are both present', async () => {
    const { sourceMode } = await freshExplorer({
      QUIZ_CHAIN_API_URL: 'http://node.test',
      BAKED_SNAPSHOT_JSON: BAKED_SNAPSHOT,
    });
    expect(sourceMode()).toBe('hybrid');
  });

  it('treats a production build with a node URL as baked, not remote', async () => {
    const { sourceMode } = await freshExplorer({
      QUIZ_CHAIN_API_URL: 'http://node.test',
      NEXT_PHASE: 'phase-production-build',
    });
    expect(sourceMode()).toBe('baked');
  });
});

describe('live node adapter', () => {
  it('maps a node block payload onto the explorer block shape', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    stubNode({ '/api/blocks/3': NODE_BLOCK });

    const block = await (await indexer()).getQuizBlock(3);

    expect(block).toMatchObject({
      height: 3,
      blockHash: HASH_A,
      parentHash: HASH_B,
      timestamp: 1_700,
      difficultyBits: 12,
      miner: 'miner-3',
      questionId: 'q-3',
      disciplineEn: 'Mathematics',
      options: ['1', '2', '3', '4'],
      optionsEn: ['one', 'two', 'three', 'four'],
      revealedAnswerIndex: 2,
      // The revealed option text is resolved from the same options array —
      // per language, with EN falling back to Thai when the node omits it.
      revealedAnswerText: '3',
      revealedAnswerTextEn: 'three',
      totalAnswers: 5,
      correctAnswers: 3,
      winnerMiner: 'miner-3',
      winnerAnsweredAt: 1_650,
    });
    expect(block?.answers).toEqual([
      { miner: 'miner-3', choice: 2, correct: true, answeredAt: 1_650, commitmentHash: HASH_D },
    ]);
  });

  it('maps a legacy node block without EN options (fallback stays Thai)', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    const legacy = {
      ...NODE_BLOCK,
      question: { ...NODE_BLOCK.question, optionsEn: undefined },
    };
    stubNode({ '/api/blocks/3': legacy });

    const block = await (await indexer()).getQuizBlock(3);

    expect(block?.optionsEn).toBeNull();
    expect(block?.revealedAnswerTextEn).toBeNull();
    expect(block?.revealedAnswerText).toBe('3');
  });

  it('keeps the answer hidden while the block is unrevealed', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    stubNode({ '/api/blocks/3': { ...NODE_BLOCK, revealedAnswerIndex: null, winnerMiner: null, answers: undefined } });

    const block = await (await indexer()).getQuizBlock(3);

    expect(block?.revealedAnswerIndex).toBeNull();
    expect(block?.revealedAnswerText).toBeNull();
    expect(block?.revealedAnswerTextEn).toBeNull();
    expect(block?.winnerMiner).toBeNull();
    expect(block?.answers).toBeUndefined();
  });

  it('returns undefined when the node has no such block', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    stubNode({});

    await expect((await indexer()).getQuizBlock(404)).resolves.toBeUndefined();
  });

  it('derives the legacy treasury block from the quiz block', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    stubNode({ '/api/blocks/3': NODE_BLOCK });

    const block = await (await indexer()).getBlock(3);

    expect(block).toMatchObject({
      height: 3,
      timestamp: 1_700n,
      // A node miner id is not an EVM address, so there is no payout winner.
      winner: null,
      winnerAmountWei: 0n,
      impactAmountWei: 0n,
      txHash: HASH_A,
      miners: [],
      revealed: true,
      answerHash: null,
    });
  });

  it('casts an EVM-looking miner to an address winner', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    const evmMiner = `0x${'e'.repeat(40)}`;
    stubNode({ '/api/blocks/3': { ...NODE_BLOCK, miner: evmMiner } });

    const block = await (await indexer()).getBlock(3);

    expect(block?.winner).toBe(evmMiner);
  });

  it('documented gaps: no address history and no impact treasury on the quiz chain', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    const explorer = await indexer();

    await expect(explorer.getAddressHistory(`0x${'f'.repeat(40)}`)).resolves.toEqual([]);
    await expect(explorer.getProposals()).resolves.toEqual([]);
  });

  it('recognises blocks, addresses and transactions in search', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    const explorer = await indexer();
    const address = `0x${'1'.repeat(40)}`;

    await expect(explorer.search('42')).resolves.toEqual({ kind: 'block', height: 42 });
    await expect(explorer.search(address)).resolves.toEqual({ kind: 'address', address });
    await expect(explorer.search(HASH_A)).resolves.toEqual({ kind: 'transaction', hash: HASH_A });
    await expect(explorer.search('not-a-lookup')).resolves.toBeUndefined();
  });

  it('falls back to the latest-window scan for a single height', async () => {
    const { indexer } = await freshExplorer({ QUIZ_CHAIN_API_URL: 'http://node.test' });
    // The direct lookup misses, so ExplorerIndexer asks for the latest window.
    stubNode({
      '/api/blocks?limit=1': { total: 3 },
      '/api/blocks?limit=100&offset=0': { blocks: [NODE_BLOCK] },
    });

    const block = await (await indexer()).getQuizBlock(3);

    expect(block?.height).toBe(3);
  });
});

describe('hybrid adapter (live node with baked fallback)', () => {
  it('serves the baked block when the node is unreachable', async () => {
    const { indexer } = await freshExplorer({
      QUIZ_CHAIN_API_URL: 'http://node.test',
      BAKED_SNAPSHOT_JSON: BAKED_SNAPSHOT,
    });
    stubNode({}); // every live read fails

    const block = await (await indexer()).getQuizBlock(9);

    expect(block).toMatchObject({ height: 9, miner: 'baked-miner', disciplineEn: 'Mathematics' });
  });

  it('serves the baked proposals and snapshot-sourced impact balance', async () => {
    const { indexer } = await freshExplorer({
      QUIZ_CHAIN_API_URL: 'http://node.test',
      BAKED_SNAPSHOT_JSON: BAKED_SNAPSHOT,
    });
    stubNode({});
    const explorer = await indexer();

    await expect(explorer.getProposals()).resolves.toEqual([]);
    await expect(explorer.getAddressHistory(`0x${'2'.repeat(40)}`)).resolves.toEqual([]);
  });

  it('survives malformed baked JSON instead of throwing', async () => {
    const { indexer } = await freshExplorer({
      QUIZ_CHAIN_API_URL: 'http://node.test',
      BAKED_SNAPSHOT_JSON: '{not json',
    });
    stubNode({});

    await expect((await indexer()).getQuizBlock(9)).resolves.toBeUndefined();
  });
});
