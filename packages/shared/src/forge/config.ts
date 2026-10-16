/**
 * Knowledge Forge configuration (PHASE 5.1).
 *
 * All tier/discipline quotas live here — never hard-code them in pipeline
 * code (spec §5.2). Values are plain data; the pipeline interprets them.
 * Content generation itself is owner-gated (budget + experts); this file
 * only makes the rules machine-readable and testable.
 */

export type DisciplineCode =
  | 'MATH'
  | 'PHYS'
  | 'CHEM'
  | 'CSAI'
  | 'BIO'
  | 'MED'
  | 'ENG'
  | 'ECON'
  | 'PSYN'
  | 'PHIL'
  | 'HIST'
  | 'LING'
  | 'QUANT';

export interface ForgeDiscipline {
  readonly code: DisciplineCode;
  /** Canonical taxonomy reference for curriculum planning. */
  readonly taxonomy: string;
  /** How the primary answer is verified. */
  readonly verification: string;
  /** Requires a human expert before `verified` status. */
  readonly requiresExpert: boolean;
}

export const FORGE_DISCIPLINES: readonly ForgeDiscipline[] = [
  { code: 'MATH', taxonomy: 'MSC2020', verification: 'SymPy/SageMath, Lean 4 (some items)', requiresExpert: false },
  { code: 'PHYS', taxonomy: 'APS PhySH', verification: 'dimensional analysis (pint), SciPy', requiresExpert: false },
  { code: 'CHEM', taxonomy: 'IUPAC/ACS subdisciplines', verification: 'RDKit, numerical check, literature', requiresExpert: false },
  { code: 'CSAI', taxonomy: 'ACM CCS 2012', verification: 'code execution + unit tests', requiresExpert: false },
  { code: 'BIO', taxonomy: 'Gene Ontology + standard subfields', verification: 'literature (DOI/PubMed) + expert', requiresExpert: true },
  { code: 'MED', taxonomy: 'MeSH', verification: 'guidelines/literature + expert', requiresExpert: true },
  { code: 'ENG', taxonomy: 'IEEE Taxonomy', verification: 'simulation (SciPy, python-control)', requiresExpert: false },
  { code: 'ECON', taxonomy: 'JEL', verification: 'numerical / game solvers (nashpy)', requiresExpert: false },
  { code: 'PSYN', taxonomy: 'APA PsycInfo Classification', verification: 'statistics + literature + expert', requiresExpert: true },
  { code: 'PHIL', taxonomy: 'PhilPapers taxonomy', verification: 'Z3/Lean (formal items) + expert', requiresExpert: true },
  { code: 'HIST', taxonomy: 'Library of Congress Classification', verification: 'primary sources + expert', requiresExpert: true },
  { code: 'LING', taxonomy: 'Glottolog + standard subfields', verification: 'rule-consistency check + expert', requiresExpert: true },
  { code: 'QUANT', taxonomy: 'arXiv quant-ph / QIP tracks', verification: 'statevector simulation + expert', requiresExpert: true },
];

export type ForgeTierId = 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA' | 'OMEGA';

export interface ForgeTier {
  readonly id: ForgeTierId;
  /** Disciplines unlocked up to and including this tier. */
  readonly disciplines: readonly DisciplineCode[];
  /** Items in this tier (public + holdout). */
  readonly items: number;
  readonly publicItems: number;
  readonly holdoutItems: number;
  /** Single:cross ratio, parts of 100. */
  readonly singleShare: number;
  readonly crossShare: number;
  /** Min/max subject count for cross-discipline items. */
  readonly crossMinSubjects: number;
  readonly crossMaxSubjects: number;
  /** Max solver pass-rate for acceptance. */
  readonly passRateCap: number;
}

/** New disciplines each tier (cumulative); every tier ships 2,500 items. */
const TIER_NEW: Record<ForgeTierId, readonly DisciplineCode[]> = {
  ALPHA: ['MATH', 'PHYS', 'CHEM', 'CSAI'],
  BETA: ['BIO', 'MED'],
  GAMMA: ['ENG', 'ECON'],
  DELTA: ['PSYN', 'PHIL'],
  OMEGA: ['HIST', 'LING', 'QUANT'],
};

function cumulativeTiers(): Record<ForgeTierId, readonly DisciplineCode[]> {
  const order: ForgeTierId[] = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'OMEGA'];
  const seen: DisciplineCode[] = [];
  const result = {} as Record<ForgeTierId, readonly DisciplineCode[]>;
  for (const tier of order) {
    seen.push(...TIER_NEW[tier]);
    result[tier] = Object.freeze([...seen]);
  }
  return result;
}

