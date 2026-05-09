// PivotKit + QU&D — Data + helpers.
// Layers, sources, source→tier mapping, gates, voice library, venture seeds.
// Mirrors pk-data-atoms.jsx from the design handoff.

export type LayerCategory = 'critical' | 'thoughtful';
export type LayerBand = 'strategy' | 'critical' | 'execution';

export interface PkLayer {
  n: number;
  id: string;
  name: string;
  cat: LayerCategory;
  band: LayerBand;
  q: string;
}

export interface PkSource {
  id: string;
  label: string;
  short: string;
}

export interface PkGate {
  short: string;
  name: string;
  reqs: { layer: string; tier: number }[];
}

export interface VoiceOpening {
  kicker: string;
  title: string;
  lede: string;
  body: string[];
  closer: string;
}

export type Intensity = 'direct' | 'warmer' | 'sharp';
export type Industry = 'software' | 'biotech' | 'hardware' | 'fintech';
export type StackState = 'empty' | 'midCPF' | 'nearPSF';
export type Evaluator = 'investor' | 'customer' | 'grant' | 'advisor';
export type DashView = 'mid' | 'tight';

export interface VoiceLibrary {
  opening: Record<Intensity, VoiceOpening>;
  pushback: Record<string, Record<number, string>>;
}

export interface Venture {
  name: string;
  industry: string;
  tagline: string;
  seeds: Record<string, string>;
}

export interface StackCell {
  text?: string;
  src?: string;
  tier: number;
}

export type Stack = Record<string, StackCell>;

// ── Layers (canonical 16, Software variant) ──
export const PK_LAYERS: PkLayer[] = [
  { n: 1,  id: 'worldImpact',       name: 'World Impact',       cat: 'thoughtful', band: 'strategy',  q: 'When you exit, what lasting impact have you made?' },
  { n: 2,  id: 'exit',              name: 'Exit',               cat: 'thoughtful', band: 'strategy',  q: 'IPO, acquisition, license — what is the end?' },
  { n: 3,  id: 'sectorMapping',     name: 'Sector Mapping',     cat: 'thoughtful', band: 'strategy',  q: 'Players two degrees from where you expect to be.' },
  { n: 4,  id: 'competitiveMarket', name: 'Competitive Market', cat: 'critical',   band: 'critical',  q: 'Who sells the same/similar? What do users do now?' },
  { n: 5,  id: 'marketExpansion',   name: 'Market Expansion',   cat: 'thoughtful', band: 'strategy',  q: 'Follow-on or complementary products long-term.' },
  { n: 6,  id: 'company',           name: 'Company',            cat: 'thoughtful', band: 'strategy',  q: 'Size and type of company needed to support this.' },
  { n: 7,  id: 'businessModel',     name: 'Business Model',     cat: 'critical',   band: 'critical',  q: 'How will this make money? How do customers pay?' },
  { n: 8,  id: 'customerSegment',   name: 'Customer Segment',   cat: 'critical',   band: 'critical',  q: 'Smallest cohesive group with the greatest need.' },
  { n: 9,  id: 'solution',          name: 'Solution',           cat: 'critical',   band: 'critical',  q: 'How is the product solving the problem?' },
  { n: 10, id: 'problem',           name: 'Problem',            cat: 'critical',   band: 'critical',  q: 'What problem is the pain causing?' },
  { n: 11, id: 'painScale',         name: 'Pain Scale',         cat: 'critical',   band: 'critical',  q: 'Annoyance / Small / Moderate / Major / Requirement.' },
  { n: 12, id: 'product',           name: 'Product',            cat: 'critical',   band: 'critical',  q: 'What is it? What are you selling?' },
  { n: 13, id: 'requirements',      name: 'Requirements',       cat: 'thoughtful', band: 'execution', q: 'What must a successful product be or do?' },
  { n: 14, id: 'design',            name: 'Design',             cat: 'thoughtful', band: 'execution', q: 'Product description within the requirements.' },
  { n: 15, id: 'integrations',      name: 'Integrations',       cat: 'thoughtful', band: 'execution', q: 'Components/parts and what they do.' },
  { n: 16, id: 'production',        name: 'Production',         cat: 'thoughtful', band: 'execution', q: 'Platforms/systems your components run on.' },
];

