// Spawn + cross-layer rule engines — make sure rules fire on the expected
// states and dedupe correctly against existing rule_ids.

import { describe, expect, it } from 'vitest';
import { deriveSpawnCandidates } from '../lib/spawnRules';
import { deriveCrossLayerCandidates } from '../lib/crossLayerRules';
import { projectStackForRules } from '../lib/assumptions';
import type { LayerStateRow } from '../lib/layers';

const cell = (layer_id: string, claim_text: string | null, source_value: 'logical' | 'experience' | 'research' | 'interviews' | 'prototype' | null = 'logical'): LayerStateRow =>
  ({ layer_id, claim_text, source_value });

describe('deriveSpawnCandidates: businessModel', () => {
  it('emits the 4 BM rules when claim and pain context align', () => {
    const stack = projectStackForRules([
      cell('businessModel', '$80/month SaaS subscription per user'),
      cell('painScale',     'Moderate', 'experience'), // tier 2 — triggers painThreshold
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingRuleIds: new Set(),
    });
    const ruleIds = cs.map((c) => c.rule_id);
    expect(ruleIds).toContain('businessModel:budget');
    expect(ruleIds).toContain('businessModel:procurement');
    expect(ruleIds).toContain('businessModel:painThreshold');
    expect(ruleIds).toContain('businessModel:switchAttention');
  });

  it('skips painThreshold once painScale tier is high enough', () => {
    const stack = projectStackForRules([
      cell('businessModel', '$80/month SaaS'),
      cell('painScale',     'High', 'interviews'), // tier 4 — suppresses
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingRuleIds: new Set(),
    });
    expect(cs.map((c) => c.rule_id)).not.toContain('businessModel:painThreshold');
  });

  it('skips procurement when claim has no SaaS/subscription keyword', () => {
    const stack = projectStackForRules([
      cell('businessModel', 'One-time purchase, hardware unit'),
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingRuleIds: new Set(),
    });
    expect(cs.map((c) => c.rule_id)).not.toContain('businessModel:procurement');
  });

  it('dedupes against already-promoted rule_ids', () => {
    const stack = projectStackForRules([
      cell('businessModel', '$80/month SaaS'),
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingRuleIds: new Set(['businessModel:budget']),
    });
    expect(cs.map((c) => c.rule_id)).not.toContain('businessModel:budget');
  });

  it('does nothing when the trigger layer has no claim', () => {
    const stack = projectStackForRules([
      cell('businessModel', '', null),
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingRuleIds: new Set(),
    });
    // Some rules don't gate on claim emptiness (switchAttention always fires
    // when bm has any value — but here null/'' should still skip those that
    // explicitly check `claim.trim()`); make sure budget skips at least.
    expect(cs.map((c) => c.rule_id)).not.toContain('businessModel:budget');
  });
});

describe('deriveCrossLayerCandidates', () => {
  it('fires cs × bm budget rule when both layers have claims', () => {
    const stack = projectStackForRules([
      cell('customerSegment', 'Solo-practice rural vets'),
      cell('businessModel',   '$80/month SaaS'),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingRuleIds: new Set(),
    });
    const ids = cs.map((c) => c.rule_id);
    expect(ids).toContain('segmentBudget:cs-bm');
  });

  it('skips when one of the two layers is empty', () => {
    const stack = projectStackForRules([
      cell('customerSegment', 'Solo-practice rural vets'),
      cell('businessModel',   '', null),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingRuleIds: new Set(),
    });
    expect(cs.map((c) => c.rule_id)).not.toContain('segmentBudget:cs-bm');
  });

  it('dedupes against existing rule_ids', () => {
    const stack = projectStackForRules([
      cell('customerSegment', 'Solo-practice rural vets'),
      cell('businessModel',   '$80/month SaaS'),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingRuleIds: new Set(['segmentBudget:cs-bm']),
    });
    expect(cs.map((c) => c.rule_id)).not.toContain('segmentBudget:cs-bm');
  });

  it('fires problemDoNothing when competitiveMarket mentions a workaround', () => {
    const stack = projectStackForRules([
      cell('problem',           'Vets manually reconcile schedules'),
      cell('competitiveMarket', 'Spreadsheets, email, do nothing'),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingRuleIds: new Set(),
    });
    expect(cs.map((c) => c.rule_id)).toContain('problemDoNothing:p-cm');
  });
});
