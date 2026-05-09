// Active-prompting layer (engineering brief §5).
//
//   Gap prompts        — within one star of unlocking the next stage on a
//                        single layer; surface the path to close it.
//   Assumption prompts — critical layer is at "logical" or "experience";
//                        push the founder to a sourced claim.
//   Stagnation prompts — no edits in N days; escalating tone.
//
// Pure functions over the layer stack + meta (last edit timestamp).
// Suppression rules and dismissal cooldowns are out of scope here — the
// caller decides which prompts to actually display.

import { PK_GATES, PK_LAYER_BY_ID, pkTier, type LayerStateRow } from './layers';

export type PromptKind = 'gap' | 'assumption' | 'stagnation';
export type PromptIntensity = 'subtle' | 'firm' | 'sharp';

export interface ActivePrompt {
  id: string;            // stable id for dismissal/suppression keys
  kind: PromptKind;
  intensity: PromptIntensity;
  layerId?: string;
  /** Headline for the prompt (e.g. "One star from CPF on Pain Scale"). */
  headline: string;
  /** Body — Monty's voice, naming the move that closes the gap. */
  body: string;
}

/** Stagnation thresholds. Defaults from the brief; tunable per venture. */
export interface StagnationConfig {
  warmDays: number;   // 14 — gentle nudge
  firmDays: number;   // 28 — sharper
  sharpDays: number;  // 42 — pivot review trigger
}

const DEFAULT_STAGNATION: StagnationConfig = { warmDays: 14, firmDays: 28, sharpDays: 42 };

function daysSince(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

// ── Gap prompts ──────────────────────────────────────────────────
//
// Logic: for each unmet gate, find the requirement that's exactly one tier
// short. That's the "next click" — moving from research to interviews
// (or interviews to prototype) on that single layer would close it.

export function deriveGapPrompts(stack: Record<string, LayerStateRow | undefined>): ActivePrompt[] {
  const out: ActivePrompt[] = [];
  for (const G of Object.values(PK_GATES)) {
    let unmet: typeof G.reqs[number] | null = null;
    let closest: { req: typeof G.reqs[number]; gap: number } | null = null;
    for (const r of G.reqs) {
      const tier = pkTier(r.layer, stack[r.layer]?.source_value);
      const gap = r.tier - tier;
      if (gap > 0) {
        unmet = r;
        if (!closest || gap < closest.gap) closest = { req: r, gap };
      }
    }
    if (!unmet || !closest) continue;
    if (closest.gap !== 1) continue;
    const layer = PK_LAYER_BY_ID[closest.req.layer];
    if (!layer) continue;
    out.push({
      id: `gap:${G.id}:${closest.req.layer}`,
      kind: 'gap',
      intensity: 'firm',
      layerId: closest.req.layer,
      headline: `One star from ${G.short} on ${layer.name}`,
      body: `Move ${layer.name} from its current source to the next tier (e.g. interviews → prototype) and ${G.short} unlocks. Nothing else needs to move.`,
    });
  }
  return out;
}

// ── Assumption prompts ──────────────────────────────────────────────
//
// Logic: any critical-band layer with source = logical or experience is
// asking for trouble. Surface it with the layer-specific pushback voice.

export function deriveAssumptionPrompts(stack: Record<string, LayerStateRow | undefined>): ActivePrompt[] {
  const out: ActivePrompt[] = [];
  const criticalIds = ['customerSegment', 'problem', 'painScale', 'solution',
    'businessModel', 'competitiveMarket', 'product'];
  for (const id of criticalIds) {
    const cell = stack[id];
    const src = cell?.source_value;
    if (src !== 'logical' && src !== 'experience') continue;
    const layer = PK_LAYER_BY_ID[id];
    if (!layer) continue;
    out.push({
      id: `assumption:${id}`,
      kind: 'assumption',
      intensity: src === 'logical' ? 'sharp' : 'firm',
      layerId: id,
      headline: `${layer.name} is on a ${src === 'logical' ? 'logic-only' : 'past-experience'} source`,
      body: `Critical layers below research won't survive an investor meeting. Promote ${layer.name} to interviews or prototype before you pitch with it.`,
    });
  }
  return out;
}

// ── Stagnation prompts ─────────────────────────────────────────────
//
// Logic: if the most-recent layer update is older than warm/firm/sharp
// thresholds, surface a single prompt at the matching intensity. We only
// emit one stagnation prompt at a time — the highest-intensity match.

export function deriveStagnationPrompts(
  rows: LayerStateRow[],
  stage: 'cpf' | 'psf' | 'bmv' | null,
  config: StagnationConfig = DEFAULT_STAGNATION,
): ActivePrompt[] {
  if (stage === 'bmv') return []; // Brief: don't fire stagnation past BMV.
  const latestEdit = rows.reduce<number | null>((acc, r) => {
    const d = daysSince(r.last_updated_at);
    if (d == null) return acc;
    return acc == null ? d : Math.min(acc, d);
  }, null);
  if (latestEdit == null) return [];

  if (latestEdit >= config.sharpDays) {
    return [{
      id: 'stagnation:sharp',
      kind: 'stagnation',
      intensity: 'sharp',
      headline: `${latestEdit} days since the stack moved`,
      body: 'This is the pivot-review window. Either name what you\'re going to test next or kill what isn\'t working — drift is the most expensive option.',
    }];
  }
  if (latestEdit >= config.firmDays) {
    return [{
      id: 'stagnation:firm',
      kind: 'stagnation',
      intensity: 'firm',
      headline: `${latestEdit} days since the stack moved`,
      body: 'A month without an edit usually means the next move is unclear. Pick the lowest-tier critical layer and run the obvious mini-process.',
    }];
  }
  if (latestEdit >= config.warmDays) {
    return [{
      id: 'stagnation:warm',
      kind: 'stagnation',
      intensity: 'subtle',
      headline: `${latestEdit} days since the stack moved`,
      body: 'Two weeks of silence — what changed in the world that should change a layer?',
    }];
  }
  return [];
}

/** All prompts, sorted with sharper first. */
export function deriveAllPrompts(args: {
  stack: Record<string, LayerStateRow | undefined>;
  rows: LayerStateRow[];
  stage: 'cpf' | 'psf' | 'bmv' | null;
  stagnationConfig?: StagnationConfig;
}): ActivePrompt[] {
  const { stack, rows, stage, stagnationConfig } = args;
  const all = [
    ...deriveStagnationPrompts(rows, stage, stagnationConfig),
    ...deriveGapPrompts(stack),
    ...deriveAssumptionPrompts(stack),
  ];
  const order: Record<PromptIntensity, number> = { sharp: 0, firm: 1, subtle: 2 };
  return all.sort((a, b) => order[a.intensity] - order[b.intensity]);
}