export const PK_SOURCES: PkSource[] = [
  { id: 'logical',    label: 'Seems logical',          short: 'Logical' },
  { id: 'experience', label: 'Based on my experience', short: 'Experience' },
  { id: 'research',   label: 'Industry research',      short: 'Research' },
  { id: 'interviews', label: 'Customer interviews',    short: 'Interviews' },
  { id: 'prototype',  label: 'Prototype tests',        short: 'Prototype' },
];

// Per-layer source→tier map. Default: logical=1, experience=2, research=3, interviews=4, prototype=5.
const DEFAULT_TIER: Record<string, number> = {
  logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5,
};
const LAYER_TIER_OVERRIDES: Record<string, Record<string, number>> = {
  sectorMapping:     { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  competitiveMarket: { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  marketExpansion:   { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  customerSegment:   { logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5 },
  problem:           { logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5 },
  painScale:         { logical: 1, experience: 2, research: 3, interviews: 4, prototype: 5 },
  requirements:      { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
  design:            { logical: 1, experience: 2, interviews: 3, research: 4, prototype: 5 },
};
export function pkTier(layerId: string, srcId?: string): number {
  if (!srcId) return 0;
  const m = LAYER_TIER_OVERRIDES[layerId] || DEFAULT_TIER;
  return m[srcId] || 0;
}

// ── Stage gates ──
export const PK_GATES: Record<string, PkGate> = {
  cpf: {
    short: 'CPF', name: 'Customer-Problem Fit',
    reqs: [
      { layer: 'customerSegment',   tier: 4 },
      { layer: 'problem',           tier: 4 },
      { layer: 'painScale',         tier: 3 },
      { layer: 'competitiveMarket', tier: 3 },
    ],
  },
  psf: {
    short: 'PSF', name: 'Problem-Solution Fit',
    reqs: [
      { layer: 'solution',  tier: 4 },
      { layer: 'product',   tier: 3 },
      { layer: 'painScale', tier: 5 },
    ],
  },
  bmv: {
    short: 'BMV', name: 'Business Model Viability',
    reqs: [
      { layer: 'businessModel',     tier: 5 },
      { layer: 'competitiveMarket', tier: 4 },
    ],
  },
};

// ── Mentor voice library ──
export const PK_VOICE: VoiceLibrary = {
  opening: {
    direct: {
      kicker: 'From Monty',
      title: '5%',
      lede: "About 5% of the founders I've worked with did customer discovery the right way.",
      body: [
        'The ones who did either pivoted within a month or killed a bad idea before they wasted six months and a marriage on it.',
        "The other 95% didn't need advice. They needed someone who wouldn't let them skip steps.",
        "That's what this is. It will tell you uncomfortable things. It will not let you skip the parts that matter.",
        'Pick a door. Be honest about your sources. The stack is the truth.',
      ],
      closer: "Two doors. One stack. Let's go.",
    },
    warmer: {
      kicker: 'Welcome',
      title: 'Two doors.',
      lede: "Most founders show up convinced they're further along than they are.",
      body: [
        "That's fine. We can start where you are.",
        "But somewhere in the next twenty minutes you'll hit a layer you don't actually know — and that's the moment this tool earns its keep.",
        'Pick the door that matches how you arrived. You can switch any time.',
      ],
      closer: 'Sources are how I score you. Be honest with them.',
    },
    sharp: {
      kicker: 'Read this',
      title: 'No skipping.',
      lede: 'You think you have an idea. You probably have an assumption stack with three honest data points and a lot of hope.',
      body: [
        "This tool exists because 95% of teams I've mentored skipped the parts that mattered. The 5% who didn't pivoted early or killed bad ideas fast.",
        "I'm going to ask you what you know and how you know it. The stars come from how, not what.",
        "If that bothers you, this isn't the tool.",
      ],
      closer: 'Otherwise — pick a door.',
    },
  },
  pushback: {
    customerSegment: {
      0: "Empty means no customer. Action: write a Beachhead Brief — ten named individuals at named companies, with their job title, the budget line this comes out of, and the trigger event that puts them in-market. If you can't fill ten rows, your segment isn't a segment yet.",
      1: "'Logical' segments collapse on contact. Action: run five switch-interviews — find people who recently picked a substitute and reconstruct the moment of struggle in their words. That gives you the cohort's real boundary, not your imagined one.",
      2: "Your past experience picked a different segment in a different decade. Action: do a Personas-of-One pass — three named users, full life-cycle of the workflow, with the artifacts they touch and the people they have to convince. Generic personas don't fundraise.",
      3: 'Industry reports describe the addressable market. They don\'t locate the beachhead. Action: a Next-10-Customers test — pick ten real names you can email this week and predict who buys, who declines, and why. Then make the calls.',
    },
    problem: {
      0: "No problem stated means you're selling a feature. Action: write a Problem Statement that names (a) the trigger event, (b) the workaround being used today, (c) the cost of that workaround in dollars or hours. Three sentences. If you can't, the problem isn't formed.",
      1: "Logic isn't lived experience. Action: run five Mom-Test interviews — past-tense, specific, non-leading. The deliverable is a transcript page where the customer narrates a struggle without you naming your solution.",
      2: "One person's pain isn't a market. Action: a Frequency-and-Severity survey of 50 people in the segment — how often does this happen, what does it cost them, how do they cope. The distribution is the evidence, not the median.",
      3: "Research describes that the problem exists somewhere. Action: a Job-Story Map for one named workflow — every decision, hand-off and tool involved. That's where the friction actually sits, and it's usually not where the white paper said.",
    },
    painScale: {
      0: "No rating means 'Annoyance' until proven otherwise. Action: a Severity Test — ten interviews where the customer ranks this against their other current pains. If it's not in their top-3, you're building a vitamin, not a painkiller.",
      1: "Self-rated pain is unreliable. Action: a Willingness-to-Pay test — Van Westendorp price-sensitivity meter or a smoke test landing page with a real-money pre-order button. The number that matters is the one they'd pay, not the one they'd say.",
      2: 'Anecdotes inflate severity. Action: count switching cost — how much the customer is currently spending in time, money or risk on workarounds. If switching cost > your price by 3×, the pain is real. If not, it isn\'t.',
      3: "Research can't score the pain in this cohort. Action: a paid pilot or LOI — one signed agreement at a real price. One name with money attached moves the room more than any survey.",
    },
    solution: {
      0: "No solution means there's nothing to test. Action: a Solution Sketch — one page, the user flow in five steps, before any code. Show three people in the segment, listen for the part they don't believe.",
      1: "On paper any solution works. Action: a Wizard-of-Oz pilot — deliver the outcome by hand for one week, with three customers. You'll learn what the actual product needs to do, not what you assumed.",
      2: "Past patterns don't transfer cleanly. Action: a Concierge MVP — full-service the first five customers manually. The thing you keep doing is the product. The thing you stop doing was a feature.",
      3: 'Research suggests a shape; a prototype proves it. Action: a head-to-head usability test against the leading alternative, on the same task. If yours doesn\'t win on time-to-outcome, you don\'t have a solution yet.',
    },
    product: {
      0: "Empty product field means you're selling vibes. Action: write a one-page Spec — primary user, primary verb, success criterion in measurable units. If you can't write the success metric, the product isn't scoped.",
      1: 'Logical product = wishlist. Action: a Cut List — rank features by which is critical for the first paying customer. Anything outside the top three is v2. Investors care about what you said no to.',
      2: 'Your taste is a hypothesis. Action: a clickable prototype with five segment users, measured on completion time and SUS (System Usability Scale ≥ 70 is the bar). Bring the numbers, not the screenshots.',
      3: 'Reports describe the category. Action: a four-week beta with ten users measured on D7 retention. Below 30% means you have a demo, not a product.',
    },
    competitiveMarket: {
      0: 'Empty competitive map looks naïve. Action: a 2-Degree Sector Map — direct, indirect and DIY workarounds, and the players two hops out (suppliers, distributors, regulators). "No competition" is the most expensive line in your deck.',
      1: "'Logical' competition omits the workaround. Action: a Job-Switcher Audit — five customers who tried a competitor and stopped, five who built it themselves, five who do nothing. The 'do nothing' bucket is your real competition.",
      2: 'Your experience is a decade out of date. Action: a fresh Win/Loss study — call ten prospects who picked a competitor in the last 12 months, ten who picked you (or a stand-in), and document the deciding criterion in their words.',
      3: 'Reports list competitors; they don\'t score the head-to-head. Action: a benchmarking bake-off on the top-3 use cases against the leader, blind-tested with five segment users. That\'s the slide that wins the meeting.',
    },
    businessModel: {
      0: "No model means we're funding a hobby. Action: a one-page Unit Economics sheet — price, gross margin, CAC, payback period, retention. If any cell is 'TBD', the model isn't a model.",
      1: 'Logical pricing is a guess. Action: a price ladder test — three price points, ten prospects each, signed LOIs at one of them. The price you can collect signatures at is your price.',
      2: "Last company's economics don't carry over. Action: a CAC-channel test — $1k of paid spend on the two most promising channels, measured to qualified pipeline. Channel economics are the company.",
      3: "Research models the market; pilots model the company. Action: one paid pilot at a target-segment price, with the procurement path documented end-to-end. If you can't tell the cheque's journey, you don't have a business model.",
    },
  },
};

// ── Venture seeds ──
export const VENTURE: Record<Industry, Venture> = {
  software: {
    name: 'PetFinder', industry: 'Software',
    tagline: 'Reunite lost dogs with their owners in the first golden 24 hours.',
    seeds: {
      worldImpact: 'Fewer pets lost permanently; less owner trauma in dense cities.',
      exit: 'Acquired by a pet-insurance carrier in year 5 as a retention channel.',
      sectorMapping: 'Pet insurers, microchip registries, vet networks, neighborhood apps, animal control.',
      competitiveMarket: 'Petco Love Lost; PawBoost; local Facebook groups; flyering.',
      marketExpansion: 'Cats; small mammals; international rollout; insurance bundling.',
      company: 'Lean software team, 20-30 ppl by year 3, neighborhood-led GTM.',
      businessModel: '$9/mo subscription + premium SMS broadcast credits.',
      customerSegment: 'Urban dog-owners 28–45 within 24h of loss.',
      solution: 'Geo-fenced alert network across nearby owners + walkers + vets.',
      problem: "After 24 hours a lost dog's recovery odds drop by 60%.",
      painScale: 'Major — 12% of dog-owners lose a pet each year; emotional + financial.',
      product: 'Mobile app with one-tap LOST broadcast; walker network alert.',
      requirements: '<10s alert time; works offline; verified owner ID.',
      design: 'Single big LOST button; map of nearby helpers; AirTag-style cards.',
      integrations: 'Twilio, Mapbox, Apple/Google location, microchip APIs.',
      production: 'iOS/Android RN app; serverless backend; Postgres + PostGIS.',
    },
  },
  biotech: {
    name: 'Refrane', industry: 'Biotech',
    tagline: 'Rapid sepsis triage at the bedside, before the lab gets a result.',
    seeds: {
      worldImpact: 'Lower sepsis mortality; reduced over-prescription of antibiotics.',
      exit: 'Strategic acquisition by a diagnostics major (BD, Roche).',
      sectorMapping: 'Hospital labs, ICU clinicians, infection-control teams, payer policy.',
      competitiveMarket: 'Procalcitonin; Cytovale IntelliSep; Inflammatix HostDx.',
      marketExpansion: 'Outpatient triage; antimicrobial stewardship adjuncts.',
      company: 'Regulated medtech; ~80 ppl by clearance; clinical & regulatory heavy.',
      businessModel: 'Per-test reagent + lease-style instrument placement.',
      customerSegment: 'ED clinicians at urban level-1 trauma centers (US).',
      solution: '<15-min point-of-care host-response panel from a finger-prick.',
      problem: 'Sepsis dx is delayed by 4–6h vs. lab; mortality climbs 8%/h.',
      painScale: 'Requirement — sepsis bundles are CMS-tracked quality metrics.',
      product: 'Cartridge-based reader, single-use 4-marker panel.',
      requirements: 'CLIA-waived path; <15min TAT; integrate with EHR.',
      design: 'Reader the size of a glucometer; bedside cart compatible.',
      integrations: 'Epic ADT/orders, FHIR, CLIA workflow.',
      production: 'Microfluidic chip mfg; ISO 13485 line; reagent cold chain.',
    },
  },
  hardware: {
    name: 'PetFinder', industry: 'Hardware',
    tagline: 'Reunite lost dogs with their owners in the first golden 24 hours.',
    seeds: {},
  },
  fintech: {
    name: 'PetFinder', industry: 'Fintech',
    tagline: 'Reunite lost dogs with their owners in the first golden 24 hours.',
    seeds: {},
  },
};

// ── Stack states (empty / midCPF / nearPSF) ──
type StateOverride = (industry: Industry) => Record<string, { text: string; src: string }>;

const STATE_OVERRIDES: Record<StackState, StateOverride> = {
  empty: () => ({}),
  midCPF: (industry) => {
    const seeds = VENTURE[industry].seeds;
    return {
      worldImpact:       { text: seeds.worldImpact,       src: 'logical' },
      exit:              { text: seeds.exit,              src: 'logical' },
      sectorMapping:     { text: seeds.sectorMapping,     src: 'experience' },
      competitiveMarket: { text: seeds.competitiveMarket, src: 'research' },
      company:           { text: seeds.company,           src: 'logical' },
      businessModel:     { text: seeds.businessModel,     src: 'experience' },
      customerSegment:   { text: seeds.customerSegment,   src: 'experience' },
      solution:          { text: seeds.solution,          src: 'logical' },
      problem:           { text: seeds.problem,           src: 'research' },
      painScale:         { text: seeds.painScale,         src: 'research' },
      product:           { text: seeds.product,           src: 'experience' },
      requirements:      { text: seeds.requirements,      src: 'logical' },
      design:            { text: seeds.design,            src: 'logical' },
    };
  },
  nearPSF: (industry) => {
    const seeds = VENTURE[industry].seeds;
    return {
      worldImpact:       { text: seeds.worldImpact,       src: 'logical' },
      exit:              { text: seeds.exit,              src: 'experience' },
      sectorMapping:     { text: seeds.sectorMapping,     src: 'research' },
      competitiveMarket: { text: seeds.competitiveMarket, src: 'research' },
      marketExpansion:   { text: seeds.marketExpansion,   src: 'experience' },
      company:           { text: seeds.company,           src: 'experience' },
      businessModel:     { text: seeds.businessModel,     src: 'interviews' },
      customerSegment:   { text: seeds.customerSegment,   src: 'interviews' },
      solution:          { text: seeds.solution,          src: 'interviews' },
      problem:           { text: seeds.problem,           src: 'interviews' },
      painScale:         { text: seeds.painScale,         src: 'interviews' },
      product:           { text: seeds.product,           src: 'research' },
      requirements:      { text: seeds.requirements,      src: 'experience' },
      design:            { text: seeds.design,            src: 'interviews' },
      integrations:      { text: seeds.integrations,      src: 'experience' },
      production:        { text: seeds.production,        src: 'experience' },
    };
  },
};

export function pkBuildStack(industry: Industry, state: StackState): Stack {
  const base = (STATE_OVERRIDES[state] || STATE_OVERRIDES.midCPF)(industry);
  const out: Stack = {};
  for (const L of PK_LAYERS) {
    const cell = base[L.id];
    if (cell) out[L.id] = { ...cell, tier: pkTier(L.id, cell.src) };
  }
  return out;
}

export function pkFilledCount(stack: Stack): number {
  return Object.values(stack).filter((c) => c.text).length;
}
