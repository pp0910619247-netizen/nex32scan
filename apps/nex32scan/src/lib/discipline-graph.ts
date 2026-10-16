/**
 * Discipline co-occurrence graph (Innovation Lab #3), derived from sealed
 * blocks only. Single-discipline blocks size their node; multi-discipline
 * blocks (explorer quiz items carry one primary discipline today) draw no
 * edges yet — edges appear if cross items ever land in the snapshot.
 */
import type { QuizExplorerBlock } from '@nexus/indexer';

export interface GraphNode {
  readonly id: string;
  readonly th: string;
  readonly en: string;
  readonly blocks: number;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly blocks: number;
}

/** Node sizes per discipline; edges only for genuinely cross items. */
export function disciplineGraph(blocks: readonly QuizExplorerBlock[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const counts = new Map<string, { th: string; en: string; blocks: number }>();
  const pairs = new Map<string, number>();
  for (const block of blocks) {
    // The snapshot carries one discipline per block; treat pipe-joined ids
    // as a future-proof cross encoding.
    const ids = block.disciplineId.split('|').map((id) => id.trim()).filter((id) => id.length > 0);
    const unique = [...new Set(ids)];
    for (const id of unique) {
      const entry = counts.get(id) ?? { th: block.disciplineTh, en: block.disciplineEn, blocks: 0 };
      entry.blocks += 1;
      counts.set(id, entry);
    }
    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        const key = [unique[i], unique[j]].sort().join('~');
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  }
  const nodes = [...counts.entries()]
    .map(([id, entry]) => ({ id, th: entry.th, en: entry.en, blocks: entry.blocks }))
    .sort((a, b) => b.blocks - a.blocks);
  const edges = [...pairs.entries()].map(([key, blocks]) => {
    const [from, to] = key.split('~') as [string, string];
    return { from, to, blocks };
  });
  return { nodes, edges };
}
