// PivotKit + QU&D — shared static config.
// 16 layers, 5 sources, per-layer source→tier map, stage gates.
// This is the canonical home for the layer/source/gate definitions.

export type LayerCategory = 'critical' | 'thoughtful';
export type LayerBand = 'strategy' | 'critical' | 'execution';
export type SourceId = 'logical' | 'experience' | 'research' | 'interviews' | 'prototype';
export type Industry = 'software' | 'biotech' | 'hardware' | 'fintech';
export type Evaluator = 'investor' | 'customer' | 'grant' | 'advisor';
export type Intensity = 'direct' | 'warmer' | 'sharp';
export type DoorChoice = 'A' | 'B';

export interface PkLayer {
  /** 1-indexed position within the canonical 16. */
  n: number;
  /** Stable id used in the DB and across surfaces. */
  id: string;
  /** Display name. */
  name: string;
  /** Critical = investor-pressed; thoughtful = strategy/execution halo. */
  cat: LayerCategory;
  band: LayerBand;
  /** The core question shown to the founder. */
  q: string;
  /** When true, the layer hides the "How do you know?" source picker — used
   *  for aspirational strategy layers that have no evidence basis to cite. */
  hideSource?: boolean;
  /** Restrict which sources are offered. Defaults to all of PK_SOURCES. */
  allowedSources?: readonly SourceId[];
  /** When set, LayerDetailPage renders a dedicated tool in place of the
   *  generic claim/source form. 'sectorMap' → the Visual Sector Map wizard. */
  customView?: 'sectorMap';
}

export interface PkSource {
  id: SourceId;
  label: string;
  short: string;
}

export interface PkGate {
  id: 'cpf' | 'psf' | 'bmv';
  short: string;
  name: string;
  reqs: { layer: string; tier: number }[];
}

/** Shape that mirrors the `pivotkit_layer_states` row. */
export interface LayerStateRow {
  id?: string;
  project_id?: string;
  layer_id: string;
  claim_text?: string | null;
  source_value?: SourceId | null;
  last_updated_at?: string;
}

// ── Layers (canonical 16, Software variant) ──
export const PK_LAYERS: readonly PkLayer[] = [
  { n: 1,  id: 'worldImpact',       name: 'World Impact',       cat: 'thoughtful', band: 'strategy',  q: 'When you exit, what lasting impact have you made?', hideSource: true },
  { n: 2,  id: 'exit',              name: 'Exit',               cat: 'thoughtful', band: 'strategy',  q: 'IPO, acquisition, license — what is the end?', hideSource: true },
  { n: 3,  id: 'sectorMapping',     name: 'Sector Mapping',     cat: 'thoughtful', band: 'strategy',  q: 'Players two degrees from where you expect to be.', hideSource: true, customView: 'sectorMap' },
  { n: 4,  id: 'competitiveMarket', name: 'Competitive Market', cat: 'critical',   band: 'critical',  q: 'Who sells the same/similar? What do users do now?' },
  { n: 5,  id: 'marketExpansion',   name: 'Market Expansion',   cat: 'thoughtful', band: 'strategy',  q: 'New revenue streams. Follow-on or complementary products long-term.' },
  { n: 6,  id: 'company',           name: 'Company',            cat: 'thoughtful', band: 'strategy',  q: 'Size and type of company needed to support this.', allowedSources: ['logical', 'experience', 'research'] },
  { n: 7,  id: 'businessModel',     name: 'Business Model',     cat: 'critical',   band: 'critical',  q: 'How will this make money? How do customers pay?' },
  { n: 8,  id: 'customerSegment',   name: 'Customer Segment',   cat: 'critical',   band: 'critical',  q: 'Smallest cohesive group with the greatest need.' },
  { n: 9,  id: 'solution',          name: 'Solution',           cat: 'critical',   band: 'critical',  q: 'How is the product solving the problem?' },
  { n: 10, id: 'problem',           name: 'Problem',            cat: 'critical',   band: 'critical',  q: 'What problem is the pain causing?' },
  { n: 11, id: 'painScale',         name: 'Pain Scale',         cat: 'critical',   band: 'critical',  q: 'Annoyance / Small / Moderate / Major / Requirement.' },
  { n: 12, id: 'product',           name: 'Product',            cat: 'critical',   band: 'critical',  q: 'What is it? What are you selling?' },
  { n: 13, id: 'requirements',      name: 'Requirements',       cat: 'thoughtful', band: 'execution', q: 'What must a successful product be or do?' },
  { n: 14, id: 'design',            name: 'Design',             cat: 'thoughtful', band: 'execution', q: 'Product description within the requirements.' },
  { n: 15, id: 'integrations',      name: 'Integrations',       cat: 'thoughtful', band: 'execution', q: 'Components/parts and what they do.' },
  { n: 16, id: 'production',        name: 'Production',         cat: 'thoughtful', band: 'execution', q: 'Platforms/systems your components run on.' },
];

