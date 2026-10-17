import type { Metadata, Viewport } from 'next';

/** Canonical origin of the explorer — overridable for preview deployments. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nex32scan.vercel.app';

const DESCRIPTION =
  'Explorer for the Nexus Architect knowledge chain on Polygon mainnet: sealed blocks, answers, tamper-proof commitments and the Genesis tokenomics schedule.';

/**
 * Metadata shared by both root layouts (the landing page and the localized
 * explorer) so the two can never drift apart. `alternates` is intentionally
 * absent: canonical + hreflang are per page — see `pageAlternates` in `@/lib/seo`.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'NEX32SCAN — Nexus Architect explorer', template: '%s · NEX32SCAN' },
  description: DESCRIPTION,
  applicationName: 'NEX32SCAN',
  openGraph: {
    type: 'website',
    siteName: 'NEX32SCAN',
    title: 'NEX32SCAN — Nexus Architect explorer',
    description: DESCRIPTION,
    url: SITE_URL,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  twitter: {
    card: 'summary',
    title: 'NEX32SCAN — Nexus Architect explorer',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const baseViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF6EC',
};
