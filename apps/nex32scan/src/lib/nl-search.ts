/**
 * Natural-language read-only search (Innovation Lab #2).
 * Allowlisted intents only — anything else returns null and the page falls
 * through to hash/direct/keyword search. Never executes anything.
 */
import type { Lang } from '@/i18n';

export type NlTarget =
  | { readonly page: 'latest' }
  | { readonly page: 'blocks' }
  | { readonly page: 'leaderboard' }
  | { readonly page: 'token' }
  | { readonly page: 'impact' }
  | { readonly page: 'block'; readonly height: number }
  | { readonly page: 'problem'; readonly height: number };

export function parseNlQuery(raw: string): NlTarget | null {
  const query = raw.trim().toLowerCase();
  if (!query) return null;

  const blockMatch = /^(?:block|บล็อก)\s*#?(\d{1,6})$/.exec(query);
  if (blockMatch) {
    const height = Number(blockMatch[1]);
    return Number.isSafeInteger(height) && height >= 1 ? { page: 'block', height } : null;
  }
  const problemMatch = /^(?:problem|โจทย์)\s*#?(\d{1,6})$/.exec(query);
  if (problemMatch) {
    const height = Number(problemMatch[1]);
    return Number.isSafeInteger(height) && height >= 1 ? { page: 'problem', height } : null;
  }
  if (/^(latest|newest|ล่าสุด)(\s+(block|บล็อก))?$/.test(query)) return { page: 'latest' };
  if (/^(top miners?|leaderboard|ลีดเดอร์บอร์ด|อันดับ)$/.test(query)) return { page: 'leaderboard' };
  if (/^(tokenomics|token|โทเคน|โทเคนโนมิกส์)$/.test(query)) return { page: 'token' };
  if (/^(impact|treasury|ผลกระทบ|เงินทุน|ข้อเสนอ)$/.test(query)) return { page: 'impact' };
  if (/^(blocks|all blocks|บล็อก|บล็อกทั้งหมด)$/.test(query)) return { page: 'blocks' };
  return null;
}

/** NL target → explorer href (`latest` needs the current chain height). */
export function nlHref(lang: Lang, target: NlTarget, latestHeight: number): string | null {
  switch (target.page) {
    case 'latest':
      return latestHeight >= 1 ? `/${lang}/block/${latestHeight}` : null;
    case 'blocks':
      return `/${lang}/blocks`;
    case 'leaderboard':
      return `/${lang}/leaderboard`;
    case 'token':
      return `/${lang}/token`;
    case 'impact':
      return `/${lang}/impact`;
    case 'block':
      return `/${lang}/block/${target.height}`;
    case 'problem':
      return `/${lang}/problem/${target.height}`;
  }
}
