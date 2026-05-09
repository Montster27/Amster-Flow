// Spawn rules (Channel 2). Given a single filled layer, generate
// candidate assumptions the founder probably wouldn't think to write.
//
// Each rule has:
//   - id        : stable string used as rule_id in pivotkit_assumptions
//                 (combined with source_layer_id, this dedupes via the
//                 partial unique index in the migration)
//   - layerId   : which layer triggers it
//   - description: shown to the founder as "why is this here?"
//   - generate  : (claim, stack) → list of candidates
//
// New rules are pure config — adding one is a code-side rows change.

import type { AssumptionCandidate } from './assumptions';
import type { RuleStackSnapshot } from './assumptions';

export interface SpawnRule {
  id: string;
  layerId: string;
  description: string;
  /** Generate candidates given the trigger layer's current claim and the
   *  full stack snapshot. Return [] when the rule doesn't fire on this
   *  state (e.g. claim is empty or another layer is missing context). */
  generate: (
    claim: string,
    stack: RuleStackSnapshot,
  ) => AssumptionCandidate[];
}

const SPAWN_RULES: SpawnRule[] = [
  // ── Business Model spawns 4 candidates ──
  {
    id: 'businessModel:budget',
    layerId: 'businessModel',
    description: 'Implied: the buyer has discretionary budget for your price.',
    generate: (claim) => {
      if (!claim.trim()) return [];
      return [{
        source_layer_id: 'businessModel',
        channel: 'spawned',
        rule_id: 'businessModel:budget',
        assumption_text: 'Buyers have discretionary budget for the priced offering.',
        notes: 'Implied by your price + buyer pairing — write the budget line you\'re competing for.',
      }];
    },
  },
  {
    id: 'businessModel:procurement',
    layerId: 'businessModel',
    description: 'Implied: the buyer can procure without legal/IT review.',
    generate: (claim) => {
      if (!/(saas|subscription|monthly|self-serve|sign[- ]up)/i.test(claim)) return [];
      return [{
        source_layer_id: 'businessModel',
        channel: 'spawned',
        rule_id: 'businessModel:procurement',
        assumption_text: 'Buyers can procure this without legal or IT review.',
        notes: 'Per-user / monthly billing implies self-serve checkout — confirm there\'s no procurement gate.',
      }];
    },
  },
  {
    id: 'businessModel:painThreshold',
    layerId: 'businessModel',
    description: 'Implied: pain is severe enough to justify recurring spend.',
    generate: (_claim, stack) => {
      const pain = stack.painScale;
      if (!pain || pain.tier >= 4) return [];
      return [{
        source_layer_id: 'businessModel',
        channel: 'spawned',
        rule_id: 'businessModel:painThreshold',
        assumption_text: 'The pain is rated Moderate-or-higher — enough to justify recurring spend.',
        notes: 'Sub-Moderate pain rarely sustains subscription pricing. Pain Scale is currently below tier 4.',
      }];
    },
  },
  {
    id: 'businessModel:switchAttention',
    layerId: 'businessModel',
    description: 'Implied: customers will pay attention-cost to switch from free workflows.',
    generate: () => [{
      source_layer_id: 'businessModel',
      channel: 'spawned',
      rule_id: 'businessModel:switchAttention',
      assumption_text: 'Customers will switch from existing free workflows (spreadsheets, email).',
      notes: 'Free incumbents charge a switching cost in attention, not money.',
    }],
  },

  // ── Customer Segment spawns ──
  {
    id: 'customerSegment:reachable',
    layerId: 'customerSegment',
    description: 'Implied: the segment is reachable on a known channel.',
    generate: (claim) => {
      if (!claim.trim()) return [];
      return [{
        source_layer_id: 'customerSegment',
        channel: 'spawned',
        rule_id: 'customerSegment:reachable',
        assumption_text: 'This segment is reachable through a channel you can name and afford.',
        notes: 'Specifying a segment without naming the access path gives you a market, not a beachhead.',
      }];
    },
  },
  {
    id: 'customerSegment:trigger',
    layerId: 'customerSegment',
    description: 'Implied: there\'s a specific trigger that puts a buyer in-market.',
    generate: (claim) => {
      if (!claim.trim()) return [];
      return [{
        source_layer_id: 'customerSegment',
        channel: 'spawned',
        rule_id: 'customerSegment:trigger',
        assumption_text: 'A specific trigger event puts buyers in-market for this offering.',
        notes: 'Without the trigger, you\'re competing for attention 365 days a year.',
      }];
    },
  },

  // ── Solution + Pain spawns ──
  {
    id: 'solution:painJustifies',
    layerId: 'solution',
    description: 'Implied: the pain is severe enough to justify a paid solution.',
    generate: (claim, stack) => {
      if (!claim.trim()) return [];
      const pain = stack.painScale;
      if (pain && pain.tier >= 3) return [];
      return [{
        source_layer_id: 'solution',
        channel: 'spawned',
        rule_id: 'solution:painJustifies',
        assumption_text: 'The pain is severe enough to justify a paid solution.',
        notes: 'Pain Scale is below tier 3 — the customer may treat your solution as a vitamin, not a painkiller.',
      }];
    },
  },

  // ── Problem + Customer Segment spawns ──
  {
    id: 'problem:topThree',
    layerId: 'problem',
    description: 'Implied: this problem is in the customer\'s top three current pains.',
    generate: (claim) => {
      if (!claim.trim()) return [];
      return [{
        source_layer_id: 'problem',
        channel: 'spawned',
        rule_id: 'problem:topThree',
        assumption_text: 'This problem ranks in the customer\'s top three current pains.',
        notes: 'If it\'s not top-three, you\'re competing with whatever else is on their plate today.',
      }];
    },
  },

  // ── Competitive Market spawns ──
  {
    id: 'competitiveMarket:headToHead',
    layerId: 'competitiveMarket',
    description: 'Implied: you win head-to-head against the named competitor on the deciding metric.',
    generate: (claim) => {
      const direct = claim.split(/[;,·]/).map((s) => s.trim()).filter(Boolean);
      if (direct.length === 0) return [];
      return [{
        source_layer_id: 'competitiveMarket',
        channel: 'spawned',
        rule_id: 'competitiveMarket:headToHead',
        assumption_text: `We win head-to-head against ${direct[0]} on the customer's deciding metric.`,
        notes: 'Listing a competitor implies you have a winning angle. Make that angle explicit.',
      }];
    },
  },
  {
    id: 'competitiveMarket:switchingCost',
    layerId: 'competitiveMarket',
    description: 'Implied: the switching cost from the do-nothing baseline is < your price × 3.',
    generate: (claim) => {
      if (!claim.trim()) return [];
      return [{
        source_layer_id: 'competitiveMarket',
        channel: 'spawned',
        rule_id: 'competitiveMarket:switchingCost',
        assumption_text: 'Switching cost from the do-nothing baseline is less than 3× your price.',
        notes: '"Do nothing" is the tough competitor. If switching costs > 3× your price, the buyer stays put.',
      }];
    },
  },
];

/**
 * Run all rules against the trigger layer and emit candidates not already
 * promoted (i.e. de-duped by rule_id against the existing assumption rows).
 */
export function deriveSpawnCandidates(args: {
  layerId: string;
  stack: RuleStackSnapshot;
  existingRuleIds: ReadonlySet<string>;
}): AssumptionCandidate[] {
  const { layerId, stack, existingRuleIds } = args;
  const cell = stack[layerId];
  if (!cell) return [];
  const claim = cell.text ?? '';

  const out: AssumptionCandidate[] = [];
  for (const rule of SPAWN_RULES) {
    if (rule.layerId !== layerId) continue;
    if (existingRuleIds.has(rule.id)) continue;
    const cs = rule.generate(claim, stack);
    for (const c of cs) out.push(c);
  }
  return out;
}

/** Total catalog count — used in the dashboard to show "X candidates spawned". */
export function spawnRulesForLayer(layerId: string): SpawnRule[] {
  return SPAWN_RULES.filter((r) => r.layerId === layerId);
}

export const ALL_SPAWN_RULES = SPAWN_RULES;
