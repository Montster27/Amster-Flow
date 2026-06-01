// Assumption state machine + tier derivation.

import { describe, expect, it } from 'vitest';
import {
  assumptionTier, canTransition, isTerminal, readyForActive,
} from '../lib/assumptions';
import type { AssumptionRow } from '../lib/assumptions';

const make = (patch: Partial<AssumptionRow> = {}): AssumptionRow => ({
  id: 'a1',
  project_id: 'p1',
  source_layer_id: 'customerSegment',
  cross_source_layer_id: null,
  assumption_text: 'x',
  notes: null,
  channel: 'direct',
  state: 'queued',
  source_value: null,
  rule_id: null,
  mini_process_run_id: null,
  created_at: '',
  created_by: null,
  updated_at: '',
  resolved_at: null,
  ...patch,
});

describe('canTransition', () => {
  it('queued → active is valid', () => {
    expect(canTransition('queued', 'active')).toBe(true);
  });
  it('queued → validated is invalid (must go through active)', () => {
    expect(canTransition('queued', 'validated')).toBe(false);
  });
  it('killed is terminal', () => {
    expect(canTransition('killed', 'active')).toBe(false);
    expect(canTransition('killed', 'queued')).toBe(false);
    expect(isTerminal('killed')).toBe(true);
  });
  it('dismissed can be reopened to queued', () => {
    expect(canTransition('dismissed', 'queued')).toBe(true);
    expect(canTransition('dismissed', 'active')).toBe(false);
  });
  it('validated can be reopened (not terminal)', () => {
    expect(isTerminal('validated')).toBe(false);
    expect(canTransition('validated', 'active')).toBe(true);
    expect(canTransition('validated', 'refined')).toBe(true);
  });
  it('same-state transitions are rejected', () => {
    expect(canTransition('active', 'active')).toBe(false);
  });
});

describe('readyForActive', () => {
  it('false when no source', () => {
    expect(readyForActive(make({ state: 'queued', source_value: null }))).toBe(false);
  });
  it('true when source attached and state queued', () => {
    expect(readyForActive(make({ state: 'queued', source_value: 'interviews' }))).toBe(true);
  });
  it('false once already active', () => {
    expect(readyForActive(make({ state: 'active', source_value: 'interviews' }))).toBe(false);
  });
});

describe('assumptionTier', () => {
  it('returns 0 with no source', () => {
    expect(assumptionTier(make({ source_value: null }))).toBe(0);
  });
  it('inherits the per-layer mapping of the anchor layer', () => {
    // customerSegment mapping: research=3, interviews=4 (people layer)
    expect(assumptionTier(make({ source_layer_id: 'customerSegment', source_value: 'research' }))).toBe(3);
    expect(assumptionTier(make({ source_layer_id: 'customerSegment', source_value: 'interviews' }))).toBe(4);
    // competitiveMarket mapping: research=4, interviews=3 (system layer)
    expect(assumptionTier(make({ source_layer_id: 'competitiveMarket', source_value: 'research' }))).toBe(4);
    expect(assumptionTier(make({ source_layer_id: 'competitiveMarket', source_value: 'interviews' }))).toBe(3);
  });
  it('falls back to people-default when source_layer_id is null', () => {
    // Default for null-anchor uses customerSegment mapping
    expect(assumptionTier(make({ source_layer_id: null, source_value: 'interviews' }))).toBe(4);
    expect(assumptionTier(make({ source_layer_id: null, source_value: 'research' }))).toBe(3);
  });
});
