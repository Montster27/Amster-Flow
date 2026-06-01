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

/** One route to market — a self-contained value chain plus its own margin
 *  walk. Founders can model several (direct, via distributor, …); each is an
 *  independent "swim lane". The first route is the primary one. */
export interface ValueRoute {
  id: string;
  /** Editable lane label ("Primary", "Via distributor", …). */
  label: string;
  chain: ValueChain;
  margins: {
    /** Founder's intended unit price at the "You" node, in whole units of
     *  currency. Per-route: a wholesale price to a distributor differs from a
     *  direct-to-consumer price. */
    priceUnits: number | null;
    estimates: MarginEdgeEstimate[];
  };
}

export interface L10State {
  /** Routes to market. Always ≥1; the first is the primary route. */
  routes: ValueRoute[];
  /** Selected business models (founder can pick more than one). */
  businessModelIds: BusinessModelId[];
  businessModelOther: string;
  competitors: Competitor[];
}

// ── Pains (stable, multi-pain identity model) ──
//
// A venture carries up to MAX_PAINS pains. Each pain's `id` is minted once at
// creation and never changes — it is the ONLY handle other layers reference.
// Nothing keys off `text`, `order`, or the computed display label. Exactly one
// pain is primary whenever the collection is non-empty.

export type PainSeverity = 'high' | 'med' | 'low';
export type EvidenceStar = 1 | 2 | 3 | 4 | 5;

/** Hard cap on pains per venture. addPain() rejects past this. */
export const MAX_PAINS = 3;

export interface Pain {
  /** Stable identity — minted once, never regenerated. The only field other
   *  layers reference; never key off text, order, or the display label. */
  id: string;
  text: string;
  severity: PainSeverity;
  /** 1 (weakest) → 5 (strongest) evidence backing this pain. */
  evidenceStar: EvidenceStar;
  /** Exactly one pain in a non-empty collection is primary. */
  isPrimary: boolean;
  /** 0-based sort order, kept contiguous on add/delete. Drives the computed
   *  "PAIN-1/2/3" display label — which is never persisted. */
  order: number;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

// ── L09 (Solution) — pain-anchored rows + derived assumptions ──
//
// The L09 solution ANSWERS the L11 pains: one solution row per pain, keyed by
// the pain's stable `painId` (never index/order/text). The founder gives each
// pain its own solution text and its own evidence star — the latter converts
// losslessly to/from a SourcePicker source exactly like pain evidence does. A
// pain with no row (or an empty solutionText) is an unaddressed gap, surfaced
// on the screen rather than hidden.

export interface SolutionRow {
  /** The L11 pain this solution answers — the only handle into the row. */
  painId: string;
  solutionText: string;
  /** 1 (weakest) → 5 (strongest) evidence backing THIS solution. */
  evidenceStar: EvidenceStar;
}

/** A claim derived from a pain + its solution row, persisted as a snapshot so
 *  the Assumption stack (a later sprint) can consume it and re-derive a single
 *  changed pain. Produced by lib/deriveAssumption. `needsRederive` is the
 *  staleness flag the stack will flip when a source pain changes — this sprint
 *  always writes a fresh snapshot with it `false`. The doubt-meter STATE LINE
 *  is a separate concern (Monty's voice, pending review) and is NOT stored. */
export interface DerivedAssumption {
  painId: string;
  text: string;
  evidenceStar: EvidenceStar;
  needsRederive: boolean;
}

// ── Top-level state ──

/** SourceId mirror — kept local so we don't pull the layers module into
 *  this types-and-pure-helpers file. Stays in sync with `lib/layers.ts`. */
export type DoorASourceId =
  | 'logical' | 'experience' | 'research' | 'interviews' | 'prototype';

export interface DoorAState {
  /** Schema version — bump if shape changes incompatibly. */
  v: 2;
  optionSpace: ParentGroup[];
  subgroups: SubGroup[];
  beachheadId: string | null;
  beachheadJustification: string;
  /** Stable, multi-pain collection (≤ MAX_PAINS). Pain ids are the cross-layer
   *  reference key. Empty until the founder records a pain; migrated from the
   *  legacy single L9 pain (painRating + painJustification) by hydrate(). */
  pains: Pain[];
  /** Pain-anchored solution rows (L09), keyed by painId. Empty until the
   *  founder answers a pain; a pain with no row here is unaddressed. */
  solutionRows: SolutionRow[];
  /** Persisted snapshot of the claims derived from `solutionRows` (L09). The
   *  Assumption stack reads these in a later sprint. See DerivedAssumption. */
  derivedAssumptions: DerivedAssumption[];
  l9: L9State;
  l10: L10State;
  /** Per-layer source the founder has staged for the contributing Door A
   *  steps. Pre-selects 'experience' on the relevant steps via the picker UI;
   *  flushed to `pivotkit_layer_states.source_value` when the founder clicks
   *  Continue past the step. Layers the founder never visited are absent —
   *  the dashboard reveal must not silently default them. */
  draftSources: Partial<Record<string, DoorASourceId>>;
}

// ── Defaults / constructors ──

/** A fresh direct chain: You → End user, both locked endpoints. */
export function makeDefaultChain(): ValueChain {
  return {
    nodes: [
      { id: 'n-you', label: 'You',      role: 'maker',    position: 0, locked: true },
      { id: 'n-end', label: 'End user', role: 'end-user', position: 1, locked: true },
    ],
    edges: [{ fromNodeId: 'n-you', toNodeId: 'n-end' }],
  };
}

/** A fresh route to market: a default direct chain with empty margins. */
export function emptyRoute(id: string, label: string): ValueRoute {
  return {
    id,
    label,
    chain: makeDefaultChain(),
    margins: { priceUnits: null, estimates: [] },
  };
}

export function emptyDoorAState(): DoorAState {
  return {
    v: 2,
    optionSpace: [],
    subgroups: [],
    beachheadId: null,
    beachheadJustification: '',
    pains: [],
    solutionRows: [],
    derivedAssumptions: [],
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
      routes: [emptyRoute('route-1', 'Primary')],
      businessModelIds: [],
      businessModelOther: '',
      competitors: [],
    },
    draftSources: {},
  };
}

