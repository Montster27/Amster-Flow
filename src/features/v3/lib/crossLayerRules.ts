// Cross-layer rules (Channel 3). Predicates over pairs of layers that
// surface a derived assumption when two layers contradict or imply
// something unstated.
//
// Each rule has:
//   - id           : stable string used as rule_id (combined with the two
//                    layer ids, dedupes via partial unique index)
//   - layers       : [primary, secondary] — both must have non-empty claim
//                    to evaluate, unless predicate handles its own gating
//   - description  : shown to founder when accepting/dismissing
//   - predicate    : (stack) → boolean — does this rule fire?
//   - derive       : (stack) → { assumption_text, notes }

import type { AssumptionCandidate } from './assumptions';
import type { RuleStackSnapshot } from './assumptions';

export interface CrossLayerRule {
  id: string;
  layers: [string, string];
  description: string;
  predicate: (stack: RuleStackSnapshot) => boolean;
  derive: (stack: RuleStackSnapshot) => { assumption_text: string; notes?: string };
}

const RULES: CrossLayerRule[] = [
  // ── customerSegment × businessModel ──
  {
    id: 'segmentBudget:cs-bm',
    layers: ['customerSegment', 'businessModel'],
    description: 'A specific segment + a price implies a budget the segment carries.',
    predicate: (s) => !!(s.customerSegment?.text && s.businessModel?.text),
    derive: (s) => ({
      assumption_text: `${(s.customerSegment?.text ?? 'This segment').replace(/\.$/, '')} carries the discretionary budget your business model assumes.`,
      notes: 'You\'ve named a segment and named a price. Whether that segment can pay that price — and renew it — is the seam between the two layers.',
    }),
  },

  // ── solution × customerSegment ──
  {
    id: 'solutionFit:s-cs',
    layers: ['solution', 'customerSegment'],
    description: 'A solution + a segment implies the solution fits the segment\'s constraints.',
    predicate: (s) => !!(s.solution?.text && s.customerSegment?.text),
    derive: (s) => ({
      assumption_text: `${(s.customerSegment?.text ?? 'This segment').replace(/\.$/, '')} can adopt your proposed solution given their workflow and constraints.`,
      notes: 'Solutions get rejected by segments for adoption-cost reasons that aren\'t obvious from the spec. Make the bridge explicit.',
    }),
  },

  // ── problem × competitiveMarket ──
  {
    id: 'problemDoNothing:p-cm',
    layers: ['problem', 'competitiveMarket'],
    description: 'A real problem with a "do-nothing" competitor implies the workaround is bearable.',
    predicate: (s) => {
      if (!s.problem?.text) return false;
      const cmText = s.competitiveMarket?.text ?? '';
      return /(do nothing|spreadsheet|email|workaround|flyer|facebook)/i.test(cmText);
    },
    derive: () => ({
      assumption_text: 'The pain is severe enough that the do-nothing workaround is no longer bearable.',
      notes: 'If "do nothing" is in the competitive map, the bar is whether your solution is worth the switch from "nothing".',
    }),
  },

  // ── pricing × pain ──
  {
    id: 'pricingPain:bm-ps',
    layers: ['businessModel', 'painScale'],
    description: 'A price implies the pain crosses a threshold of severity.',
    predicate: (s) => {
      if (!s.businessModel?.text) return false;
      const pain = s.painScale;
      if (!pain) return true; // pain unfilled is also a flag
      return pain.tier < 4;
    },
    derive: (s) => ({
      assumption_text: 'Pain Scale is high enough that customers will pay rather than continue tolerating the workaround.',
      notes: s.painScale ? `Currently sourced at ${s.painScale.source ?? 'no source'} (tier ${s.painScale.tier}). A paid SaaS implies tier ≥ 4.` : 'Pain Scale layer is empty — a priced offering presumes severe pain.',
    }),
  },

  // ── solution × production ──
  {
    id: 'solutionBuildable:s-pr',
    layers: ['solution', 'production'],
    description: 'A claimed solution + low-tier production implies "we can build it" is unverified.',
    predicate: (s) => {
      if (!s.solution?.text) return false;
      const prod = s.production;
      if (!prod) return true;
      return prod.tier < 2 || (prod.text ?? '').trim().length === 0;
    },
    derive: () => ({
      assumption_text: 'We can build this solution with the team and stack we currently have access to.',
      notes: 'A solution claim with no Production evidence is a build-feasibility assumption hiding inside a sales claim.',
    }),
  },

  // ── customerSegment × distribution proxy via competitiveMarket ──
  {
    id: 'segmentChannel:cs-cm',
    layers: ['customerSegment', 'competitiveMarket'],
    description: 'Naming a segment and naming competitors implies a shared discovery channel.',
    predicate: (s) => !!(s.customerSegment?.text && s.competitiveMarket?.text),
    derive: () => ({
      assumption_text: 'This segment discovers solutions through the same channels your competitors use today.',
      notes: 'If they don\'t, your CAC math is wrong even if your segment + competitor list are both right.',
    }),
  },
];

export function deriveCrossLayerCandidates(args: {
  stack: RuleStackSnapshot;
  existingRuleIds: ReadonlySet<string>;
}): AssumptionCandidate[] {
  const { stack, existingRuleIds } = args;
  const out: AssumptionCandidate[] = [];
  for (const rule of RULES) {
    if (existingRuleIds.has(rule.id)) continue;
    if (!rule.predicate(stack)) continue;
    const { assumption_text, notes } = rule.derive(stack);
    out.push({
      source_layer_id: rule.layers[0],
      cross_source_layer_id: rule.layers[1],
      channel: 'cross_layer',
      rule_id: rule.id,
      assumption_text,
      notes,
    });
  }
  return out;
}

export const ALL_CROSS_LAYER_RULES = RULES;
