'use client';

/**
 * Command palette (Ctrl/⌘+K): jump to a block, address or transaction hash
 * without leaving the keyboard. Read-only — it only GETs `/api/search`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { resolveSearchHref, type SearchHit } from '@/lib/palette';
import type { Lang } from '@/i18n';

export interface PaletteLink {
  readonly label: string;
  readonly href: string;
}

export function CommandPalette({
  lang,
  triggerLabel,
  placeholder,
  emptyLabel,
  quickLinks,
}: {
  lang: Lang;
  triggerLabel: string;
  placeholder: string;
  emptyLabel: string;
  quickLinks: readonly PaletteLink[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [href, setHref] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setHref(null);
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((was) => !was);
      } else if (event.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );

  const onChange = (value: string) => {
    setQuery(value);
    setHref(null);
    setActive(0);
    if (debounce.current) clearTimeout(debounce.current);
    const trimmed = value.trim();
    if (!trimmed) {
      setChecking(false);
      return;
    }
    setChecking(true);
    debounce.current = setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((hit) => {
          setHref(hit ? resolveSearchHref(lang, hit as SearchHit) : null);
        })
        .catch(() => setHref(null))
        .finally(() => setChecking(false));
    }, 250);
  };

  const go = (target: string) => {
    close();
    router.push(target);
  };

  const items: readonly (PaletteLink & { key: string })[] =
    query.trim() === ''
      ? quickLinks.map((link, index) => ({ ...link, key: `quick-${index}` }))
      : href === null
        ? []
        : [{ label: query.trim(), href, key: 'hit' }];

  const onListKey = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(0, items.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const picked = items[active];
      if (picked) {
        event.preventDefault();
        go(picked.href);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel}
        title={triggerLabel}
        className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:border-amber-400 hover:text-stone-900 focus:outline-2 focus:outline-amber-500"
      >
        {triggerLabel} <kbd className="ml-1 rounded bg-stone-100 px-1 font-mono">⌘K</kbd>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={triggerLabel}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[15vh]"
          onClick={close}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-label={placeholder}
              value={query}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onListKey}
              placeholder={placeholder}
              className="w-full border-b border-stone-200 px-4 py-3 text-sm outline-none placeholder:text-stone-400"
            />
            <ul id="palette-list" role="listbox" className="max-h-64 overflow-y-auto p-2">
              {checking ? (
                <li className="px-3 py-2 text-xs text-stone-500">…</li>
              ) : items.length === 0 ? (
                <li className="px-3 py-2 text-xs text-stone-500">{emptyLabel}</li>
              ) : (
                items.map((item, index) => (
                  <li key={item.key} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(item.href)}
                      className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
                        index === active ? 'bg-amber-50 text-stone-900' : 'text-stone-700'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="ml-2 shrink-0 font-mono text-[11px] text-stone-400">{item.href}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