/** Hydrate one route from an untrusted object. Falls back to a default
 *  direct chain / empty margins on missing or malformed fields. */
function hydrateRoute(x: unknown, i: number): ValueRoute {
  const o = (x && typeof x === 'object') ? x as Record<string, any> : {};
  const chain: ValueChain =
    (o.chain && typeof o.chain === 'object'
      && Array.isArray(o.chain.nodes) && Array.isArray(o.chain.edges))
      ? { nodes: o.chain.nodes, edges: o.chain.edges }
      : makeDefaultChain();
  return {
    id: typeof o.id === 'string' ? o.id : `route-${i + 1}`,
    label: typeof o.label === 'string' ? o.label : (i === 0 ? 'Primary' : `Route ${i + 1}`),
    chain,
    margins: {
      priceUnits: typeof o.margins?.priceUnits === 'number' ? o.margins.priceUnits : null,
      estimates: Array.isArray(o.margins?.estimates) ? o.margins.estimates : [],
    },
  };
}

/** Migrate an L10 blob into current shape. Handles the new `routes[]` form,
 *  the legacy single `{ chain, margins }` form (wrapped into one primary
 *  route), and missing/empty input (seed default). */
function hydrateL10(raw: unknown): L10State {
  const seed = emptyDoorAState().l10;
  const r = (raw && typeof raw === 'object') ? raw as Record<string, any> : {};

  let routes: ValueRoute[];
  if (Array.isArray(r.routes)) {
    routes = r.routes
      .filter((x: unknown) => x && typeof x === 'object')
      .map((x: unknown, i: number) => hydrateRoute(x, i));
  } else if (r.chain && typeof r.chain === 'object') {
    // Legacy { chain, margins } → a single primary route.
    routes = [hydrateRoute({ id: 'route-1', label: 'Primary', chain: r.chain, margins: r.margins }, 0)];
  } else {
    routes = seed.routes;
  }
  if (routes.length === 0) routes = seed.routes;

  return {
    routes,
    businessModelIds: Array.isArray(r.businessModelIds) ? r.businessModelIds : seed.businessModelIds,
    businessModelOther: typeof r.businessModelOther === 'string' ? r.businessModelOther : seed.businessModelOther,
    competitors: Array.isArray(r.competitors) ? r.competitors : seed.competitors,
  };
}

