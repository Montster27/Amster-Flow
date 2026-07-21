// Layer relationships — the "Questions Up & Down" navigation graph.
//
// Each layer names at least one connected layer to move to, in a semantic
// direction: "up" toward the more abstract why/promise/strategy, "down" toward
// the more concrete who/how/detail. The prompt explains *why* moving there is
// useful — it is teaching copy, not a competing button. Seeded from the brief's
// examples and filled so every one of the 16 layers has ≥1 up-or-down move.

export type RelationDirection = 'up' | 'down';

export interface LayerRelation {
  /** Target layer id. */
  layer: string;
  /** Why moving there helps, phrased as a question/prompt. */
  prompt: string;
}

export interface LayerRelationships {
  up?: LayerRelation;
  down?: LayerRelation;
  /** Other connected layers worth a glance (shown in the guidance panel). */
  related?: readonly string[];
}

export const LAYER_RELATIONSHIPS: Readonly<Record<string, LayerRelationships>> = Object.freeze({
  worldImpact: {
    down: { layer: 'exit', prompt: 'Move down to Exit — what ending actually realizes this impact?' },
    related: ['marketExpansion'],
  },
  exit: {
    up: { layer: 'worldImpact', prompt: 'Move up to World Impact — what lasting change does this exit serve?' },
    down: { layer: 'businessModel', prompt: 'Move down to Business Model — what makes this exit credible to a buyer?' },
  },
  sectorMapping: {
    down: { layer: 'competitiveMarket', prompt: 'Move down to Competitive Market — which of these players compete for your buyer?' },
    related: ['marketExpansion'],
  },
  competitiveMarket: {
    up: { layer: 'sectorMapping', prompt: 'Move up to Sector Mapping — where do these competitors sit in the wider sector?' },
    down: { layer: 'customerSegment', prompt: 'Move down to Customer Segment — whose business are these alternatives holding?' },
  },
  marketExpansion: {
    up: { layer: 'worldImpact', prompt: 'Move up to World Impact — do these new streams build toward the impact you intend?' },
    down: { layer: 'businessModel', prompt: "Move down to Business Model — does today's model open these later streams?" },
  },
  company: {
    up: { layer: 'businessModel', prompt: 'Move up to Business Model — what company does this way of making money require?' },
    down: { layer: 'production', prompt: 'Move down to Production — what will you actually have to operate?' },
  },
  businessModel: {
    up: { layer: 'competitiveMarket', prompt: 'Move up to Competitive Market — does your price beat what buyers do now?' },
    down: { layer: 'customerSegment', prompt: 'Move down to Customer Segment — does this buyer control the budget?' },
  },
  customerSegment: {
    up: { layer: 'problem', prompt: 'Move up to Problem — does this group share the same urgent problem?' },
    down: { layer: 'painScale', prompt: 'Move down to Pain Scale — how intensely does this group feel it?' },
  },
  solution: {
    up: { layer: 'problem', prompt: 'Move up to Problem — does this solve the pain you described?' },
    down: { layer: 'product', prompt: 'Move down to Product — what do you actually ship to deliver it?' },
  },
  problem: {
    up: { layer: 'painScale', prompt: 'Move up to Pain Scale — how much does this problem actually hurt?' },
    down: { layer: 'customerSegment', prompt: 'Move down to Customer Segment — who experiences this most intensely?' },
    related: ['solution'],
  },
  painScale: {
    up: { layer: 'problem', prompt: 'Move up to Problem — what problem is creating this pain?' },
    down: { layer: 'solution', prompt: 'Move down to Solution — does the solution match the severity?' },
  },
  product: {
    up: { layer: 'solution', prompt: 'Move up to Solution — is the product delivering the promised outcome?' },
    down: { layer: 'requirements', prompt: 'Move down to Requirements — what must this product be or do to succeed?' },
  },
  requirements: {
    up: { layer: 'product', prompt: 'Move up to Product — which product promise does this requirement serve?' },
    down: { layer: 'design', prompt: 'Move down to Design — how will the requirement appear in the experience?' },
  },
  design: {
    up: { layer: 'requirements', prompt: 'Move up to Requirements — which requirement does this decision support?' },
    down: { layer: 'integrations', prompt: 'Move down to Integrations — what components realize this design?' },
  },
  integrations: {
    up: { layer: 'design', prompt: 'Move up to Design — does this assembly deliver the intended design?' },
    down: { layer: 'production', prompt: 'Move down to Production — what do these components run on?' },
  },
  production: {
    up: { layer: 'integrations', prompt: 'Move up to Integrations — which components run on this?' },
    related: ['company'],
  },
});

/** Relationships for a layer, or an empty object if none are configured. */
export function relationsFor(layerId: string): LayerRelationships {
  return LAYER_RELATIONSHIPS[layerId] ?? {};
}
