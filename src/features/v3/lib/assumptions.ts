// Assumptions — types, state machine, derived helpers.
//
// Three channels (engineering brief §2):
//   direct        — founder writes one explicitly
//   spawned       — system derives one from a single filled layer
//   cross_layer   — system flags an inconsistency between two layers
//
// State: queued → active → {validated, refined, killed, dismissed}.
// Promoting a candidate (Add to stack) creates the row at state='queued'.

import type { LayerStateRow, SourceId } from './layers';
import { pkTier } from './layers';

export type AssumptionChannel = 'direct' | 'spawned' | 'cross_layer';

export type AssumptionState =
  | 'queued'    // accepted into the stack, no source yet
  | 'active'    // source attached, being tested
  | 'validated' // the assumption held up
  | 'refined'   // the assumption was rewritten in light of new evidence
  | 'killed'    // disproven and parked
  | 'dismissed' // candidate rejected or duplicate
  ;

export interface AssumptionRow {
  id: string;
  project_id: string;
  source_layer_id: string | null;
  cross_source_layer_id: string | null;
  assumption_text: string;
  notes: string | null;
  channel: AssumptionChannel;
  state: AssumptionState;
  source_value: SourceId | null;
  rule_id: string | null;
  mini_process_run_id: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  resolved_at: string | null;
}

/** Allowed transitions — used by the state-machine helpers. */
const TRANSITIONS: Record<AssumptionState, AssumptionState[]> = {
  queued:    ['active', 'dismissed', 'killed'],
  active:    ['validated', 'refined', 'killed', 'queued'],
  validated: ['active', 'refined'],
  refined:   ['active'],
  killed:    [],
  dismissed: ['queued'],
};

/** Convenience: terminal states are killed/dismissed. validated is *not*
 *  terminal — a validated assumption can still be reopened. */
const TERMINAL: ReadonlySet<AssumptionState> = new Set(['killed', 'dismissed']);

export function canTransition(from: AssumptionState, to: AssumptionState): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(state: AssumptionState): boolean {
  return TERMINAL.has(state);
}

/** Tier on the assumption itself, mirroring the layer scoring. Tier maps
 *  by the assumption's source_layer_id (if any) so cross-layer assumptions
 *  inherit the people-vs-system tier override of their primary layer. */
export function assumptionTier(a: AssumptionRow): number {
  if (!a.source_value) return 0;
  // Default to customerSegment-style mapping if no anchor; this matches
  // the brief's "interviews ≥ research for people layers" default.
  return pkTier(a.source_layer_id ?? 'customerSegment', a.source_value);
}

/** Group helpers for UI display. */
export function partitionByState(rows: AssumptionRow[]) {
  const out: Record<AssumptionState, AssumptionRow[]> = {
    queued: [], active: [], validated: [], refined: [], killed: [], dismissed: [],
  };
  for (const r of rows) out[r.state].push(r);
  return out;
}

export function hasSource(a: AssumptionRow): boolean {
  return a.source_value != null;
}

/** Spec: when the founder advances an assumption beyond queued, we expect
 *  a source to be attached. This validates the precondition for the
 *  queued → active transition. */
export function readyForActive(a: AssumptionRow): boolean {
  return a.state === 'queued' && hasSource(a);
}

/** A candidate is a not-yet-promoted assumption. The shape is the subset
 *  of AssumptionRow that the rule engine emits. */
export interface AssumptionCandidate {
  source_layer_id: string;
  cross_source_layer_id?: string;
  channel: AssumptionChannel;
  assumption_text: string;
  notes?: string;
  rule_id: string;
}

/** Build the client-side dedup key that mirrors the DB partial unique indexes
 *  on pivotkit_assumptions:
 *    spawned:     (project_id, source_layer_id, rule_id)
 *    cross_layer: (project_id, source_layer_id, cross_source_layer_id, rule_id)
 *  project_id is implicit (the candidate set is built per project). Returns
 *  null for rows without a rule_id (direct assumptions) — those are never
 *  rule-deduped.
 *
 *  Today every rule_id is globally unique and encodes its own layer(s), so a
 *  rule_id-only key would be equivalent. Keying by the full tuple keeps the
 *  client-side filter from ever diverging from the DB index if a future rule
 *  reuses a rule_id across layers/channels. */
export function dedupKey(a: {
  channel: AssumptionChannel;
  source_layer_id: string | null;
  cross_source_layer_id?: string | null;
  rule_id: string | null;
}): string | null {
  if (!a.rule_id) return null;
  return a.channel === 'cross_layer'
    ? `cl|${a.source_layer_id ?? ''}|${a.cross_source_layer_id ?? ''}|${a.rule_id}`
    : `sp|${a.source_layer_id ?? ''}|${a.rule_id}`;
}

/** Convert the partial candidate shape into the values needed for an INSERT. */
export function candidateToInsert(c: AssumptionCandidate, projectId: string) {
  return {
    project_id: projectId,
    source_layer_id: c.source_layer_id,
    cross_source_layer_id: c.cross_source_layer_id ?? null,
    channel: c.channel,
    assumption_text: c.assumption_text,
    notes: c.notes ?? null,
    rule_id: c.rule_id,
    state: 'queued' as AssumptionState,
  };
}

/** Compose a stack snapshot used by the rule engines so they only need to
 *  read indexed claim_text + source. */
export function projectStackForRules(rows: LayerStateRow[]) {
  const out: Record<string, { text: string | null; source: SourceId | null; tier: number }> = {};
  for (const r of rows) {
    const t = pkTier(r.layer_id, r.source_value);
    out[r.layer_id] = {
      text: (r.claim_text ?? null),
      source: (r.source_value as SourceId | null) ?? null,
      tier: t,
    };
  }
  return out;
}
export type RuleStackSnapshot = ReturnType<typeof projectStackForRules>;
