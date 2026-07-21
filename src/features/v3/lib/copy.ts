// PivotKit v3 — controlled user-facing vocabulary + display-label maps.
//
// This is the single source of truth for the words the product shows founders
// (Findings 9, 10, 12). It is display-only: nothing here renames a stored
// field, DB value, type, or internal identifier. Internal state names
// (queued/active/validated/…, channel 'direct'/'spawned'/'cross_layer',
// door_choice 'A'/'B') are unchanged — we only translate them for the UI.
//
// Prefer importing a label from here over inlining a string in a component, so
// the vocabulary stays consistent across Questions Up & Down, the dashboard,
// the Assumption Stack, mini-processes, and the pitch view.

import type { AssumptionState } from './assumptions';

// ── Approved terminology (Finding 12) ─────────────────────────────────────
//
// The words that name framework concepts. Use these; avoid the "Door A/Door B",
// "snapshot dump", "free-floating", "anchor layer", "stars" phrasings.
export const TERMS = {
  stack: '16-layer stack',
  layer: 'Layer',
  claim: 'Claim',
  evidenceSource: 'Evidence source',
  evidenceStrength: 'Evidence strength',
  stageGate: 'Stage gate',
  assumption: 'Assumption',
  miniProcess: 'Mini-process',
  questionsUpDown: 'Questions Up & Down',
  guidedFlow: 'Guided flow',
  perspective: 'Perspective',
} as const;

// Plain-language glossary definitions, keyed for the <Term> tooltip atom so a
// term can be explained at first use. Distinguish the related-but-different
// states the spec calls out (role relevance / missing claim / weak evidence /
// heat flag / pushback / assumption) so they never read as interchangeable.
export const GLOSSARY: Record<string, string> = {
  stack: 'The complete venture framework — sixteen layers from world impact down to production.',
  layer: 'One area of the venture model. Each layer holds one claim and its evidence.',
  claim: 'Your current answer within a layer — what you believe is true right now.',
  evidenceSource: 'How you know the claim may be true: reasoning, experience, research, interviews, or a working prototype.',
  evidenceStrength: 'The strength score derived from a claim and the source behind it. Stronger sources score higher.',
  stageGate: 'A readiness threshold that several layers must clear together (CPF, PSF, BMV).',
  assumption: 'An important belief that still needs testing — captured so you can gather evidence for it.',
  miniProcess: 'A short, structured activity that gathers real evidence for a layer.',
  guidedFlow: 'The step-by-step route through the foundation layers investors gate on first.',
  perspective: 'Which emphasis you view the stack through: Investor, Designer, or Product & Delivery.',
  roleRelevance: 'A perspective cares strongly about this layer — it is foregrounded, not flagged.',
  missingClaim: 'The layer has no answer written yet.',
  weakEvidence: 'A claim exists, but the evidence behind it is thin, so its strength is low.',
  heatFlag: 'A specific, actionable risk — usually a contradiction between two layers.',
  pushback: 'How a stakeholder would challenge the current claim under pressure.',
};

// Acronyms — expanded on first use (Finding 12). After first use the acronym
// may be shown alone as long as an accessible name / tooltip carries the full
// term.
export const ACRONYMS: Record<string, { full: string; definition: string }> = {
  CPF: { full: 'Customer–Problem Fit', definition: 'Customer–Problem Fit (CPF): evidence that a specific group genuinely has the problem.' },
  PSF: { full: 'Problem–Solution Fit', definition: 'Problem–Solution Fit (PSF): evidence that your solution actually relieves the problem.' },
  BMV: { full: 'Business Model Viability', definition: 'Business Model Viability (BMV): evidence that the way you make money holds up.' },
};

// ── Assumption status display labels (Finding 9) ───────────────────────────
//
// Neutral lifecycle shown to founders. Internal AssumptionState values are
// preserved verbatim; this only picks the words + colour for each.
//
// Mapping (display-only):
//   queued, active → "Needs testing"   (a belief captured, not yet proven)
//   validated      → "Supported"       (held up against evidence)
//   refined        → "Revised"         (rewritten in light of new evidence)
//   killed         → "Closed"          (disproven and parked)
//   dismissed      → "Closed"          (set aside without testing)
//
// LIMITATION (documented per the brief): the stored model has no single
// "disproven" state distinct from "set aside" — both are terminal closures.
// We keep them both under the "Closed" label but give each a distinct
// description so the outcome still reads clearly. Introducing a separate
// "Disproven" status would require a schema/enum change, which is out of scope.
export interface AssumptionStatusDisplay {
  /** Badge label shown to the founder. */
  label: string;
  /** One-line plain-language meaning (tooltip / caption). */
  description: string;
  /** Colour family, reusing existing status palettes. */
  tone: 'neutral' | 'testing' | 'supported' | 'revised' | 'closed';
}