export const PK_LAYER_BY_ID: Readonly<Record<string, PkLayer>> = Object.freeze(
  Object.fromEntries(PK_LAYERS.map((L) => [L.id, L])),
);

export const PK_SOURCES: readonly PkSource[] = [
  { id: 'logical',    label: 'Seems logical',          short: 'Logical' },
  { id: 'experience', label: 'Based on my experience', short: 'Experience' },
  { id: 'research',   label: 'Industry research',      short: 'Research' },
  { id: 'interviews', label: 'Customer interviews',    short: 'Interviews' },
  { id: 'prototype',  label: 'Prototype tests',        short: 'Prototype' },
];

/** Whether a layer should hide the "How do you know?" source picker. */
export function pkHidesSource(layerId: string): boolean {
  return PK_LAYER_BY_ID[layerId]?.hideSource ?? false;
}

/** The sources offered for a layer — all of PK_SOURCES unless the layer
 *  declares a narrower `allowedSources` set. */
export function pkSourcesFor(layerId: string): readonly PkSource[] {
  const allowed = PK_LAYER_BY_ID[layerId]?.allowedSources;
  if (!allowed) return PK_SOURCES;
  return PK_SOURCES.filter((s) => allowed.includes(s.id));
}

// Per-layer source→tier map (brief Mechanic 3). Default mapping if no override.
const DEFAULT_TIER: Record<SourceId, number> = {
  logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5,
};
const LAYER_TIER_OVERRIDES: Record<string, Record<SourceId, number>> = {
  // Layers where research outranks interviews — research describes a system,
  // interviews describe people, and these layers ARE about the system.
  sectorMapping:     { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  competitiveMarket: { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  marketExpansion:   { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  requirements:      { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  design:            { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  // Layers where interviews outrank research — these are about people.
  customerSegment:   { logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5 },
  problem:           { logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5 },
  painScale:         { logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5 },
};

/** 0 if no source. Otherwise the per-layer star tier (1-5). */
export function pkTier(layerId: string, srcId?: SourceId | null): number {
  if (!srcId) return 0;
  const m = LAYER_TIER_OVERRIDES[layerId] || DEFAULT_TIER;
  return m[srcId] || 0;
}

// ── Stage gates (config, not state — Monty will tune) ──
export const PK_GATES: Readonly<Record<'cpf' | 'psf' | 'bmv', PkGate>> = Object.freeze({
  cpf: {
    id: 'cpf', short: 'CPF', name: 'Customer-Problem Fit',
    reqs: [
      { layer: 'customerSegment',   tier: 4 },
      { layer: 'problem',           tier: 4 },
      { layer: 'painScale',         tier: 3 },
      { layer: 'competitiveMarket', tier: 3 },
    ],
  },
  psf: {
    id: 'psf', short: 'PSF', name: 'Problem-Solution Fit',
    reqs: [
      { layer: 'solution',  tier: 4 },
      { layer: 'product',   tier: 3 },
      { layer: 'painScale', tier: 5 },
    ],
  },
  bmv: {
    id: 'bmv', short: 'BMV', name: 'Business Model Viability',
    reqs: [
      { layer: 'businessModel',     tier: 5 },
      { layer: 'competitiveMarket', tier: 4 },
    ],
  },
});

/** Door A's foundation queue — the six investor-critical layers in the
 *  order they get pressed in a real meeting. */
export const FOUNDATION_QUEUE: readonly string[] = [
  'customerSegment',
  'problem',
  'painScale',
  'solution',
  'businessModel',
  'competitiveMarket',
];

// ── Helpers over a stack ──

/** Build a keyed lookup from an array of layer state rows. */
export function indexStack(rows: LayerStateRow[]): Record<string, LayerStateRow> {
  const out: Record<string, LayerStateRow> = {};
  for (const r of rows) out[r.layer_id] = r;
  return out;
}

/** Number of layers with a non-empty claim. */
export function filledCount(rows: LayerStateRow[]): number {
  return rows.filter((r) => (r.claim_text ?? '').trim().length > 0).length;
}

/** Convenience: tier for a row. */
export function rowTier(row?: LayerStateRow | null): number {
  if (!row) return 0;
  return pkTier(row.layer_id, row.source_value);
}
