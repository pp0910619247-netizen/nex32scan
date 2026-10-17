import { IBM_Plex_Sans_Thai, JetBrains_Mono } from 'next/font/google';

/**
 * Fonts shared by both root layouts — `app/(landing)/layout.tsx` and
 * `app/[lang]/layout.tsx` — declared once so the two cannot drift.
 */
export const sans = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});
