import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic OG image per quiz block: height + discipline + sealed status.
 * Zero dependencies (next/og only); never embeds answers or keys.
 */
export default async function OpengraphImage({ params }: { params: { lang: string; height: string } }) {
  const lang = params.lang === 'th' ? 'th' : 'en';
  const title = lang === 'th' ? `บล็อก #${params.height}` : `Block #${params.height}`;
  const subtitle =
    lang === 'th'
      ? 'NEX32SCAN · เชนความรู้ · Polygon mainnet'
      : 'NEX32SCAN · Knowledge chain · Polygon mainnet';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#FAF6EC',
          color: '#1C1917',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 28, color: '#B45309', marginBottom: 12 }}>NEX32SCAN</div>
        <div style={{ fontSize: 84, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 30, color: '#6B6259', marginTop: 16 }}>{subtitle}</div>
      </div>
    ),
    { ...size },
  );
}
