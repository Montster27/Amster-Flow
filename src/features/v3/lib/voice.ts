// Mentor voice content store + lookup.
//
// Brief non-negotiable #4: voice strings are DATA, not code. They live in
// this file (later: a JSON sidecar or CMS) keyed by surface, layer, source,
// star_threshold, intensity, evaluator. Lookup falls back gracefully — a
// missing investor-specific string falls back to universal evaluator, etc.
//
// Authoring: edit the literals here. The lookup helpers below take care of
// fallbacks; components should never reach into the raw maps directly.

import type { Evaluator, Intensity } from './layers';

export interface OpeningCopy {
  kicker: string;
  title: string;
  lede: string;
  body: string[];
  closer: string;
}

export const OPENING: Readonly<Record<Intensity, OpeningCopy>> = Object.freeze({
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
    // Sprint 3 T9 — eyebrow intentionally blank. The page title commands
    // attention on its own; "READ THIS" was redundant pressure.
    kicker: '',
    // v3 usability step 1 — the old "No skipping." title contradicted the
    // guided flow, which lets founders jump ahead and return. Lead with the
    // honesty ask instead; the sequence-vs-jump wording now lives (non-
    // contradictorily) in the Door A guided intro.
    title: 'Start honest.',
    lede: 'You think you have an idea. You probably have an assumption stack with three honest data points and a lot of hope.',
    body: [
      "This tool exists because 95% of teams I've mentored skipped the parts that mattered. The 5% who didn't pivoted early or killed bad ideas fast.",
      "I'm going to ask you what you know and how you know it. The stars come from how, not what.",
      "If that bothers you, this isn't the tool.",
    ],
    closer: 'Otherwise — pick a door.',
  },
});

// ── Pushback content ──
//
// Indexed by layer, then by current tier (0-4). Tier-5 layers don't get
// pushback — they've cleared. Each entry is a specific, action-named move,
// not a generic "go talk to customers".

interface PushbackEntry {
  /** Universal default — used when no evaluator override exists. */
  universal: string;
  investor?: string;
  customer?: string;
  grant?: string;
  advisor?: string;
}

type PushbackByLayer = Record<string, Record<number, PushbackEntry>>;

