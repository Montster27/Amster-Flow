// Door A step state — types + pure helpers for L8.1 → L10.4.
//
// Persisted as a single JSONB blob in `pivotkit_door_a_state.data` (one row
// per project). Shape evolves freely — the only DB-level constraint is that
// the payload is a JSON object. Structural validation lives here.
//
// The canonical claim for layers L8/L9/L10 continues to live in
// pivotkit_layer_states (claim_text + source_value), so tier/gate machinery
// in lib/gates.ts works unchanged. This blob is the step-graph metadata
// that doesn't fit a scalar shape — option space, sub-group scores, value
// chain nodes/edges, adoption-cost analysis, etc.

// ── L8 (Customer Segment) — generate / sub-divide / score / select ──

export type PainValue = 'critical' | 'useful' | 'nice-to-have';
export type ReachValue = 'know-personally' | 'specific-channel' | 'no-idea';
export type SizeValue = 'tiny-niche' | 'real-market' | 'large-market';

export interface ParentGroup {
  id: string;
  name: string;
}

export interface SubGroup {
  id: string;
  parentGroupId: string;
  name: string;
  pain: PainValue | null;
  reachability: ReachValue | null;
  size: SizeValue | null;
  /** Set when founder marks a parent group "indivisible" at L8.2.
   *  Captured as a sentinel single-child sub-group with this field set. */
  indivisibleJustification?: string;
}

// ── L9 (Solution path) — problem / pain / solution / adoption cost ──

export type AdoptionVerdict = 'clearly-worth-it' | 'probably-worth-it' | 'close-call';

export interface ExtractedAssumption {
  id: string;
  text: string;
  /** Tracks whether this candidate has already been promoted to the
   *  assumptions queue (so we don't double-insert on save). */
  promoted: boolean;
}

export interface L9State {
  problemRestated: string;
  painRating: PainValue | null;
  painJustification: string;
  solution: string;
  /** Candidate assumptions extracted from solution text. Promoted to
   *  pivotkit_assumptions via useAssumptions.createDirect. */
  extractedAssumptions: ExtractedAssumption[];
  adoptionCostNotes: string;
  benefitOneLine: string;
  costOneLine: string;
  verdict: AdoptionVerdict | null;
}

// ── L10 (Sector & Business Model) — chain / margins / model / competitors ──

export type ChainRole = 'maker' | 'aggregator' | 'distributor' | 'retailer' | 'end-user' | 'other';

export interface ChainNode {
  id: string;
  label: string;
  role: ChainRole;
  /** 0 = founder, increases left-to-right. Re-normalized on insert/remove. */
  position: number;
  /** True for the two endpoint nodes; they're renameable but not removable. */
  locked: boolean;
}

export interface ChainEdge {
  fromNodeId: string;
  toNodeId: string;
  /** Optional flow note ("$1.20/unit", "white-label license", etc.). */
  notes?: string;
}

export interface ValueChain {
  nodes: ChainNode[];
  edges: ChainEdge[];
}

export type BusinessModelId =
  | 'fixed-fee'
  | 'subscription'
  | 'freemium'
  | 'transaction-fee'
  | 'usage-based'
  | 'licensing'
  | 'advertising'
  | 'razor-and-blades'
  | 'two-sided'
  | 'service-attached';

export type CompetitorTag = 'direct' | 'indirect' | 'status-quo' | 'diy-workaround';

export interface Competitor {
  id: string;
  name: string;
  tag: CompetitorTag;
}

export interface MarginEdgeEstimate {
  fromNodeId: string;
  toNodeId: string;
  /** Percent markup at this step. 25 = "next link adds 25%". */
  markupPct: number;
  /** True if the founder accepted a default value (so it counts as an
   *  assumption to validate). False if they entered/overrode the number. */
  fromDefault: boolean;
}

export interface L10State {
  chain: ValueChain;
  margins: {
    /** Founder's intended unit price, in whole units of currency. */
    priceUnits: number | null;
    estimates: MarginEdgeEstimate[];
  };
  /** Selected business models (founder can pick more than one). */
  businessModelIds: BusinessModelId[];
  businessModelOther: string;
  competitors: Competitor[];
}

// ── Top-level state ──

export interface DoorAState {
  /** Schema version — bump if shape changes incompatibly. */
  v: 1;
  optionSpace: ParentGroup[];
  subgroups: SubGroup[];
  beachheadId: string | null;
  beachheadJustification: string;
  l9: L9State;
  l10: L10State;
}

// ── Defaults / constructors ──

