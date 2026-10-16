/**
 * Innovation Lab feature flags (docs/INNOVATION.md).
 * Prototypes render nothing when their flag is off.
 */

export interface LabFlags {
  readonly llmsTxt: boolean;
  readonly nlSearch: boolean;
  readonly disciplineGraph: boolean;
}

function envOn(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

/** Development defaults ON for iteration; production requires opt-in. */
export function labFlags(): LabFlags {
  const dev = process.env.NODE_ENV !== 'production';
  return {
    llmsTxt: envOn('NEX_LAB_LLMS_TXT', dev),
    nlSearch: envOn('NEX_LAB_NL_SEARCH', dev),
    disciplineGraph: envOn('NEX_LAB_DISCIPLINE_GRAPH', dev),
  };
}