export const ASSUMPTION_STATUS_DISPLAY: Record<AssumptionState, AssumptionStatusDisplay> = {
  queued:    { label: 'Needs testing', description: 'Captured but not yet being tested.',            tone: 'testing' },
  active:    { label: 'Needs testing', description: 'Being tested against evidence right now.',        tone: 'testing' },
  validated: { label: 'Supported',     description: 'Held up against the evidence you gathered.',      tone: 'supported' },
  refined:   { label: 'Revised',       description: 'Rewritten in light of what you learned.',         tone: 'revised' },
  killed:    { label: 'Closed',        description: 'Disproven and parked.',                           tone: 'closed' },
  dismissed: { label: 'Closed',        description: 'Set aside without testing.',                      tone: 'closed' },
};

/** Colours per status tone, drawn from the existing v3 palette. */
export const ASSUMPTION_STATUS_COLORS: Record<AssumptionStatusDisplay['tone'], { bg: string; fg: string }> = {
  neutral:   { bg: '#f1f5f9', fg: '#475569' },
  testing:   { bg: '#fef3c7', fg: '#92400e' },
  supported: { bg: '#dcfce7', fg: '#065f46' },
  revised:   { bg: '#e0f2fe', fg: '#0369a1' },
  closed:    { bg: '#f1f5f9', fg: '#94a3b8' },
};

export function assumptionStatusLabel(state: AssumptionState): string {
  return ASSUMPTION_STATUS_DISPLAY[state].label;
}

/** Label for what an assumption affects: the linked layer, or the whole venture. */
export const WHOLE_VENTURE_LABEL = 'Whole venture';

// The three-step assumption lifecycle shown in the first-use explanation.
export const ASSUMPTION_LIFECYCLE: readonly { step: number; text: string }[] = [
  { step: 1, text: 'Capture what you currently believe.' },
  { step: 2, text: 'Test it with evidence or a mini-process.' },
  { step: 3, text: 'Validate it, revise it, or resolve it.' },
];

export const ASSUMPTION_INTRO =
  'Assumptions are beliefs that still need evidence. Capture them here, connect them to the relevant layer, and update their status as you learn.';

// ── Consistent autosave states (Finding 12) ───────────────────────────────
export const SAVE_STATUS_COPY = {
  saving: 'Saving…',
  saved: 'Saved just now',
  error: 'Couldn’t save',
  retry: 'Retry',
} as const;

// ── Mini-process presentation (Finding 10) ────────────────────────────────
//
// Effort bands and specialist-method glossary, keyed off the code-side catalog
// (no schema involved). Effort is derived from the catalog's time estimate so
// there is one source of truth for "how big is this".
export type EffortLevel = 'Light' | 'Moderate' | 'Significant';

export function effortLevel(timeEstimateMinutes: number): EffortLevel {
  if (timeEstimateMinutes <= 90) return 'Light';
  if (timeEstimateMinutes <= 180) return 'Moderate';
  return 'Significant';
}

/** Human sample-size phrasing — "5 participants" rather than "n=5". */
export function sampleSizeLabel(targetN: number, unit = 'participants'): string {
  return `${targetN} ${unit}`;
}

// Specialist research terms that appear in the catalog, with plain-language
// definitions for a tooltip so no research-method expertise is required.
export const METHOD_GLOSSARY: Record<string, { term: string; definition: string }> = {
  switch: {
    term: 'Switch interview',
    definition: 'Switch interview: a past-event interview that reconstructs the moment someone dropped their old approach for a substitute, in their own words.',
  },
  momtest: {
    term: 'Mom Test interview',
    definition: 'Mom Test interview: questions about specific past behaviour rather than opinions about your idea, so the answers stay honest (Rob Fitzpatrick, “The Mom Test”).',
  },
  vanwestendorp: {
    term: 'Van Westendorp test',
    definition: 'Van Westendorp test: a four-question price-sensitivity survey that brackets an acceptable price range, from “too cheap” to “too expensive”.',
  },
  loi: {
    term: 'Letter of intent (LOI)',
    definition: 'Letter of intent (LOI): a short signed document where a buyer states they intend to purchase at a stated price, ahead of a full contract.',
  },
};

/** Per-catalog-kind presentation metadata that isn't part of the run schema. */
export const MINI_PROCESS_PRESENTATION: Record<string, { sampleUnit: string; methods: string[] }> = {
  switch_interviews:       { sampleUnit: 'switch interviews', methods: ['switch'] },
  past_event_interviews:   { sampleUnit: 'interviews',        methods: ['momtest'] },
  wtp_test:                { sampleUnit: 'respondents',       methods: ['vanwestendorp'] },
  prototype_test:          { sampleUnit: 'reactions',         methods: [] },
  direct_comparison_test:  { sampleUnit: 'competitors',       methods: [] },
  paid_pilot:              { sampleUnit: 'signed agreement',  methods: ['loi'] },
};

export function miniProcessSampleUnit(kind: string): string {
  return MINI_PROCESS_PRESENTATION[kind]?.sampleUnit ?? 'participants';
}

export function miniProcessMethods(kind: string): { term: string; definition: string }[] {
  return (MINI_PROCESS_PRESENTATION[kind]?.methods ?? [])
    .map((k) => METHOD_GLOSSARY[k])
    .filter(Boolean);
}
