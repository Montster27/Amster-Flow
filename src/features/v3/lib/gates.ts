// Stage gate computation. Pure functions over the layer stack. The brief's
// non-negotiable #2: stage is DERIVED on read, never stored. Stages can also
// downgrade (if a founder edits Customer Segment from "interviews" back to
// "logical", CPF is lost — that's the right behavior, surfaced visibly).

import { PK_GATES, pkTier } from './layers';
import type { LayerStateRow } from './layers';

export type StageId = 'cpf' | 'psf' | 'bmv';

export interface GateProgress {
  id: StageId;
  short: string;
  name: string;
  passed: boolean;
  passedReqs: number;
  totalReqs: number;
  /** % progress 0..1 — useful for the meter bar */
  pct: number;
  /** Per-requirement detail */
  reqs: Array<{
    layerId: string;
    minTier: number;
    actualTier: number;
    ok: boolean;
  }>;
}

/**
 * Compute progress for a single gate against a stack of layer states.
 * The stack is keyed by layer_id → row (or undefined if unfilled).
 */
export function gateProgress(
  stack: Record<string, LayerStateRow | undefined>,
  gate: StageId,
): GateProgress {
  const G = PK_GATES[gate];
  const reqs = G.reqs.map((r) => {
    const cell = stack[r.layer];
    const actualTier = pkTier(r.layer, cell?.source_value);
    return {
      layerId: r.layer,
      minTier: r.tier,
      actualTier,
      ok: actualTier >= r.tier,
    };
  });
  const passedReqs = reqs.filter((r) => r.ok).length;
  return {
    id: gate,
    short: G.short,
    name: G.name,
    passed: passedReqs === reqs.length,
    passedReqs,
    totalReqs: reqs.length,
    pct: reqs.length === 0 ? 0 : passedReqs / reqs.length,
    reqs,
  };
}

/**
 * The current stage = highest sequential gate that passes. CPF must pass
 * before PSF can be checked, PSF before BMV. Returns the highest passing
 * stage, or null if even CPF isn't met.
 */
export function currentStage(
  stack: Record<string, LayerStateRow | undefined>,
): StageId | null {
  const cpf = gateProgress(stack, 'cpf');
  if (!cpf.passed) return null;
  const psf = gateProgress(stack, 'psf');
  if (!psf.passed) return 'cpf';
  const bmv = gateProgress(stack, 'bmv');
  if (!bmv.passed) return 'psf';
  return 'bmv';
}

/**
 * Progress for all three gates in display order, with cumulative gating.
 * Subsequent gates are only "active" once the prior one passes — but the
 * meter still shows raw progress on each, so the founder can see
 * downstream pressure forming.
 */
export function allGates(
  stack: Record<string, LayerStateRow | undefined>,
): GateProgress[] {
  return ['cpf', 'psf', 'bmv'].map((id) => gateProgress(stack, id as StageId));
}
