import { cookies } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { LANG_COOKIE, isLang, type Lang } from '@/i18n';
import { baseMetadata, baseViewport } from '@/lib/site';
import { mono, sans } from '../fonts';
import '../globals.css';

/**
 * Root layout of the project landing page (`/`). The landing picks its
 * language from the cookie (no locale in the URL), so <html lang> mirrors
 * that choice; canonical stays `/` with hreflang pointing at both locales.
 */
export const metadata: Metadata = {
  ...baseMetadata,
  alternates: {
    canonical: '/',
    languages: { en: '/en', th: '/th' },
  },
};
export const viewport: Viewport = baseViewport;

export default function LandingLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieLang = cookies().get(LANG_COOKIE)?.value;
  const lang: Lang = isLang(cookieLang ?? '') ? (cookieLang as Lang) : 'en';
  return (
    <html lang={lang} className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