const PUSHBACK: Readonly<PushbackByLayer> = Object.freeze({
  customerSegment: {
    0: { universal: "Empty means no customer. Action: write a Beachhead Brief — ten named individuals at named companies, with their job title, the budget line this comes out of, and the trigger event that puts them in-market. If you can't fill ten rows, your segment isn't a segment yet." },
    1: { universal: "'Logical' segments collapse on contact. Action: run five switch-interviews — find people who recently picked a substitute and reconstruct the moment of struggle in their words. That gives you the cohort's real boundary, not your imagined one." },
    2: { universal: "Your past experience picked a different segment in a different decade. Action: do a Personas-of-One pass — three named users, full life-cycle of the workflow, with the artifacts they touch and the people they have to convince. Generic personas don't fundraise." },
    3: { universal: "Industry reports describe the addressable market. They don't locate the beachhead. Action: a Next-10-Customers test — pick ten real names you can email this week and predict who buys, who declines, and why. Then make the calls." },
  },
  problem: {
    0: { universal: "No problem stated means you're selling a feature. Action: write a Problem Statement that names (a) the trigger event, (b) the workaround being used today, (c) the cost of that workaround in dollars or hours. Three sentences. If you can't, the problem isn't formed." },
    1: { universal: "Logic isn't lived experience. Action: run five Mom-Test interviews — past-tense, specific, non-leading. The deliverable is a transcript page where the customer narrates a struggle without you naming your solution." },
    2: { universal: "One person's pain isn't a market. Action: a Frequency-and-Severity survey of 50 people in the segment — how often does this happen, what does it cost them, how do they cope. The distribution is the evidence, not the median." },
    3: { universal: "Research describes that the problem exists somewhere. Action: a Job-Story Map for one named workflow — every decision, hand-off and tool involved. That's where the friction actually sits, and it's usually not where the white paper said." },
  },
  painScale: {
    0: { universal: "No rating means 'Annoyance' until proven otherwise. Action: a Severity Test — ten interviews where the customer ranks this against their other current pains. If it's not in their top-3, you're building a vitamin, not a painkiller." },
    1: { universal: "Self-rated pain is unreliable. Action: a Willingness-to-Pay test — Van Westendorp price-sensitivity meter or a smoke test landing page with a real-money pre-order button. The number that matters is the one they'd pay, not the one they'd say." },
    2: { universal: "Anecdotes inflate severity. Action: count switching cost — how much the customer is currently spending in time, money or risk on workarounds. If switching cost > your price by 3×, the pain is real. If not, it isn't." },
    3: { universal: "Research can't score the pain in this cohort. Action: a paid pilot or LOI — one signed agreement at a real price. One name with money attached moves the room more than any survey.",
        grant: "Grant committees want a population-level signal. Action: a published prevalence/severity figure for your cohort, plus a letter of need from one named operator at the partner site. Anecdote + denominator." },
  },
  solution: {
    0: { universal: "No solution means there's nothing to test. Action: a Solution Sketch — one page, the user flow in five steps, before any code. Show three people in the segment, listen for the part they don't believe." },
    1: { universal: "On paper any solution works. Action: a Wizard-of-Oz pilot — deliver the outcome by hand for one week, with three customers. You'll learn what the actual product needs to do, not what you assumed." },
    2: { universal: "Past patterns don't transfer cleanly. Action: a Concierge MVP — full-service the first five customers manually. The thing you keep doing is the product. The thing you stop doing was a feature." },
    3: { universal: "Research suggests a shape; a prototype proves it. Action: a head-to-head usability test against the leading alternative, on the same task. If yours doesn't win on time-to-outcome, you don't have a solution yet." },
  },
  product: {
    0: { universal: "Empty product field means you're selling vibes. Action: write a one-page Spec — primary user, primary verb, success criterion in measurable units. If you can't write the success metric, the product isn't scoped." },
    1: { universal: "Logical product = wishlist. Action: a Cut List — rank features by which is critical for the first paying customer. Anything outside the top three is v2. Investors care about what you said no to." },
    2: { universal: "Your taste is a hypothesis. Action: a clickable prototype with five segment users, measured on completion time and SUS (System Usability Scale ≥ 70 is the bar). Bring the numbers, not the screenshots." },
    3: { universal: "Reports describe the category. Action: a four-week beta with ten users measured on D7 retention. Below 30% means you have a demo, not a product." },
  },
  competitiveMarket: {
    0: { universal: "Empty competitive map looks naïve. Action: a 2-Degree Sector Map — direct, indirect and DIY workarounds, and the players two hops out (suppliers, distributors, regulators). \"No competition\" is the most expensive line in your deck." },
    1: { universal: "'Logical' competition omits the workaround. Action: a Job-Switcher Audit — five customers who tried a competitor and stopped, five who built it themselves, five who do nothing. The 'do nothing' bucket is your real competition." },
    2: { universal: "Your experience is a decade out of date. Action: a fresh Win/Loss study — call ten prospects who picked a competitor in the last 12 months, ten who picked you (or a stand-in), and document the deciding criterion in their words." },
    3: { universal: "Reports list competitors; they don't score the head-to-head. Action: a benchmarking bake-off on the top-3 use cases against the leader, blind-tested with five segment users. That's the slide that wins the meeting." },
  },
  businessModel: {
    0: { universal: "No model means we're funding a hobby. Action: a one-page Unit Economics sheet — price, gross margin, CAC, payback period, retention. If any cell is 'TBD', the model isn't a model." },
    1: { universal: "Logical pricing is a guess. Action: a price ladder test — three price points, ten prospects each, signed LOIs at one of them. The price you can collect signatures at is your price." },
    2: { universal: "Last company's economics don't carry over. Action: a CAC-channel test — $1k of paid spend on the two most promising channels, measured to qualified pipeline. Channel economics are the company." },
    3: { universal: "Research models the market; pilots model the company. Action: one paid pilot at a target-segment price, with the procurement path documented end-to-end. If you can't tell the cheque's journey, you don't have a business model." },
  },
});

/**
 * Look up pushback for a (layer, tier, evaluator). Falls back from
 * evaluator-specific → universal. Returns null if there's no entry (which
 * is correct for tier 4-5 layers — they've cleared the bar).
 */
export function lookupPushback(
  layerId: string,
  tier: number,
  evaluator: Evaluator,
): string | null {
  const layer = PUSHBACK[layerId];
  if (!layer) return null;
  const entry = layer[tier];
  if (!entry) return null;
  return entry[evaluator] ?? entry.universal ?? null;
}

/**
 * Build a list of pushback callouts across the stack, sorted by tier ascending
 * (lowest tier = most pressure first). Useful for "the dashboard's heat strip".
 */
export function pushbackOver(
  stack: Record<string, { source_value?: string | null } | undefined>,
  evaluator: Evaluator,
  tierFor: (layerId: string, src?: string | null) => number,
): Array<{ layerId: string; tier: number; line: string }> {
  const out: Array<{ layerId: string; tier: number; line: string }> = [];
  for (const layerId of Object.keys(PUSHBACK)) {
    const t = tierFor(layerId, stack[layerId]?.source_value);
    const line = lookupPushback(layerId, t, evaluator);
    if (line) out.push({ layerId, tier: t, line });
  }
  return out.sort((a, b) => a.tier - b.tier);
}

