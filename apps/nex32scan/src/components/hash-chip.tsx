'use client';

/**
 * HashChip — short hash/address + identicon + copy button.
 * Keyboard-first: the copy control is a real `<button>` with an
 * accessible label; copy state resets after 1.5 s.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { identiconBackground } from '@/lib/hash-ui';
import { shortHash } from '@/lib/format';

export function HashChip({
  value,
  href,
  copyLabel,
  copiedLabel,
  lead = 10,
  tail = 8,
}: {
  value: string | null | undefined;
  href?: string;
  copyLabel: string;
  copiedLabel: string;
  lead?: number;
  tail?: number;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (!value) return <span className="text-stone-500">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard unavailable (permissions, non-secure context) — still
      // acknowledge the tap so the control never feels dead.
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  const label = <span className="font-mono text-xs text-stone-700">{shortHash(value, lead, tail)}</span>;
  const text = href ? (
    <Link href={href} title={value} className="text-stone-900 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700">
      {label}
    </Link>
  ) : (
    <span title={value}>{label}</span>
  );

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 rounded-full border border-stone-300"
        style={{ background: identiconBackground(value) }}
      />
      {text}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
        className="rounded border border-stone-200 px-1.5 py-0.5 text-[11px] text-stone-500 hover:border-amber-400 hover:text-stone-900 focus:outline-2 focus:outline-amber-500"
      >
        {copied ? '✓' : '⧉'}
      </button>
    </span>
  );
}