/** Migrate any legacy/partial blob into a current-shape state. Defensive
 *  against missing keys when a blob was written by an older client. */
export function hydrate(raw: unknown): DoorAState {
  const seed = emptyDoorAState();
  if (!raw || typeof raw !== 'object') return seed;
  const r = raw as Partial<DoorAState>;
  return {
    v: 2,
    optionSpace: Array.isArray(r.optionSpace) ? r.optionSpace : seed.optionSpace,
    subgroups: Array.isArray(r.subgroups) ? r.subgroups : seed.subgroups,
    beachheadId: typeof r.beachheadId === 'string' ? r.beachheadId : null,
    beachheadJustification: typeof r.beachheadJustification === 'string'
      ? r.beachheadJustification : '',
    pains: hydratePains(r.pains, r.l9),
    solutionRows: hydrateSolutionRows(r.solutionRows),
    derivedAssumptions: hydrateDerivedAssumptions(r.derivedAssumptions),
    l9: { ...seed.l9, ...(r.l9 ?? {}) },
    l10: hydrateL10(r.l10),
    draftSources: (r.draftSources && typeof r.draftSources === 'object')
      ? r.draftSources as Partial<Record<string, DoorASourceId>>
      : seed.draftSources,
  };
}

// ── Pains: migration, selectors, mutators ──
//
// All pure. Mutators return a new DoorAState (compose via the useDoorAState
// `update(prev => …)` channel) and throw on a rule violation. Every operation
// preserves the two invariants: ids are stable, and a non-empty collection has
// exactly one primary.

/** ISO sentinel for a creation time we don't know (malformed/legacy blobs). */
const EPOCH_ISO = '1970-01-01T00:00:00.000Z';

const SEVERITY_FROM_PAIN_VALUE: Record<PainValue, PainSeverity> = {
  'critical': 'high',
  'useful': 'med',
  'nice-to-have': 'low',
};

/** Deterministic id for the one pain synthesized from a pre-pains blob. Fixed
 *  (not random) so repeated hydrate() calls before the first save don't keep
 *  re-minting it — the id must be stable from the very first read. Mirrors the
 *  fixed 'route-1' id used by the legacy L10 → routes migration. */
const LEGACY_PAIN_ID = 'pain_legacy';

function isPainValue(v: unknown): v is PainValue {
  return v === 'critical' || v === 'useful' || v === 'nice-to-have';
}
function isSeverity(v: unknown): v is PainSeverity {
  return v === 'high' || v === 'med' || v === 'low';
}
function isEvidenceStar(v: unknown): v is EvidenceStar {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
}

/** Mint a fresh, stable pain id. (The spec calls for `"pain_" + nanoid()`; we
 *  follow the repo's existing random-id idiom — cf. uid() in
 *  DoorAPage.steps.tsx — to avoid adding a dependency.) Called once per pain,
 *  at creation, and never again. */
function mintPainId(): string {
  return `pain_${Math.random().toString(36).slice(2, 10)}`;
}

/** Re-sort by order and reassign contiguous 0-based orders, so the computed
 *  "PAIN-1/2/3" labels stay gap-free after add/delete. Returns the same object
 *  refs where an order is already correct. */
function renumber(pains: Pain[]): Pain[] {
  return [...pains]
    .sort((a, b) => a.order - b.order)
    .map((p, i) => (p.order === i ? p : { ...p, order: i }));
}

/** Force exactly one primary in a non-empty collection — heals a blob that
 *  stored zero or several primaries by handing it to the lowest-order pain. */
function normalizePrimary(pains: Pain[]): Pain[] {
  if (pains.length === 0) return pains;
  if (pains.filter((p) => p.isPrimary).length === 1) return pains;
  const winnerId = [...pains].sort((a, b) => a.order - b.order)[0].id;
  return pains.map((p) => ({ ...p, isPrimary: p.id === winnerId }));
}

/** Hydrate one pain from an untrusted object. Returns null when there's no
 *  string id — id IS the identity, so a record without one is dropped rather
 *  than handed a fresh (and therefore unstable) one. */