// ── Step-level voice (Door A L8.1–L10.4) ──
//
// Keyed by step id (matches the ids the step state machine uses). Body is a
// single paragraph the founder reads on entry to that step. Kept as data so
// content can move to a CMS later without code changes.

export type StepId =
  | 'l8.1' | 'l8.2' | 'l8.3' | 'l8.4'
  | 'l9.1' | 'l9.2' | 'l9.3' | 'l9.4'
  | 'l10.1' | 'l10.2' | 'l10.3' | 'l10.4';

export const STEP_VOICE: Readonly<Record<StepId, string>> = Object.freeze({
  'l8.1': "This is the part most founders skip. You picked the first group you thought of in the shower. Force yourself to list five. The third and fourth are usually the most interesting.",
  'l8.2': "'18–40 year olds' is a category. '18–23 year olds I can reach on campus' is a beachhead. The channel you have access to is itself a way to narrow — not a check you do at the end.",
  'l8.3': "You're ranking sub-groups by how much pain they have, how easy they are to reach, and how big they are. We weight pain heaviest because a painless market is a hobby, and reachability second because an unreachable market is a dream. Size is third because founders systematically overweight it.",
  'l8.4': "The instinct is to pick the biggest market. The right move is the most acute pain you can actually reach. Big markets are where you end up; tiny desperate groups you can put your hands on are where you start.",
  'l9.1': "'Small business owners struggle with onboarding' is a category, not a problem statement. What does the founder of a 6-person consulting firm in Austin actually do on Monday morning that makes onboarding suck for them?",
  'l9.2': "Everybody rates their problem Critical the first time. About one in twenty actually has a Critical problem. If you say Critical, the next thing this tool is going to ask you to do is talk to five people in your beachhead who'll tell you whether you're right.",
  'l9.3': "Describe the solution specifically for this beachhead. The assumption queue is listening — every claim you make here that starts with 'they will' or 'users want' becomes something Discovery has to prove.",
  'l9.4': "I can save you five minutes, but it takes you four minutes to learn how. That's the kind of math that kills products. The benefit has to be obviously bigger than the cost, in the user's head, in the first 30 seconds. Otherwise they don't switch.",
  'l10.1': "Every customer is a consumer eventually. The question is how many people are between you and them. Every link takes a margin and has an opinion about your price. The further left you sit, the more people have to agree before you make a sale.",
  'l10.2': "These numbers are starting estimates, not gospel. Every margin you see here is something you need to verify. Industries vary wildly, and the only way to know is to ask someone in the chain. Add the ones you accepted to your Discovery list.",
  'l10.3': "Don't get clever yet. Pick the model your industry uses by default. If 90% of your space is subscription, your job is not to be the snowflake — your job is to be subscription that's better. Snowflake business models are a third pivot, not a first one.",
  'l10.4': "The most common competitor is 'they live with it.' If your beachhead's current answer is to suck it up and complain, your job is not to beat a competitor — it's to convince them the suck is solvable. Different problem.",
});

// ── Specific in-step warnings ──

export const STEP_WARNING: Readonly<Record<string, string>> = Object.freeze({
  'l9.4.close_call': "Close-call benefits almost never drive switching. Humans don't make small upgrades — they make obvious ones or they stay put. If your honest answer is close call, you have two choices: strengthen the solution until the benefit is obvious, or find a sub-group where the same solution is a clear win because their pain is bigger.",
  'l10.1.direct_b2c': "Most B2B products have intermediate links. Sure you're direct to consumer? You can always come back.",
});

export function lookupStepVoice(stepId: StepId): string {
  return STEP_VOICE[stepId];
}

export function lookupStepWarning(key: string): string | null {
  return STEP_WARNING[key] ?? null;
}

// ── numberWord ──
//
// Spells out 0-10 ("zero", "one", … "ten"); falls back to the digit string for
// 11+. Lowercase so it can slot into mid-sentence templates. Shared with
// dashboard state-line copy.
export function numberWord(n: number): string {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return n >= 0 && n <= 10 ? words[n] : String(n);
}

// ── L8.1 reactive copy (dynamic count) ──
//
// The "few groups" warning needs to name the actual count the founder has
// listed. Pre-Sprint-3 this was a static string that always said "two";
// S3-T1 fixed that to read from the live list length.
export function fewGroupsWarning(n: number): string {
  return `You listed ${numberWord(n)}. That's the shower-thought answer. Most of the interesting beachheads are hiding in the third, fourth, and fifth group you'd think of. Want to try a couple more?`;
}

// MONTY REVIEW — line below is provisional Sprint 3 copy (S3-T2). Direct voice;
// fires once when the founder crosses 5 groups on L8.1 and then yields back to
// the static voice card. Replace verbatim if Monty rewrites.
export function fiveGroupsAck(): string {
  return 'Good. Five is enough to score. The third and fourth are usually the ones you didn\'t expect.';
}
