// Stack-navigator presentation helpers for the Questions Up & Down workspace.
//
// Pure, derived-only. Nothing here changes persistence or scoring — it buckets
// existing `pkTier` output into human-readable states/labels, computes the
// separated warning flags, and picks the single recommended next move. The
// stack's grouped display order is fixed (strategy → critical → execution, by
// canonical position within each group); filters dim or hide but never reorder.

import {
  PK_LAYERS, PK_LAYER_BY_ID, pkHidesSource, rowTier,
  type LayerBand, type LayerStateRow, type PkLayer,
} from './layers';
import { relationsFor } from './relationships';

// ── Visual grouping (band → human label), so structure reads without L-numbers ──
export interface StackGroup {
  band: LayerBand;
  label: string;
  /** Plain-language purpose of the whole band. */
  blurb: string;
  layers: readonly PkLayer[];
}

const GROUP_ORDER: readonly LayerBand[] = ['strategy', 'critical', 'execution'];
const GROUP_LABEL: Record<LayerBand, { label: string; blurb: string }> = {
  strategy:  { label: 'Strategy & Vision',    blurb: 'Where this is going and why it matters.' },
  critical:  { label: 'Investor-critical core', blurb: 'The claims investors press on first.' },
  execution: { label: 'Execution & Build',    blurb: 'What it takes to make and ship it.' },
};

export const STACK_GROUPS: readonly StackGroup[] = GROUP_ORDER.map((band) => ({
  band,
  label: GROUP_LABEL[band].label,
  blurb: GROUP_LABEL[band].blurb,
  layers: PK_LAYERS.filter((L) => L.band === band),
}));

// ── Completion state ──
export type CompletionState = 'empty' | 'draft' | 'supported';

/** Empty = no claim. Supported = claim + evidence strength ≥ 3. Draft =
 *  claim but weaker/no evidence. Aspirational layers that hide the evidence
 *  picker (World Impact, Exit, Sector Mapping) have no evidence axis, so a
 *  filled one counts as supported. */
export function layerCompletionState(layerId: string, row?: LayerStateRow | null): CompletionState {
  const claim = (row?.claim_text ?? '').trim();
  if (!claim) return 'empty';
  if (pkHidesSource(layerId)) return 'supported';
  return rowTier(row) >= 3 ? 'supported' : 'draft';
}

export const COMPLETION_LABEL: Record<CompletionState, string> = {
  empty: 'Empty',
  draft: 'Draft',
  supported: 'Supported',
};

// ── Evidence strength (words, not stars) ──
const STRENGTH_WORDS = ['None', 'Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong'] as const;

export function evidenceStrengthLabel(tier: number): string {
  const t = Math.max(0, Math.min(5, Math.round(tier)));
  return STRENGTH_WORDS[t];
}

// ── Separated warning states ──
export interface LayerWarnings {
  /** No claim text yet. */
  missingClaim: boolean;
  /** A claim exists but its evidence strength is low (tier < 3), on a layer
   *  that has an evidence axis. */
  weakEvidence: boolean;
  /** A specific actionable risk from existing product logic — the layer is
   *  in an active cross-layer contradiction. */
  heat: boolean;
}

export function layerWarnings(
  layerId: string,
  row: LayerStateRow | undefined | null,
  heatLayerIds: ReadonlySet<string>,
): LayerWarnings {
  const claim = (row?.claim_text ?? '').trim();
  const missingClaim = claim.length === 0;
  const weakEvidence = !missingClaim && !pkHidesSource(layerId) && rowTier(row) < 3;
  return { missingClaim, weakEvidence, heat: heatLayerIds.has(layerId) };
}

/** Does this layer need attention? (missing claim OR weak evidence OR heat) */
export function needsAttention(w: LayerWarnings): boolean {
  return w.missingClaim || w.weakEvidence || w.heat;
}

// ── Single recommended next move ──
export type NextMoveKind =
  | 'add-claim' | 'add-evidence' | 'resolve-risk' | 'move' | 'continue-guided' | 'none';

export interface NextMove {
  kind: NextMoveKind;
  /** Dominant action label. */
  label: string;
  /** Why it helps — teaching copy. */
  detail: string;
  /** For 'move'/'resolve-risk': the layer to navigate to. */
  targetLayer?: string;
}

export interface NextMoveContext {
  /** Layer is in an active cross-layer contradiction. */
  hasHeat: boolean;
  /** The first related layer the heat points at (for the CTA target). */
  heatTargetLayer?: string;
  /** Founder entered via Door A's guided flow. */
  cameFromDoorA: boolean;
  /** Door A's six foundation layers aren't all cleared yet. */
  foundationIncomplete: boolean;
}

