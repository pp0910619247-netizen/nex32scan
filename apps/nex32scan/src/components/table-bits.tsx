/**
 * Client-safe presentational bits shared by server pages and client tables.
 *
 * These live outside `shell.tsx` on purpose: `shell.tsx` pulls the server-side
 * chain snapshot and cannot be imported from a client component. Everything in
 * this module is pure (next/link + format helpers only), so it is safe in both
 * the server and the client module graphs.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { type Lang } from '@/i18n';
import { shortHash } from '@/lib/format';

/** Every link in the explorer: black with a grey underline that darkens on hover. */
export const LINK_CLASS = 'text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700';

/**
 * Tone semantics stay identical to the legacy shell styles: hue carries
 * meaning — solid = the strongest statement (milestone, correct, winner),
 * outline = negative, muted = neutral, soft = neutral tag (discipline).
 */
const BADGE_TONES = {
  soft: 'bg-stone-100 text-stone-700',
  /** Gold = positive/revealed: milestone, correct answer, winner. */
  solid: 'bg-amber-700 text-white',
  outline: 'border border-stone-400 bg-white text-stone-700',
  muted: 'bg-stone-200 text-stone-800',
} as const;

/** Small pill label (HARD, MILESTONE, correct/incorrect, …). */
export function Badge({ tone = 'muted', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs ${BADGE_TONES[tone]}`}>{children}</span>;
}

/** `0x1234…abcd` address cell. */
export function ShortAddress({ address }: { address: string | null }) {
  return <span className="font-mono text-xs text-stone-700">{shortHash(address, 8, 6)}</span>;
}

/** Address cell that links to the address page whenever it is a real 0x address. */
export function AddressCell({ address, lang }: { address: string | null; lang: Lang }) {
  if (!address) return <span className="text-stone-500">—</span>;
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return <ShortAddress address={address} />;
  return (
    <Link href={`/${lang}/address/${address.toLowerCase()}`} className={LINK_CLASS}>
      <ShortAddress address={address} />
    </Link>
  );
}
