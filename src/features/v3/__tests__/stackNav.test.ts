import { describe, expect, it } from 'vitest';
import {
  STACK_GROUPS, layerCompletionState, evidenceStrengthLabel,
  layerWarnings, needsAttention, recommendedNextMove, COMPLETION_LABEL,
  layerMatchesFilters, type FilterInput, type StackFilterId,
} from '../lib/stackNav';
import { PK_LAYERS, PK_LAYER_BY_ID, type LayerStateRow, type PkLayer } from '../lib/layers';

const row = (patch: Partial<LayerStateRow>): LayerStateRow => ({ layer_id: 'customerSegment', ...patch });

describe('STACK_GROUPS', () => {
  it('covers all 16 layers exactly once, grouped strategy → critical → execution', () => {
    expect(STACK_GROUPS.map((g) => g.band)).toEqual(['strategy', 'critical', 'execution']);
    const ids = STACK_GROUPS.flatMap((g) => g.layers.map((L) => L.id));
    expect(ids).toHaveLength(PK_LAYERS.length);
    expect(new Set(ids).size).toBe(PK_LAYERS.length);
  });

  it('keeps canonical (by-n) order within each group', () => {
    for (const g of STACK_GROUPS) {
      const ns = g.layers.map((L) => L.n);
      expect(ns).toEqual([...ns].sort((a, b) => a - b));
    }
  });
});

describe('layerCompletionState', () => {
  it('is Empty when there is no claim', () => {
    expect(layerCompletionState('customerSegment', undefined)).toBe('empty');
    expect(layerCompletionState('customerSegment', row({ claim_text: '   ' }))).toBe('empty');
  });

  it('is Supported when claim + evidence strength ≥ 3', () => {
    // customerSegment: interviews → tier 4
    expect(layerCompletionState('customerSegment', row({ claim_text: 'x', source_value: 'interviews' }))).toBe('supported');
    // research → tier 3
    expect(layerCompletionState('customerSegment', row({ claim_text: 'x', source_value: 'research' }))).toBe('supported');
  });

  it('is Draft when claim but weak/no evidence', () => {
    expect(layerCompletionState('customerSegment', row({ claim_text: 'x', source_value: 'logical' }))).toBe('draft');
    expect(layerCompletionState('customerSegment', row({ claim_text: 'x' }))).toBe('draft');
  });

  it('treats a filled evidence-hidden layer (World Impact) as Supported', () => {
    expect(layerCompletionState('worldImpact', { layer_id: 'worldImpact', claim_text: 'change the world' })).toBe('supported');
    expect(layerCompletionState('worldImpact', { layer_id: 'worldImpact' })).toBe('empty');
  });

  it('has human labels', () => {
    expect(COMPLETION_LABEL.supported).toBe('Supported');
  });
});

describe('evidenceStrengthLabel', () => {
  it('maps tiers to words, clamped', () => {
    expect(evidenceStrengthLabel(0)).toBe('None');
    expect(evidenceStrengthLabel(2)).toBe('Weak');
    expect(evidenceStrengthLabel(3)).toBe('Moderate');
    expect(evidenceStrengthLabel(5)).toBe('Very strong');
    expect(evidenceStrengthLabel(99)).toBe('Very strong');
  });
});

describe('layerWarnings (separated states)', () => {
  const heat = new Set<string>(['solution']);

  it('flags missing claim distinctly from weak evidence', () => {
    const w = layerWarnings('customerSegment', undefined, heat);
    expect(w).toEqual({ missingClaim: true, weakEvidence: false, heat: false });
  });

  it('flags weak evidence only when a claim exists on an evidence-bearing layer', () => {
    const w = layerWarnings('customerSegment', row({ claim_text: 'x', source_value: 'logical' }), heat);
    expect(w.weakEvidence).toBe(true);
    expect(w.missingClaim).toBe(false);
    // hidden-source layer never reads as weak evidence
    expect(layerWarnings('worldImpact', { layer_id: 'worldImpact', claim_text: 'x' }, heat).weakEvidence).toBe(false);
  });

  it('reads heat from the supplied contradiction set, not from pushback', () => {
    expect(layerWarnings('solution', row({ layer_id: 'solution', claim_text: 'x', source_value: 'prototype' }), heat).heat).toBe(true);
    expect(needsAttention(layerWarnings('solution', row({ layer_id: 'solution', claim_text: 'x', source_value: 'prototype' }), heat))).toBe(true);
  });
});

describe('layerMatchesFilters (dim, never reorder; OR semantics)', () => {
  const base: FilterInput = {
    state: 'empty',
    warnings: { missingClaim: true, weakEvidence: false, heat: false },
    isRelevant: false,
    hasAssumptions: false,
  };

  it('matches everything when no filter is active', () => {
    expect(layerMatchesFilters(new Set(), base)).toBe(true);
  });

  it('matches by a single active filter', () => {
    expect(layerMatchesFilters(new Set<StackFilterId>(['empty']), base)).toBe(true);
    expect(layerMatchesFilters(new Set<StackFilterId>(['supported']), base)).toBe(false);
  });

  it('is OR across multiple active filters', () => {
    const supported: FilterInput = { ...base, state: 'supported', warnings: { missingClaim: false, weakEvidence: false, heat: false } };
    expect(layerMatchesFilters(new Set<StackFilterId>(['empty', 'supported']), supported)).toBe(true);
    expect(layerMatchesFilters(new Set<StackFilterId>(['empty', 'heat']), supported)).toBe(false);
  });
});

describe('recommendedNextMove (single dominant action)', () => {
  const cs = PK_LAYER_BY_ID['customerSegment'];
  const ctx = { hasHeat: false, cameFromDoorA: false, foundationIncomplete: false };

  it('1) empty → add a claim', () => {
    expect(recommendedNextMove(cs, undefined, ctx).kind).toBe('add-claim');
  });

  it('2) draft → add evidence', () => {
    expect(recommendedNextMove(cs, row({ claim_text: 'x', source_value: 'logical' }), ctx).kind).toBe('add-evidence');
  });

  it('3) heat outranks a relationship move on a supported layer', () => {
    const m = recommendedNextMove(cs, row({ claim_text: 'x', source_value: 'interviews' }),
      { ...ctx, hasHeat: true, heatTargetLayer: 'businessModel' });
    expect(m.kind).toBe('resolve-risk');
    expect(m.targetLayer).toBe('businessModel');
  });

  it('4) supported + relationship → move up/down to the connected layer', () => {
    const m = recommendedNextMove(cs, row({ claim_text: 'x', source_value: 'interviews' }), ctx);
    expect(m.kind).toBe('move');
    expect(m.targetLayer).toBe('problem'); // customerSegment.up → problem
    expect(m.label).toMatch(/Move up to Problem/);
  });

  it('5) falls back to continue-guided when supported, no relationship, from Door A', () => {
    const orphan: PkLayer = { n: 99, id: 'orphanLayer', name: 'Orphan', cat: 'thoughtful', band: 'execution', q: '?' };
    const supported = { layer_id: 'orphanLayer', claim_text: 'x', source_value: 'interviews' as const };
    expect(recommendedNextMove(orphan, supported, { hasHeat: false, cameFromDoorA: true, foundationIncomplete: true }).kind)
      .toBe('continue-guided');
    expect(recommendedNextMove(orphan, supported, ctx).kind).toBe('none');
  });
});
