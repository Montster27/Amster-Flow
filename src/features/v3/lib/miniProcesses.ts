// Mini-process catalog. Structured validation flows, one per
// investor-critical layer. The catalog is config — adding a new flow is a
// code-side rows change, not a schema change. Per-instance progress lives
// in pivotkit_mini_process_runs.
//
// Each definition specifies its target_n, time estimate, and the source
// tier it upgrades the linked layer to on completion.

import type { SourceId } from './layers';

export interface MiniProcessDefinition {
  /** Stable identifier stored in pivotkit_mini_process_runs.kind. */
  kind: string;
  layerId: string;
  /** Title shown to the founder when launching. */
  title: string;
  /** One-line tagline. */
  tagline: string;
  /** Body copy explaining the why — Monty's voice. */
  body: string;
  targetN: number;
  timeEstimateMinutes: number;
  /** Step-by-step prompts the runner walks through. */
  steps: { title: string; prompt: string }[];
  /** Rule for completion shown to the founder. */
  definitionOfDone: string;
  /** Source value to set on the linked layer when this completes. */
  upgradeLayerSourceTo: SourceId;
}

const CATALOG: MiniProcessDefinition[] = [
  {
    kind: 'switch_interviews',
    layerId: 'customerSegment',
    title: 'Switch interviews',
    tagline: 'Find five people who recently picked a substitute and reconstruct the moment of struggle in their words.',
    body: 'A switch interview captures the actual decision boundary of your segment. You\'re not pitching — you\'re reverse-engineering how someone in your cohort hit the friction, evaluated alternatives, and chose. Five clean transcripts is the bar. The pattern that survives all five is the cohort definition you should write into Customer Segment.',
    targetN: 5,
    timeEstimateMinutes: 90,
    steps: [
      { title: 'Recruit 5 switchers',
        prompt: 'Find five people who in the last 6 months picked a substitute (or "nothing") in your space. Cold email, LinkedIn, or warm intros. Ask for 30 minutes. No pitching.' },
      { title: 'Run the past-event interview',
        prompt: 'Ask: "Walk me through the last time you faced this. What were you trying to do? What did you try first? What made you switch? Who else was involved?" Keep them in past-tense, specific events.' },
      { title: 'Capture the switch moment',
        prompt: 'For each transcript, identify the literal moment they decided to switch. Not the rationale they offer now — the trigger event. One sentence per interview.' },
      { title: 'Synthesize the boundary',
        prompt: 'Across five switch moments, what\'s shared? That\'s your beachhead boundary. Rewrite Customer Segment with that boundary, and only that boundary.' },
    ],
    definitionOfDone: '5 transcripts captured, each with a switch moment identified, synthesized into a beachhead boundary.',
    upgradeLayerSourceTo: 'interviews',
  },
  {
    kind: 'past_event_interviews',
    layerId: 'problem',
    title: 'Past-event interviews',
    tagline: 'Three Mom-Test interviews focused on a specific recent occurrence of the pain.',
    body: 'Past-event interviews are the cleanest signal for whether the problem you\'ve named is the one the customer experiences. Past-tense, specific, non-leading — you\'re asking them to narrate a struggle in their own language without naming your solution. The deliverable is a transcript page where the customer hits the friction and you didn\'t prompt it.',
    targetN: 3,
    timeEstimateMinutes: 60,
    steps: [
      { title: 'Pick a recent occurrence',
        prompt: 'Ask the customer to walk through the most recent time they hit this pain. Anchor on a specific event ("Tell me about last Tuesday when…").' },
      { title: 'Map the workaround',
        prompt: 'What did they do instead? What did it cost them in time, money, or risk? Get the workaround in their words.' },
      { title: 'Confirm the trigger',
        prompt: 'What specifically caused them to deal with this then and there? The trigger is your acquisition moment — without it you\'re competing for attention 365 days a year.' },
    ],
    definitionOfDone: '3 transcripts where the customer narrates the struggle in their own language without you naming the solution.',
    upgradeLayerSourceTo: 'interviews',
  },
  {
    kind: 'wtp_test',
    layerId: 'painScale',
    title: 'Willingness-to-Pay test',
    tagline: 'Run a Van Westendorp price-sensitivity test or a smoke-test landing page with a pre-order button.',
    body: 'Stated pain inflates. Paid pain is the truth. A WTP test gives you a dollar number you can put in front of an investor — not "they would pay," but "they did pay" or "they signed for X." Run one of two flavors: Van Westendorp surveys (10 prospects, four price questions each) or a real-money pre-order on a smoke-test page (any conversion ≥ 5% is a strong signal at this stage).',
    targetN: 10,
    timeEstimateMinutes: 240,
    steps: [
      { title: 'Pick the flavor',
        prompt: 'Van Westendorp survey (cleaner numbers, asks for hypotheticals) or a smoke-test landing page with a pre-order button (cleaner signal, harder to set up). Pick one.' },
      { title: 'Run the test',
        prompt: 'Survey: 10 prospects in the segment, four price questions: too cheap, bargain, getting expensive, too expensive. Smoke test: 200 visitors over 7 days, measure pre-order rate.' },
      { title: 'Compute the price',
        prompt: 'Survey: the optimal price is the intersection of "too cheap" and "too expensive". Smoke test: divide pre-orders by visitors. Both should land within 30% of each other if the segment is real.' },
    ],
    definitionOfDone: 'Either a Van Westendorp price band with 10 respondents, or a real-money pre-order test with ≥ 5% conversion.',
    upgradeLayerSourceTo: 'prototype',
  },
  {
    kind: 'prototype_test',
    layerId: 'solution',
    title: 'Prototype test',
    tagline: 'Build a paper or clickable prototype and capture three reactions.',
    body: 'Prototyping forces specificity. A paper sketch is enough — the goal is to put a thing in front of someone and watch them react. The reaction you\'re looking for isn\'t "I like it" — it\'s the moment they stop and ask "wait, does it do X?" That moment is the part of the spec you\'re missing. Three reactions is the bar; if all three trip on the same gap, that\'s your priority.',
    targetN: 3,
    timeEstimateMinutes: 120,
    steps: [
      { title: 'Sketch the user flow',
        prompt: 'Five steps from the user\'s entry to the outcome. Paper, Figma, or a clickable prototype. No code.' },
      { title: 'Show three segment users',
        prompt: 'In person or screen-share. Ask them to think aloud as they walk through it. Don\'t explain — let them ask.' },
      { title: 'Capture the gaps',
        prompt: 'For each user, write down the moments they hesitated, what they expected the next step to be, and what they thought the prototype was missing.' },
    ],
    definitionOfDone: '3 reactions captured, with at least one specific gap that all three users hit.',
    upgradeLayerSourceTo: 'prototype',
  },
  {
    kind: 'direct_comparison_test',
    layerId: 'competitiveMarket',
    title: 'Direct comparison test',
    tagline: 'Use 3 competitors yourself and capture structured notes on the deciding metric.',
    body: 'Competitor lists from research are a category snapshot. The bake-off is reality. Run the top three competing products yourself on the customer\'s deciding job. Time-to-outcome is the standard — whoever wins on that wins the meeting. Capture structured notes (what was easy, what was painful, where the offering broke). The output is the slide that wins the pitch.',
    targetN: 3,
    timeEstimateMinutes: 180,
    steps: [
      { title: 'Pick the deciding metric',
        prompt: 'For your customer, what does success look like in measurable units? Time-to-outcome? Accuracy? Cost? Pick the one that decides between you and the competitor.' },
      { title: 'Run the bake-off',
        prompt: 'Use each competitor on the same task with the same deciding metric. Time it. Capture friction points.' },
      { title: 'Build the head-to-head slide',
        prompt: 'One row per competitor, columns for the metric and one differentiator. The slide should be readable in 5 seconds. That\'s the slide that wins the meeting.' },
    ],
    definitionOfDone: 'Three competitors run end-to-end on the deciding task, with structured notes and a one-slide summary.',
    upgradeLayerSourceTo: 'prototype',
  },
  {
    kind: 'paid_pilot',
    layerId: 'businessModel',
    title: 'Paid pilot or LOI',
    tagline: 'Get one signed agreement at a real price.',
    body: 'A signed LOI or paid pilot is the strongest evidence the business model exists. One name with money attached moves the room more than any survey. The bar is documented procurement: a real price, a real budget line, a real signature, and the cheque\'s journey from intent to bank account written down. If you can\'t describe how the cheque actually arrives, the model isn\'t a model yet.',
    targetN: 1,
    timeEstimateMinutes: 480,
    steps: [
      { title: 'Pick a target',
        prompt: 'One named buyer in your segment who has the budget and authority to sign at the price you want to charge. Not their boss, not procurement.' },
      { title: 'Build the pilot scope',
            prompt: 'A bounded engagement: clear deliverables, clear price, clear time horizon (4-12 weeks). Anything more vague gets stuck in legal.' },
      { title: 'Document the cheque\'s journey',
        prompt: 'Walk through the procurement path: who approves, what documents are needed, what budget line it comes from, when payment lands. Write it down. That document is the evidence.' },
    ],
    definitionOfDone: 'One signed LOI or paid pilot at a real price, with the procurement path documented end-to-end.',
    upgradeLayerSourceTo: 'prototype',
  },
];

export const MINI_PROCESS_CATALOG = CATALOG;

export function findMiniProcess(kind: string): MiniProcessDefinition | undefined {
  return CATALOG.find((m) => m.kind === kind);
}

export function miniProcessesForLayer(layerId: string): MiniProcessDefinition[] {
  return CATALOG.filter((m) => m.layerId === layerId);
}

/** Default-of-done check — can be overridden per definition later. */
export function isMiniProcessDone(
  def: MiniProcessDefinition,
  progress: { completedSteps?: number[]; capturedN?: number },
): boolean {
  const stepsDone = (progress.completedSteps ?? []).length >= def.steps.length;
  const enoughCaptured = (progress.capturedN ?? 0) >= def.targetN;
  return stepsDone && enoughCaptured;
}
