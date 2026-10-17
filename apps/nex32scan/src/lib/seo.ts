import type { Metadata } from 'next';

/**
 * Canonical + hreflang for one explorer page. `path` is the route below the
 * locale segment ('' for the explorer home) and both locales point at the
 * same page, so deep pages canonicalise to themselves instead of inheriting
 * the landing page's canonical from the root layout.
 */
export function pageAlternates(lang: string, path = ''): Metadata['alternates'] {
  const suffix = path === '' || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return {
    canonical: `/${lang}${suffix}`,
    languages: {
      en: `/en${suffix}`,
      th: `/th${suffix}`,
      'x-default': `/en${suffix}`,
    },
  };
}
