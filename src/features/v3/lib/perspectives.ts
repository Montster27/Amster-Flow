// Perspectives (role lenses) — UI-only emphasis config for the Questions Up &
// Down stack workspace.
//
// A perspective changes *emphasis and guidance only*. It never touches stored
// answers, evidence sources, tiers, or gate math, and it is deliberately
// separate from `Evaluator` (which keys pushback voice in lib/voice.ts). The
// role→layer mappings live here as data so they can be tuned without editing
// components.

export type Perspective = 'all' | 'investor' | 'designer' | 'product-delivery';

export interface PerspectiveDef {
  id: Perspective;
  /** Control label. */
  label: string;
  /** One line explaining what this lens foregrounds. */
  blurb: string;
  /** Layer ids this role reads most closely. Empty for 'all'. */
  highlight: readonly string[];
  /** Per-layer "why this matters to this role" copy (highlighted layers). */
  guidance: Readonly<Record<string, string>>;
}

// Shared framings called out in the brief.
const INVESTOR_CRITICAL = 'Investors will expect strong evidence here.';
const DESIGNER_CRITICAL = 'Design decisions depend heavily on this layer.';

export const PERSPECTIVES: readonly PerspectiveDef[] = [
  {
    id: 'all',
    label: 'All perspectives',
    blurb: 'Show the whole stack evenly, with no role emphasis.',
    highlight: [],
    guidance: {},
  },
  {
    id: 'investor',
    label: 'Investor',
    blurb: 'Foreground the layers investors press on first.',
    highlight: [
      'customerSegment', 'problem', 'painScale', 'competitiveMarket',
      'solution', 'product', 'businessModel',
    ],
    guidance: {
      customerSegment: `Who pays, and can they? ${INVESTOR_CRITICAL}`,
      problem: `Is the problem real and urgent enough to fund? ${INVESTOR_CRITICAL}`,
      painScale: `How much does this pain cost the customer today? ${INVESTOR_CRITICAL}`,
      competitiveMarket: `What do buyers do instead, and why switch? ${INVESTOR_CRITICAL}`,
      solution: `Does the solution actually relieve the pain? ${INVESTOR_CRITICAL}`,
      product: `Is there something real to sell? ${INVESTOR_CRITICAL}`,
      businessModel: `How does this make money, and does it scale? ${INVESTOR_CRITICAL}`,
    },
  },
  {
    id: 'designer',
    label: 'Designer',
    blurb: 'Foreground the layers design decisions depend on.',
    highlight: [
      'customerSegment', 'problem', 'painScale', 'solution',
      'product', 'requirements', 'design', 'integrations',
    ],
    guidance: {
      customerSegment: `Who are you designing for, and what constrains them? ${DESIGNER_CRITICAL}`,
      problem: `The job the experience has to do. ${DESIGNER_CRITICAL}`,
      painScale: `How acute the pain is shapes how much friction users tolerate. ${DESIGNER_CRITICAL}`,
      solution: `The promise the experience must deliver. ${DESIGNER_CRITICAL}`,
      product: `What users actually touch. ${DESIGNER_CRITICAL}`,
      requirements: `What a successful product must be or do. ${DESIGNER_CRITICAL}`,
      design: `How each requirement shows up in the experience. ${DESIGNER_CRITICAL}`,
      integrations: `The parts the experience is assembled from. ${DESIGNER_CRITICAL}`,
    },
  },
  {
    id: 'product-delivery',
    label: 'Product & Delivery',
    blurb: 'Foreground what it takes to build, ship, and operate.',
    highlight: [
      'product', 'requirements', 'design', 'integrations',
      'production', 'businessModel', 'company',
    ],
    guidance: {
      product: 'What you are shipping — the thing that has to exist.',
      requirements: 'The build targets everything downstream depends on.',
      design: 'How requirements become a buildable specification.',
      integrations: 'The components and parts you assemble and maintain.',
      production: 'The platforms and systems your components run on.',
      businessModel: 'How delivery is paid for and sustained over time.',
      company: 'The size and shape of team needed to operate this.',
    },
  },
];

export const PERSPECTIVE_BY_ID: Readonly<Record<Perspective, PerspectiveDef>> =
  Object.freeze(Object.fromEntries(PERSPECTIVES.map((p) => [p.id, p])) as Record<Perspective, PerspectiveDef>);

/** Whether a layer is emphasized under a perspective. 'all' highlights nothing
 *  (no emphasis, nothing dimmed). */
export function perspectiveHighlights(perspective: Perspective, layerId: string): boolean {
  const def = PERSPECTIVE_BY_ID[perspective];
  if (!def || def.highlight.length === 0) return false;
  return def.highlight.includes(layerId);
}

/** Role-specific "why this layer matters" copy, or null when the perspective
 *  is 'all' or the layer isn't one this role foregrounds. */
export function perspectiveGuidance(perspective: Perspective, layerId: string): string | null {
  const def = PERSPECTIVE_BY_ID[perspective];
  if (!def) return null;
  return def.guidance[layerId] ?? null;
}

/** True when a non-'all' perspective is active (drives whether role markers
 *  appear in the navigator at all). */
export function perspectiveIsActive(perspective: Perspective): boolean {
  return perspective !== 'all';
}
