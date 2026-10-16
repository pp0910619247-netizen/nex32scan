/**
 * EraChart — SVG bar chart of Genesis Era emission per halving era.
 * Server component, zero dependencies. Heights are display-scaled floats;
 * the exact wei figures stay in the halving table next to it.
 */
import { chartPalette } from '@nexus/shared';

import { barCenters, scaleBars } from '@/lib/chart';
import { formatNex } from '@/lib/format';
import type { GenesisEraRow } from '@/lib/reward';

const WIDTH = 640;
const HEIGHT = 180;
const PAD_BOTTOM = 22;

export function EraChart({
  eras,
  label,
}: {
  eras: readonly GenesisEraRow[];
  label: string;
}) {
  const totalsNex = eras.map((era) => Number(era.eraTotalWei) / 1e18);
  const heights = scaleBars(totalsNex, HEIGHT - PAD_BOTTOM);
  const centers = barCenters(eras.length, WIDTH);
  const slot = WIDTH / Math.max(1, eras.length);
  const barWidth = Math.max(8, slot - 10);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className="w-full"
    >
      {eras.map((era, index) => {
        const height = heights[index] ?? 0;
        const x = (centers[index] ?? 0) - barWidth / 2;
        const y = HEIGHT - PAD_BOTTOM - height;
        return (
          <g key={era.era}>
            <title>{`Era ${era.era}: ${formatNex(era.eraTotalWei)} NEX`}</title>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, height)}
              rx={3}
              fill={chartPalette[index % chartPalette.length]}
            />
            <text
              x={centers[index]}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontSize={11}
              fill="#78716C"
            >
              {era.era}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