/**
 * Exactly one dominant recommendation, chosen by priority:
 *   1. missing claim → add a claim
 *   2. weak/no evidence → add evidence
 *   3. heat flag → resolve the risk
 *   4. supported + a relationship worth revisiting → move up/down
 *   5. came from Door A with foundation incomplete → continue the guided flow
 */
export function recommendedNextMove(
  layer: PkLayer,
  row: LayerStateRow | undefined | null,
  ctx: NextMoveContext,
): NextMove {
  const state = layerCompletionState(layer.id, row);

  if (state === 'empty') {
    return {
      kind: 'add-claim',
      label: 'Add a claim',
      detail: 'Say what you believe about this layer. You can move up or down and refine it as your understanding changes.',
    };
  }

  if (state === 'draft') {
    return {
      kind: 'add-evidence',
      label: 'Add evidence',
      detail: 'A claim without a strong source stays a guess investors won’t fund. Pick how you know under “How do you know?”',
    };
  }

  if (ctx.hasHeat) {
    return {
      kind: 'resolve-risk',
      label: 'Resolve the risk',
      detail: 'This layer sits in a contradiction with another. Reconcile them before it undercuts your story.',
      targetLayer: ctx.heatTargetLayer,
    };
  }

  const rel = relationsFor(layer.id);
  const move = rel.up ?? rel.down;
  if (move) {
    const target = PK_LAYER_BY_ID[move.layer];
    const dir = rel.up ? 'up' : 'down';
    return {
      kind: 'move',
      label: `Move ${dir} to ${target?.name ?? move.layer}`,
      detail: move.prompt,
      targetLayer: move.layer,
    };
  }

  if (ctx.cameFromDoorA && ctx.foundationIncomplete) {
    return {
      kind: 'continue-guided',
      label: 'Continue the guided flow',
      detail: 'Head back to the guided sequence to strengthen the layers investors gate on first.',
    };
  }

  return {
    kind: 'none',
    label: 'This layer looks supported',
    detail: 'Move up or down the stack to check it still holds against its neighbours.',
  };
}

// ── Filters (short default set + advanced under "More filters") ──
export type StackFilterId =
  | 'needs-attention' | 'empty' | 'supported' | 'relevant'
  | 'has-assumptions' | 'weak-evidence' | 'heat';

export interface FilterDef {
  id: StackFilterId;
  label: string;
  /** Advanced filters live behind "More filters". */
  advanced: boolean;
  /** 'relevant' only makes sense once a perspective is chosen. */
  needsPerspective?: boolean;
}

export const STACK_FILTERS: readonly FilterDef[] = [
  { id: 'needs-attention', label: 'Needs attention', advanced: false },
  { id: 'empty',           label: 'Empty',           advanced: false },
  { id: 'supported',       label: 'Supported',       advanced: false },
  { id: 'relevant',        label: 'Relevant to this perspective', advanced: false, needsPerspective: true },
  { id: 'has-assumptions', label: 'Has assumptions', advanced: true },
  { id: 'weak-evidence',   label: 'Weak evidence',   advanced: true },
  { id: 'heat',            label: 'Heat flags',      advanced: true },
];

export interface FilterInput {
  state: CompletionState;
  warnings: LayerWarnings;
  /** Perspective foregrounds this layer. */
  isRelevant: boolean;
  hasAssumptions: boolean;
}

export function layerMatchesFilter(id: StackFilterId, i: FilterInput): boolean {
  switch (id) {
    case 'needs-attention': return needsAttention(i.warnings);
    case 'empty':           return i.state === 'empty';
    case 'supported':       return i.state === 'supported';
    case 'relevant':        return i.isRelevant;
    case 'has-assumptions': return i.hasAssumptions;
    case 'weak-evidence':   return i.warnings.weakEvidence;
    case 'heat':            return i.warnings.heat;
    default:                return true;
  }
}

/** OR semantics: a layer matches when no filters are active, or it satisfies
 *  any active filter. Filters dim (not reorder) — the full stack stays present
 *  and the caller can always reveal everything by clearing the set. */
export function layerMatchesFilters(active: ReadonlySet<StackFilterId>, i: FilterInput): boolean {
  if (active.size === 0) return true;
  for (const f of active) if (layerMatchesFilter(f, i)) return true;
  return false;
}
