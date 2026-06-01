// Tests for stage gate computation.
// Brief non-negotiable #2: gates are derived from source_value, not stored.
// These tests pin down the derivation rules so a refactor can't silently
// move a gate threshold.

import { describe, expect, it } from 'vitest';
import { allGates, currentStage, gateProgress } from '../lib/gates';
import type { LayerStateRow, SourceId } from '../lib/layers';

const cell = (layer_id: string, source_value: SourceId | null, claim_text = 'x'): LayerStateRow =>
  ({ layer_id, claim_text, source_value });

const stack = (...rows: LayerStateRow[]) =>
  Object.fromEntries(rows.map((r) => [r.layer_id, r]));

describe('gateProgress(cpf)', () => {
  it('reports 0/4 on an empty stack', () => {
    const g = gateProgress({}, 'cpf');
    expect(g.passed).toBe(false);
    expect(g.passedReqs).toBe(0);
    expect(g.totalReqs).toBe(4);
    expect(g.pct).toBe(0);
  });

  it('passes only when all 4 requirements clear', () => {
    // CPF needs: customerSegment ≥ 4, problem ≥ 4, painScale ≥ 3, competitiveMarket ≥ 3
    const s = stack(
      cell('customerSegment', 'interviews'),  // tier 4 (people-layer mapping)
      cell('problem', 'interviews'),          // tier 4
      cell('painScale', 'research'),          // tier 3
      cell('competitiveMarket', 'research'),  // tier 4 (system-layer: research outranks)
    );
    const g = gateProgress(s, 'cpf');
    expect(g.passed).toBe(true);
    expect(g.passedReqs).toBe(4);
  });

  it('fails when one requirement misses', () => {
    const s = stack(
      cell('customerSegment', 'interviews'),
      cell('problem', 'experience'),          // tier 2 — too low
      cell('painScale', 'research'),
      cell('competitiveMarket', 'research'),
    );
    const g = gateProgress(s, 'cpf');
    expect(g.passed).toBe(false);
    expect(g.passedReqs).toBe(3);
  });

  it('respects per-layer source-to-tier overrides (research outranks interviews on system layers)', () => {
    // Competitive market: research = 4, interviews = 3. So "research" passes
    // the tier=3 requirement, and so do "interviews" — but at different tiers.
    const withResearch = gateProgress(
      stack(cell('competitiveMarket', 'research')),
      'cpf',
    );
    const withInterviews = gateProgress(
      stack(cell('competitiveMarket', 'interviews')),
      'cpf',
    );
    const cmReqResearch = withResearch.reqs.find((r) => r.layerId === 'competitiveMarket');
    const cmReqInterviews = withInterviews.reqs.find((r) => r.layerId === 'competitiveMarket');
    expect(cmReqResearch?.actualTier).toBe(4);
    expect(cmReqInterviews?.actualTier).toBe(3);
    expect(cmReqResearch?.ok).toBe(true);   // 4 >= 3
    expect(cmReqInterviews?.ok).toBe(true); // 3 >= 3
  });

  it('treats no source as tier 0', () => {
    const s = stack(
      cell('customerSegment', null, 'I have a beachhead!'),
    );
    const g = gateProgress(s, 'cpf');
    const cs = g.reqs.find((r) => r.layerId === 'customerSegment');
    expect(cs?.actualTier).toBe(0);
    expect(cs?.ok).toBe(false);
  });
});

describe('gateProgress(psf)', () => {
  it('passes when solution≥4, product≥3, painScale=5', () => {
    const s = stack(
      cell('solution', 'interviews'),  // tier 4 (default mapping)
      cell('product',  'research'),    // tier 3
      cell('painScale', 'prototype'),  // tier 5
    );
    expect(gateProgress(s, 'psf').passed).toBe(true);
  });

  it('requires painScale at the highest tier (paid pilot)', () => {
    const s = stack(
      cell('solution',  'interviews'),
      cell('product',   'research'),
      cell('painScale', 'interviews'), // tier 4 — not enough; PSF wants 5
    );
    expect(gateProgress(s, 'psf').passed).toBe(false);
  });
});

describe('gateProgress(bmv)', () => {
  it('passes when businessModel=5 and competitiveMarket≥4', () => {
    const s = stack(
      cell('businessModel',     'prototype'), // tier 5 (default)
      cell('competitiveMarket', 'research'),  // tier 4 (system override)
    );
    expect(gateProgress(s, 'bmv').passed).toBe(true);
  });
});

describe('currentStage', () => {
  it('returns null when CPF unmet', () => {
    expect(currentStage({})).toBeNull();
  });

  it('returns "cpf" when CPF passes but PSF does not', () => {
    const s = stack(
      cell('customerSegment',   'interviews'),
      cell('problem',           'interviews'),
      cell('painScale',         'research'),
      cell('competitiveMarket', 'research'),
    );
    expect(currentStage(s)).toBe('cpf');
  });

  it('returns "psf" when CPF + PSF pass but BMV does not', () => {
    const s = stack(
      // CPF
      cell('customerSegment',   'interviews'),
      cell('problem',           'interviews'),
      cell('competitiveMarket', 'research'),
      // PSF (and lifts painScale to 5 which beats CPF's 3)
      cell('solution',  'interviews'),
      cell('product',   'research'),
      cell('painScale', 'prototype'),
    );
    expect(currentStage(s)).toBe('psf');
  });

  it('returns "bmv" when all three pass', () => {
    const s = stack(
      cell('customerSegment',   'interviews'),
      cell('problem',           'interviews'),
      cell('competitiveMarket', 'prototype'), // 5 — also satisfies BMV's ≥4
      cell('solution',  'interviews'),
      cell('product',   'research'),
      cell('painScale', 'prototype'),
      cell('businessModel', 'prototype'),
    );
    expect(currentStage(s)).toBe('bmv');
  });

  it('downgrades when a layer regresses (the founder admits the interview was a friend favor)', () => {
    // Start at CPF
    const passing = stack(
      cell('customerSegment',   'interviews'),
      cell('problem',           'interviews'),
      cell('painScale',         'research'),
      cell('competitiveMarket', 'research'),
    );
    expect(currentStage(passing)).toBe('cpf');

    // Founder downgrades customer segment to "based on my experience"
    const regressed = { ...passing, customerSegment: cell('customerSegment', 'experience') };
    expect(currentStage(regressed)).toBeNull();
  });
});

describe('allGates', () => {
  it('returns the three gates in display order', () => {
    const gs = allGates({});
    expect(gs.map((g) => g.id)).toEqual(['cpf', 'psf', 'bmv']);
  });
});
