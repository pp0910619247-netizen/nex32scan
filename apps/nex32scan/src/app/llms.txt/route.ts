/**
 * `GET /llms.txt` — machine-readable explorer index for AI agents.
 * Public metadata only: stats, recent sealed blocks (no answers/keys),
 * API surface, tokenomics facts. 404s when the lab flag is off.
 */
export async function GET(): Promise<Response> {
  const { labFlags } = await import('@/lib/lab');
  if (!labFlags().llmsTxt) {
    return new Response('Not found', { status: 404 });
  }
  const { indexer } = await import('@/lib/explorer');
  const snapshot = await (await indexer()).snapshot();
  const blocks = (snapshot.quizBlocks ?? []).slice(-20).reverse();
  const lines = [
    '# NEX32SCAN — Nexus Architect knowledge-chain explorer (testnet)',
    '# Rules for agents: read-only data; NEX has no market value; answers appear only after reveal.',
    '',
    '## Network',
    `- latest block: ${snapshot.stats.latestBlockHeight}`,
    `- miners seen: ${snapshot.stats.totalMiners}`,
    '',
    '## Recent sealed blocks',
    ...blocks.map(
      (block) =>
        `- #${block.height} [${block.disciplineId}] /en/block/${block.height} answers=${block.totalAnswers} correct=${block.correctAnswers}`,
    ),
    '',
    '## API (read-only)',
    '- GET /api/explorer — full snapshot',
    '- GET /api/status — chain aggregates',
    '- GET /api/answers?limit=20 — newest answers',
    '- GET /api/search?q= — block / address / tx resolution',
    '',
    '## Tokenomics (locked, testnet)',
    '- supply 21,000,000 NEX; Genesis Era blocks 1-10,000 = 2,100,000 NEX; initial reward 1,051 NEX; halve every 1,000 blocks',
    '- per-block: 10% Impact Treasury first, then 40% fastest-correct winner / 60% correct co-miners',
  ];
  return new Response(lines.join('\n') + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const dynamic = 'force-dynamic';
