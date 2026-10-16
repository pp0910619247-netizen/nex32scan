import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const sans = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nex32scan.vercel.app';
const DESCRIPTION =
  'Explorer for the Nexus Architect knowledge chain on Polygon Amoy testnet: sealed blocks, answers, tamper-proof commitments and the Genesis tokenomics schedule.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'NEX32SCAN — Nexus Architect explorer', template: '%s · NEX32SCAN' },
  description: DESCRIPTION,
  applicationName: 'NEX32SCAN',
  alternates: {
    canonical: '/',
    languages: { en: '/en', th: '/th' },
  },
  openGraph: {
    type: 'website',
    siteName: 'NEX32SCAN',
    title: 'NEX32SCAN — Nexus Architect explorer',
    description: DESCRIPTION,
    url: SITE_URL,
  },
  icons: { icon: '/logo.png', apple: '/icon-192.png' },
  manifest: '/manifest.webmanifest',
  twitter: {
    card: 'summary',
    title: 'NEX32SCAN — Nexus Architect explorer',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF6EC',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
