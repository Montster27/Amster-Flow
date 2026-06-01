// Spawn + cross-layer rule engines — make sure rules fire on the expected
// states and dedupe correctly against existing composite dedup keys
// (source_layer_id [+ cross_source_layer_id] + rule_id).
//
// Assertions check the EXACT candidate set (sorted rule_ids), not just
// membership. That way an *unexpected extra* rule firing — e.g. the always-on
// businessModel:switchAttention, or pricingPain piggy-backing on a businessModel
// claim — fails the test instead of slipping through a `toContain`.

import { describe, expect, it } from 'vitest';
import { deriveSpawnCandidates } from '../lib/spawnRules';
import { deriveCrossLayerCandidates } from '../lib/crossLayerRules';
import { dedupKey, projectStackForRules } from '../lib/assumptions';
import type { AssumptionCandidate } from '../lib/assumptions';
import type { LayerStateRow } from '../lib/layers';

const cell = (layer_id: string, claim_text: string | null, source_value: 'logical' | 'experience' | 'research' | 'interviews' | 'prototype' | null = 'logical'): LayerStateRow =>
  ({ layer_id, claim_text, source_value });

/** Sorted rule_ids of a candidate list — used for exact-set equality. */
const sortedIds = (cs: AssumptionCandidate[]): string[] =>
  cs.map((c) => c.rule_id).sort();

describe('deriveSpawnCandidates: businessModel', () => {
  it('emits exactly the 4 BM rules when claim and pain context align', () => {
    const stack = projectStackForRules([
      cell('businessModel', '$80/month SaaS subscription per user'),
      cell('painScale',     'Moderate', 'experience'), // tier 2 — triggers painThreshold
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingKeys: new Set(),
    });
    expect(sortedIds(cs)).toEqual([
      'businessModel:budget',
      'businessModel:painThreshold',
      'businessModel:procurement',
      'businessModel:switchAttention',
    ]);
  });

  it('drops painThreshold once painScale tier is high enough', () => {
    const stack = projectStackForRules([
      cell('businessModel', '$80/month SaaS'),
      cell('painScale',     'High', 'interviews'), // tier 4 — suppresses painThreshold
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingKeys: new Set(),
    });
    expect(sortedIds(cs)).toEqual([
      'businessModel:budget',
      'businessModel:procurement',
      'businessModel:switchAttention',
    ]);
  });

  it('drops procurement when the claim has no SaaS/subscription keyword', () => {
    const stack = projectStackForRules([
      cell('businessModel', 'One-time purchase, hardware unit'),
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingKeys: new Set(),
    });
    // No painScale in the stack → painThreshold also stays out.
    expect(sortedIds(cs)).toEqual([
      'businessModel:budget',
      'businessModel:switchAttention',
    ]);
  });

  it('omits already-promoted rule_ids (dedup) but still emits the rest', () => {
    const stack = projectStackForRules([
      cell('businessModel', '$80/month SaaS'),
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingKeys: new Set([
        dedupKey({ channel: 'spawned', source_layer_id: 'businessModel', rule_id: 'businessModel:budget' })!,
      ]),
    });
    // budget is deduped away; procurement (keyword match) + always-on
    // switchAttention remain (no painScale → no painThreshold).
    expect(sortedIds(cs)).toEqual([
      'businessModel:procurement',
      'businessModel:switchAttention',
    ]);
  });

  it('emits only the always-on switchAttention rule when the trigger has no claim', () => {
    const stack = projectStackForRules([
      cell('businessModel', '', null),
    ]);
    const cs = deriveSpawnCandidates({
      layerId: 'businessModel',
      stack,
      existingKeys: new Set(),
    });
    // budget/procurement gate on a non-empty claim and painThreshold needs a
    // painScale; only switchAttention fires unconditionally.
    expect(sortedIds(cs)).toEqual(['businessModel:switchAttention']);
  });
});

describe('deriveCrossLayerCandidates', () => {
  it('fires segmentBudget AND pricingPain when customerSegment + businessModel are set', () => {
    const stack = projectStackForRules([
      cell('customerSegment', 'Solo-practice rural vets'),
      cell('businessModel',   '$80/month SaaS'),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingKeys: new Set(),
    });
    // pricingPain:bm-ps also fires here: a priced model with an *absent*
    // painScale is itself flagged. The old toContain check silently missed it.
    expect(sortedIds(cs)).toEqual([
      'pricingPain:bm-ps',
      'segmentBudget:cs-bm',
    ]);
  });

  it('emits nothing when one of the two layers is empty', () => {
    const stack = projectStackForRules([
      cell('customerSegment', 'Solo-practice rural vets'),
      cell('businessModel',   '', null),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingKeys: new Set(),
    });
    expect(sortedIds(cs)).toEqual([]);
  });

  it('dedupes segmentBudget but still emits pricingPain', () => {
    const stack = projectStackForRules([
      cell('customerSegment', 'Solo-practice rural vets'),
      cell('businessModel',   '$80/month SaaS'),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack,
      existingKeys: new Set([
        dedupKey({ channel: 'cross_layer', source_layer_id: 'customerSegment', cross_source_layer_id: 'businessModel', rule_id: 'segmentBudget:cs-bm' })!,
      ]),
    });
    expect(sortedIds(cs)).toEqual(['pricingPain:bm-ps']);
  });

  it('fires only problemDoNothing when competitiveMarket mentions a workaround', () => {
    const stack = projectStackForRules([
      cell('problem',           'Vets manually reconcile schedules'),
      cell('competitiveMarket', 'Spreadsheets, email, do nothing'),
    ]);
    const cs = deriveCrossLayerCandidates({
      stack, existingKeys: new Set(),
    });
    expect(sortedIds(cs)).toEqual(['problemDoNothing:p-cm']);
  });
});