export function emptyDoorAState(): DoorAState {
  return {
    v: 1,
    optionSpace: [],
    subgroups: [],
    beachheadId: null,
    beachheadJustification: '',
    l9: {
      problemRestated: '',
      painRating: null,
      painJustification: '',
      solution: '',
      extractedAssumptions: [],
      adoptionCostNotes: '',
      benefitOneLine: '',
      costOneLine: '',
      verdict: null,
    },
    l10: {
      chain: {
        nodes: [
          { id: 'n-you',  label: 'You',      role: 'maker',    position: 0, locked: true },
          { id: 'n-end',  label: 'End user', role: 'end-user', position: 1, locked: true },
        ],
        edges: [{ fromNodeId: 'n-you', toNodeId: 'n-end' }],
      },
      margins: { priceUnits: null, estimates: [] },
      businessModelIds: [],
      businessModelOther: '',
      competitors: [],
    },
  };
}

/** Migrate any legacy/partial blob into a current-shape state. Defensive
 *  against missing keys when a blob was written by an older client. */
export function hydrate(raw: unknown): DoorAState {
  const seed = emptyDoorAState();
  if (!raw || typeof raw !== 'object') return seed;
  const r = raw as Partial<DoorAState>;
  return {
    v: 1,
    optionSpace: Array.isArray(r.optionSpace) ? r.optionSpace : seed.optionSpace,
    subgroups: Array.isArray(r.subgroups) ? r.subgroups : seed.subgroups,
    beachheadId: typeof r.beachheadId === 'string' ? r.beachheadId : null,
    beachheadJustification: typeof r.beachheadJustification === 'string'
      ? r.beachheadJustification : '',
    l9: { ...seed.l9, ...(r.l9 ?? {}) },
    l10: {
      ...seed.l10,
      ...(r.l10 ?? {}),
      chain: r.l10?.chain ?? seed.l10.chain,
      margins: { ...seed.l10.margins, ...(r.l10?.margins ?? {}) },
    },
  };
}

// ── L8.3: Triple-filter score math ──
//
// Weights: pain × 3, reach × 2, size × 1. Each axis value 1 (worst) → 3 (best).
// Range: 6 (all 1s) → 18 (all 3s).

const PAIN_W = 3;
const REACH_W = 2;
const SIZE_W = 1;

export const SCORE_MIN = PAIN_W + REACH_W + SIZE_W; // 6
export const SCORE_MAX = 3 * PAIN_W + 3 * REACH_W + 3 * SIZE_W; // 18

const PAIN_VAL: Record<PainValue, number> = {
  'critical': 3,
  'useful': 2,
  'nice-to-have': 1,
};
const REACH_VAL: Record<ReachValue, number> = {
  'know-personally': 3,
  'specific-channel': 2,
  'no-idea': 1,
};
const SIZE_VAL: Record<SizeValue, number> = {
  'large-market': 3,
  'real-market': 2,
  'tiny-niche': 1,
};

/** Raw beachhead score for a sub-group. Returns null if any axis is unscored. */
export function computeBeachheadScore(sg: Pick<SubGroup, 'pain' | 'reachability' | 'size'>): number | null {
  if (!sg.pain || !sg.reachability || !sg.size) return null;
  return PAIN_VAL[sg.pain] * PAIN_W
    + REACH_VAL[sg.reachability] * REACH_W
    + SIZE_VAL[sg.size] * SIZE_W;
}

/** 0–1 normalized for bar rendering. Null score → 0. */
export function normalizedScore(raw: number | null): number {
  if (raw == null) return 0;
  return (raw - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
}

/** Sub-group with the highest score. Ties broken by earliest position in array. */
export function topRankedSubgroup(subgroups: SubGroup[]): SubGroup | null {
  let best: { sg: SubGroup; raw: number } | null = null;
  for (const sg of subgroups) {
    const raw = computeBeachheadScore(sg);
    if (raw == null) continue;
    if (!best || raw > best.raw) best = { sg, raw };
  }
  return best?.sg ?? null;
}

// ── L10: Chain helpers ──

/** Number of intermediate links between "You" and "End user". 0 = direct B2C. */
export function chainDepth(chain: ValueChain): number {
  return Math.max(0, chain.nodes.length - 2);
}

/** Nodes sorted left-to-right by position. */
export function nodesOrdered(chain: ValueChain): ChainNode[] {
  return [...chain.nodes].sort((a, b) => a.position - b.position);
}

/** Lookup an edge by endpoints. */
export function findEdge(
  chain: ValueChain, fromNodeId: string, toNodeId: string,
): ChainEdge | undefined {
  return chain.edges.find((e) => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId);
}

// ── L9.4 helpers ──

/** True when the founder selected "close-call" — triggers revisit-beachhead nudge. */
export function isCloseCall(l9: Pick<L9State, 'verdict'>): boolean {
  return l9.verdict === 'close-call';
}

/** Lightweight assumption extractor for L9.3 solution text.
 *  MVP: split on sentence boundaries, take first 4 non-trivial sentences as
 *  candidate assumptions. Founder edits/promotes/dismisses each. */
export function extractAssumptions(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
  return sentences.slice(0, 4);
}