function hydratePain(x: unknown, i: number): Pain | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string') return null;
  return {
    id: o.id,
    text: typeof o.text === 'string' ? o.text : '',
    severity: isSeverity(o.severity) ? o.severity : 'med',
    evidenceStar: isEvidenceStar(o.evidenceStar) ? o.evidenceStar : 1,
    isPrimary: o.isPrimary === true,
    order: typeof o.order === 'number' ? o.order : i,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : EPOCH_ISO,
  };
}

/** Build the pains collection. A new-model blob carries a `pains` array; an
 *  older blob carries a single L9 pain (painRating + painJustification), which
 *  we migrate into one primary pain (order 0, evidenceStar 1, severity mapped
 *  from the legacy rating). A blob with neither yields [] — the founder hasn't
 *  recorded a pain yet. */
function hydratePains(raw: unknown, legacyL9: unknown): Pain[] {
  if (Array.isArray(raw)) {
    const pains = raw
      .map((x, i) => hydratePain(x, i))
      .filter((p): p is Pain => p !== null);
    return normalizePrimary(renumber(pains));
  }
  const l9 = (legacyL9 && typeof legacyL9 === 'object')
    ? legacyL9 as Record<string, unknown> : {};
  const text = typeof l9.painJustification === 'string' ? l9.painJustification : '';
  const rating = l9.painRating;
  // Only synthesize a pain when the founder actually entered legacy pain data.
  if (text.trim().length === 0 && !isPainValue(rating)) return [];
  return [{
    id: LEGACY_PAIN_ID,
    text,
    severity: isPainValue(rating) ? SEVERITY_FROM_PAIN_VALUE[rating] : 'med',
    evidenceStar: 1, // legacy pains carried no evidence rating
    isPrimary: true,
    order: 0,
    createdAt: EPOCH_ISO, // original creation time unknown
  }];
}

/** Hydrate the L09 solution rows from an untrusted blob. Drops records without
 *  a string painId (painId IS the handle) and de-dupes on painId, keeping the
 *  first. Orphan rows (painId no longer matching a pain) are left inert — the
 *  screen renders by iterating pains, so they simply don't show; nothing is
 *  destructively pruned. */
function hydrateSolutionRows(raw: unknown): SolutionRow[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const rows: SolutionRow[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    if (typeof o.painId !== 'string' || seen.has(o.painId)) continue;
    seen.add(o.painId);
    rows.push({
      painId: o.painId,
      solutionText: typeof o.solutionText === 'string' ? o.solutionText : '',
      evidenceStar: isEvidenceStar(o.evidenceStar) ? o.evidenceStar : 1,
    });
  }
  return rows;
}

/** Hydrate the persisted derived-assumption snapshot. Same painId-keyed,
 *  de-duped, defensively-typed discipline as the rows. */
function hydrateDerivedAssumptions(raw: unknown): DerivedAssumption[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DerivedAssumption[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    if (typeof o.painId !== 'string' || seen.has(o.painId)) continue;
    if (typeof o.text !== 'string') continue;
    seen.add(o.painId);
    out.push({
      painId: o.painId,
      text: o.text,
      evidenceStar: isEvidenceStar(o.evidenceStar) ? o.evidenceStar : 1,
      needsRederive: o.needsRederive === true,
    });
  }
  return out;
}

// Selectors ───────────────────────────────────────────────────────────────

/** All pains in display order (by `order`). */
export function getPains(state: DoorAState): Pain[] {
  return [...state.pains].sort((a, b) => a.order - b.order);
}

/** The single primary pain, or null when the collection is empty. */
export function getPrimaryPain(state: DoorAState): Pain | null {
  return state.pains.find((p) => p.isPrimary) ?? null;
}

/** Look up a pain by its stable id. */
export function getPainById(state: DoorAState, id: string): Pain | undefined {
  return state.pains.find((p) => p.id === id);
}

/** Computed display label ("PAIN-1/2/3") from `order`. Render-time only — never
 *  persist this and never use it as a key. */
export function painLabel(pain: Pick<Pain, 'order'>): string {
  return `PAIN-${pain.order + 1}`;
}

