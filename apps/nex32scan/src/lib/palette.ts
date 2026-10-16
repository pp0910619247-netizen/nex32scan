/**
 * Pure mapping behind the command palette: a `/api/search` payload becomes
 * an explorer href, or `null` when the payload carries nothing linkable.
 * UI-free so it unit-tests in Node.
 */

export type SearchHit =
  | { readonly kind: 'block'; readonly height: number }
  | { readonly kind: 'address'; readonly address: string }
  | { readonly kind: 'transaction'; readonly hash: string }
  | { readonly kind: 'invalid' | 'notFound' };

export function resolveSearchHref(lang: 'en' | 'th', hit: SearchHit): string | null {
  switch (hit.kind) {
    case 'block':
      return Number.isSafeInteger(hit.height) && hit.height >= 1 ? `/${lang}/block/${hit.height}` : null;
    case 'address':
      return /^0x[0-9a-fA-F]{40}$/.test(hit.address) ? `/${lang}/address/${hit.address.toLowerCase()}` : null;
    case 'transaction':
      return /^0x[0-9a-fA-F]{64}$/.test(hit.hash) ? `/${lang}/search?q=${hit.hash}` : null;
    default:
      return null;
  }
}
