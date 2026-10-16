/**
 * DisciplineGraph — SVG circle map of disciplines sized by sealed blocks,
 * with edges for cross-discipline items. Server component, zero deps.
 */
import type { GraphEdge, GraphNode } from '@/lib/discipline-graph';

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 118;

function position(index: number, total: number): { x: number; y: number } {
  if (total <= 1) return { x: CENTER, y: CENTER };
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
}

export function DisciplineGraph({
  nodes,
  edges,
  label,
  lang,
}: {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  label: string;
  lang: 'en' | 'th';
}) {
  if (nodes.length === 0) return null;
  const peak = Math.max(...nodes.map((node) => node.blocks));
  const byId = new Map(nodes.map((node, index) => [node.id, index]));
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} className="mx-auto w-full max-w-sm">
      {edges.map((edge, index) => {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (a === undefined || b === undefined) return null;
        const pa = position(a, nodes.length);
        const pb = position(b, nodes.length);
        return (
          <line
            key={`${edge.from}~${edge.to}~${index}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke="#B45309"
            strokeWidth={Math.min(6, edge.blocks)}
            opacity={0.45}
          />
        );
      })}
      {nodes.map((node, index) => {
        const point = position(index, nodes.length);
        const radius = 10 + (peak > 0 ? 22 * (node.blocks / peak) : 0);
        return (
          <g key={node.id}>
            <title>{`${lang === 'th' ? node.th : node.en}: ${node.blocks}`}</title>
            <circle cx={point.x} cy={point.y} r={radius} fill="#FFAB00" opacity={0.85} stroke="#B45309" />
            <text x={point.x} y={point.y + radius + 14} textAnchor="middle" fontSize={11} fill="#57534E">
              {node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