/** L11 layer star roll-up: the evidence star of the *weakest* pain — MIN of
 *  evidenceStar across the whole collection. A strong primary must not mask a
 *  weak secondary, so the layer is only as well-evidenced as its flimsiest
 *  pain. Returns 0 for an empty collection (no pains → no stars yet), mirroring
 *  pkTier()'s "0 when no source" convention in lib/layers. */
export function painLayerEvidenceStar(state: DoorAState): number {
  if (state.pains.length === 0) return 0;
  return state.pains.reduce((min, p) => Math.min(min, p.evidenceStar), 5);
}

/** The L09 solution row answering a given pain, or undefined when the founder
 *  hasn't addressed it yet. Keyed strictly by stable painId. */
export function getSolutionRow(state: DoorAState, painId: string): SolutionRow | undefined {
  return state.solutionRows.find((r) => r.painId === painId);
}

/** The locked beachhead sub-group's name — the `segment` subject in a derived
 *  assumption ("{segment} will … because …"). Falls back to a neutral subject
 *  when no beachhead is locked yet, so the claim still reads. */
export function beachheadSegmentLabel(state: DoorAState): string {
  const sg = state.subgroups.find((s) => s.id === state.beachheadId);
  const name = sg?.name.trim();
  return name && name.length > 0 ? name : 'This segment';
}

/** Claim text to persist for the L09 (Solution) layer. Prefers the founder's
 *  optional one-line summary; else falls back to the primary pain's solution,
 *  else the first filled row — so the layer claim tracks real solution content
 *  even when the summary is left blank. Empty when nothing is filled. */
export function solutionLayerClaim(state: DoorAState): string {
  const summary = state.l9.solution.trim();
  if (summary) return summary;
  const primary = getPrimaryPain(state);
  const primaryRow = primary ? getSolutionRow(state, primary.id) : undefined;
  if (primaryRow && primaryRow.solutionText.trim()) return primaryRow.solutionText.trim();
  const firstFilled = state.solutionRows.find((r) => r.solutionText.trim().length > 0);
  return firstFilled ? firstFilled.solutionText.trim() : '';
}

// Mutators ──────────────────────────────────────────────────────────────────

/** Append a pain. The first pain added is automatically the primary. Rejects
 *  once the collection is full (MAX_PAINS). The new id is minted here, once. */
export function addPain(
  state: DoorAState,
  input: { text: string; severity: PainSeverity; evidenceStar: EvidenceStar },
): DoorAState {
  if (state.pains.length >= MAX_PAINS) {
    throw new Error(`Cannot add more than ${MAX_PAINS} pains.`);
  }
  const pain: Pain = {
    id: mintPainId(),
    text: input.text,
    severity: input.severity,
    evidenceStar: input.evidenceStar,
    isPrimary: state.pains.length === 0,
    order: state.pains.length,
    createdAt: new Date().toISOString(),
  };
  return { ...state, pains: renumber([...state.pains, pain]) };
}

/** Make `painId` the primary pain. Flips the isPrimary flag across the
 *  collection without touching any id or order. Idempotent; throws if the id
 *  is unknown. */
export function promotePrimary(state: DoorAState, painId: string): DoorAState {
  if (!state.pains.some((p) => p.id === painId)) {
    throw new Error(`Pain not found: ${painId}`);
  }
  return {
    ...state,
    pains: state.pains.map((p) =>
      p.isPrimary === (p.id === painId) ? p : { ...p, isPrimary: p.id === painId }),
  };
}

/** Delete a pain. Refuses to delete the last remaining pain, and refuses to
 *  delete the primary while others exist (the caller must promote another
 *  first). Renumbers the survivors so labels stay contiguous. */
export function deletePain(state: DoorAState, painId: string): DoorAState {
  const target = state.pains.find((p) => p.id === painId);
  if (!target) throw new Error(`Pain not found: ${painId}`);
  if (state.pains.length === 1) {
    throw new Error('Cannot delete the last remaining pain.');
  }
  if (target.isPrimary) {
    throw new Error('Promote another pain to primary before deleting the current primary.');
  }
  return { ...state, pains: renumber(state.pains.filter((p) => p.id !== painId)) };
}