const CUMULATIVE = cumulativeTiers();

export const FORGE_TIERS: readonly ForgeTier[] = [
  { id: 'ALPHA', disciplines: CUMULATIVE.ALPHA, items: 2500, publicItems: 2000, holdoutItems: 500, singleShare: 80, crossShare: 20, crossMinSubjects: 2, crossMaxSubjects: 2, passRateCap: 0.3 },
  { id: 'BETA', disciplines: CUMULATIVE.BETA, items: 2500, publicItems: 2000, holdoutItems: 500, singleShare: 70, crossShare: 30, crossMinSubjects: 2, crossMaxSubjects: 2, passRateCap: 0.25 },
  { id: 'GAMMA', disciplines: CUMULATIVE.GAMMA, items: 2500, publicItems: 2000, holdoutItems: 500, singleShare: 60, crossShare: 40, crossMinSubjects: 2, crossMaxSubjects: 3, passRateCap: 0.2 },
  { id: 'DELTA', disciplines: CUMULATIVE.DELTA, items: 2500, publicItems: 2000, holdoutItems: 500, singleShare: 50, crossShare: 50, crossMinSubjects: 2, crossMaxSubjects: 3, passRateCap: 0.15 },
  { id: 'OMEGA', disciplines: CUMULATIVE.OMEGA, items: 2500, publicItems: 2000, holdoutItems: 500, singleShare: 40, crossShare: 60, crossMinSubjects: 3, crossMaxSubjects: 4, passRateCap: 0.1 },
] as const;

/** Item formats and their tier-wide quotas. */
export const FORGE_FORMAT_QUOTAS = {
  /** Exact-match items: at least 70% of every tier. */
  exactMatchMinShare: 0.7,
  /** Multiple-choice items: at most 30%, each with ≥ 5 options. */
  multipleChoiceMaxShare: 0.3,
  multipleChoiceMinOptions: 5,
  /** Multimodal items: 10–15% of every tier. */
  multimodalMinShare: 0.1,
  multimodalMaxShare: 0.15,
} as const;

/** Dedup / contamination thresholds. */
export const FORGE_INTEGRITY = {
  /** Embedding cosine ≥ this means duplicate. */
  dedupCosine: 0.85,
  /** Significance bar reused from the Memory Book for promotion review. */
  expertSampleShare: 0.1,
} as const;

/** MCQ pass-rate ceiling also respects the guessing floor (spec §5.2). */
export function mcqPassRateCap(tierCap: number, optionCount: number): number {
  if (optionCount <= 0) throw new RangeError(`Option count must be positive: ${optionCount}`);
  return Math.min(tierCap, 1 / optionCount);
}

/** Total items across all tiers (12,500). */
export function forgeTotalItems(): number {
  return FORGE_TIERS.reduce((total, tier) => total + tier.items, 0);
}

/** Self-check used by tests: quotas consistent, tiers cumulative, caps sane. */
export function validateForgeConfig(): string[] {
  const issues: string[] = [];
  const seen = new Set<DisciplineCode>();
  let previous: readonly DisciplineCode[] = [];
  for (const tier of FORGE_TIERS) {
    if (tier.publicItems + tier.holdoutItems !== tier.items) {
      issues.push(`${tier.id}: public + holdout != items`);
    }
    if (tier.singleShare + tier.crossShare !== 100) {
      issues.push(`${tier.id}: single + cross != 100`);
    }
    if (tier.crossMinSubjects > tier.crossMaxSubjects) {
      issues.push(`${tier.id}: cross subject range inverted`);
    }
    if (tier.passRateCap <= 0 || tier.passRateCap > 1) {
      issues.push(`${tier.id}: pass-rate cap out of (0, 1]`);
    }
    for (const code of previous) {
      if (!tier.disciplines.includes(code)) {
        issues.push(`${tier.id}: discipline ${code} dropped (tiers are cumulative)`);
      }
    }
    for (const code of tier.disciplines) seen.add(code);
    previous = tier.disciplines;
  }
  if (seen.size !== FORGE_DISCIPLINES.length) {
    issues.push(`tier union covers ${seen.size} disciplines, expected ${FORGE_DISCIPLINES.length}`);
  }
  return issues;
}
