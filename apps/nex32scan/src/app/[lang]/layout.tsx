import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { isLang } from '@/i18n';
import { baseMetadata, baseViewport } from '@/lib/site';
import { mono, sans } from '../fonts';
import '../globals.css';

/**
 * Root layout of the localized explorer. It owns <html> so the lang attribute
 * matches the URL locale even on pages prerendered at build time; canonical
 * and hreflang are per page (`pageAlternates`), not here.
 */
export const metadata: Metadata = baseMetadata;
export const viewport: Viewport = baseViewport;

export default function LangLayout({
  children,
  params,
}: Readonly<{ children: ReactNode; params: { lang: string } }>) {
  const lang = isLang(params.lang) ? params.lang : 'en';
  return (
    <html lang={lang} className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