/** Patch a pain's founder-editable fields (text / severity / evidenceStar).
 *  Never touches the stable id, order, isPrimary, or createdAt — promotion and
 *  deletion are the only ways to move primary or remove a pain. Leaves the
 *  other pains untouched (same refs). Throws on an unknown id. */
export function editPain(
  state: DoorAState,
  painId: string,
  patch: Partial<Pick<Pain, 'text' | 'severity' | 'evidenceStar'>>,
): DoorAState {
  if (!state.pains.some((p) => p.id === painId)) {
    throw new Error(`Pain not found: ${painId}`);
  }
  return {
    ...state,
    pains: state.pains.map((p) => (p.id === painId ? { ...p, ...patch } : p)),
  };
}

/** Upsert the L09 solution row for a pain. Patches an existing row in place, or
 *  creates one (defaulting solutionText '' / evidenceStar 1) on first touch.
 *  Never mutates `painId` — it is the stable handle — and validates the pain
 *  exists, mirroring editPain's contract. Leaves the other rows untouched. */
export function setSolutionRow(
  state: DoorAState,
  painId: string,
  patch: Partial<Pick<SolutionRow, 'solutionText' | 'evidenceStar'>>,
): DoorAState {
  if (!state.pains.some((p) => p.id === painId)) {
    throw new Error(`Pain not found: ${painId}`);
  }
  if (state.solutionRows.some((r) => r.painId === painId)) {
    return {
      ...state,
      solutionRows: state.solutionRows.map((r) =>
        r.painId === painId ? { ...r, ...patch } : r),
    };
  }
  const row: SolutionRow = {
    painId,
    solutionText: patch.solutionText ?? '',
    evidenceStar: patch.evidenceStar ?? 1,
  };
  return { ...state, solutionRows: [...state.solutionRows, row] };
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

/** True when the founder has filled the primary input of a Door A sub-step,
 *  even if they haven't clicked Continue yet. Drives the right-rail
 *  "in-progress" sub-step state in the StepRail (Sprint 2 T1).
 *
 *  Pure / defensive — safe to call with a partially-hydrated state blob. */
export function stepHasDraft(stepId: string, state: DoorAState): boolean {
  switch (stepId) {
    case 'l8.1':
      return state.optionSpace.length > 0;
    case 'l8.2':
      return state.subgroups.length > 0;
    case 'l8.3':
      return state.subgroups.some((sg) => computeBeachheadScore(sg) !== null);
    case 'l8.4':
      return Boolean(state.beachheadId)
        || state.beachheadJustification.trim().length > 0;
    case 'l9.1':
      return state.l9.problemRestated.trim().length > 0;
    case 'l9.2':
      // L11 pain scale now lives in the stable pains[] collection; the step is
      // "in progress" once any pain carries text. (Legacy painRating/-Justification
      // remain only as hydrate() migration inputs.)
      return state.pains.some((p) => p.text.trim().length > 0);
    case 'l9.3':
      // L09 now spans an optional one-line summary plus pain-anchored solution
      // rows. The step is "in progress" once the founder types into either.
      return state.l9.solution.trim().length > 0
        || state.solutionRows.some((r) => r.solutionText.trim().length > 0);
    case 'l9.4':
      return state.l9.adoptionCostNotes.trim().length > 0
        || state.l9.verdict !== null
        || state.l9.benefitOneLine.trim().length > 0
        || state.l9.costOneLine.trim().length > 0;
    case 'l10.1':
      // More than one route, or any route extended past its two endpoints, or
      // any edge note → counts as draft.
      return state.l10.routes.length > 1
        || state.l10.routes.some((r) =>
          r.chain.nodes.length > 2
          || r.chain.edges.some((e) => (e.notes ?? '').trim().length > 0));
    case 'l10.2':
      return state.l10.routes.some((r) =>
        r.margins.priceUnits !== null || r.margins.estimates.length > 0);
    case 'l10.3':
      return state.l10.businessModelIds.length > 0
        || state.l10.businessModelOther.trim().length > 0;
    case 'l10.4':
      return state.l10.competitors.length > 0;
    default:
      return false;
  }
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
