// Tests for the Door A state pure helpers.
// Pins down score math, beachhead ranking, chain depth, close-call detection,
// and the defensive hydrate() merge so a refactor can't silently drift them.

import { describe, expect, it } from 'vitest';
import {
  MAX_PAINS, SCORE_MAX, SCORE_MIN,
  addPain, beachheadSegmentLabel, chainDepth, computeBeachheadScore, deletePain, editPain,
  emptyDoorAState, emptyRoute,
  extractAssumptions, findEdge, getPainById, getPains, getPrimaryPain, getSolutionRow, hydrate,
  isCloseCall,
  makeDefaultChain, nodesOrdered, normalizedScore, painLabel, painLayerEvidenceStar,
  promotePrimary, setSolutionRow, solutionLayerClaim, stepHasDraft,
  topRankedSubgroup,
  type SubGroup, type ValueChain,
} from '../lib/doorAState';

const sg = (overrides: Partial<SubGroup> = {}): SubGroup => ({
  id: 's', parentGroupId: 'p', name: 'sub', pain: null, reachability: null, size: null,
  ...overrides,
});

describe('computeBeachheadScore', () => {
  it('returns null when any axis is missing', () => {
    expect(computeBeachheadScore(sg({ pain: 'critical', reachability: 'know-personally' })))
      .toBeNull();
    expect(computeBeachheadScore(sg({ pain: 'critical', size: 'real-market' })))
      .toBeNull();
    expect(computeBeachheadScore(sg({ reachability: 'know-personally', size: 'tiny-niche' })))
      .toBeNull();
  });

  it('returns 6 for the lowest-rated sub-group', () => {
    const s = sg({ pain: 'nice-to-have', reachability: 'no-idea', size: 'tiny-niche' });
    expect(computeBeachheadScore(s)).toBe(SCORE_MIN);
    expect(SCORE_MIN).toBe(6);
  });

  it('returns 18 for the highest-rated sub-group', () => {
    const s = sg({ pain: 'critical', reachability: 'know-personally', size: 'large-market' });
    expect(computeBeachheadScore(s)).toBe(SCORE_MAX);
    expect(SCORE_MAX).toBe(18);
  });

  it('weights pain × 3, reach × 2, size × 1', () => {
    // ADHD unmedicated (worked example, my best inference):
    // pain critical (3) → 9, reach know-personally (3) → 6, size real-market (2) → 2 = 17
    const adhd = sg({ pain: 'critical', reachability: 'know-personally', size: 'real-market' });
    expect(computeBeachheadScore(adhd)).toBe(17);

    // IC engineers (worked example):
    // pain useful (2) → 6, reach no-idea (1) → 2, size large-market (3) → 3 = 11
    const ic = sg({ pain: 'useful', reachability: 'no-idea', size: 'large-market' });
    expect(computeBeachheadScore(ic)).toBe(11);

    // Mid-size agencies (worked example):
    // pain nice-to-have (1) → 3, reach specific-channel (2) → 4, size real-market (2) → 2 = 9
    const agencies = sg({ pain: 'nice-to-have', reachability: 'specific-channel', size: 'real-market' });
    expect(computeBeachheadScore(agencies)).toBe(9);
  });
});

describe('normalizedScore', () => {
  it('is 0 when raw is null', () => {
    expect(normalizedScore(null)).toBe(0);
  });
  it('is 0 at SCORE_MIN', () => {
    expect(normalizedScore(SCORE_MIN)).toBe(0);
  });
  it('is 1 at SCORE_MAX', () => {
    expect(normalizedScore(SCORE_MAX)).toBe(1);
  });
  it('is 0.5 at the midpoint', () => {
    expect(normalizedScore(SCORE_MIN + (SCORE_MAX - SCORE_MIN) / 2)).toBe(0.5);
  });
});

describe('topRankedSubgroup', () => {
  it('returns null when no sub-group has a score', () => {
    expect(topRankedSubgroup([sg({}), sg({ id: 's2' })])).toBeNull();
  });

  it('returns the highest-scored sub-group', () => {
    const low = sg({ id: 's-low', pain: 'useful', reachability: 'no-idea', size: 'tiny-niche' });
    const high = sg({ id: 's-high', pain: 'critical', reachability: 'know-personally', size: 'real-market' });
    expect(topRankedSubgroup([low, high])).toBe(high);
  });

  it('breaks ties by earliest position in the array', () => {
    const a = sg({ id: 'a', pain: 'critical', reachability: 'know-personally', size: 'real-market' });
    const b = sg({ id: 'b', pain: 'critical', reachability: 'know-personally', size: 'real-market' });
    expect(topRankedSubgroup([a, b])).toBe(a);
  });

  it('skips sub-groups missing any axis', () => {
    const partial = sg({ id: 'p', pain: 'critical', reachability: 'know-personally' });
    const complete = sg({ id: 'c', pain: 'useful', reachability: 'no-idea', size: 'tiny-niche' });
    expect(topRankedSubgroup([partial, complete])).toBe(complete);
  });
});

describe('chainDepth', () => {
  const chain = (n: number): ValueChain => ({
    nodes: Array.from({ length: n }).map((_, i) => ({
      id: `n${i}`, label: `${i}`, role: 'maker', position: i,
      locked: i === 0 || i === n - 1,
    })),
    edges: [],
  });

  it('is 0 for a direct B2C chain (You → End user)', () => {
    expect(chainDepth(chain(2))).toBe(0);
  });
  it('is 1 for a single-intermediary chain', () => {
    expect(chainDepth(chain(3))).toBe(1);
  });
  it('is 4 for a deep-B2B chain', () => {
    expect(chainDepth(chain(6))).toBe(4);
  });
  it('never goes negative', () => {
    expect(chainDepth({ nodes: [], edges: [] })).toBe(0);
  });
});

describe('nodesOrdered', () => {
  it('returns nodes sorted by position ascending', () => {
    const c: ValueChain = {
      nodes: [
        { id: 'c', label: 'c', role: 'retailer',    position: 2, locked: true },
        { id: 'a', label: 'a', role: 'maker',       position: 0, locked: true },
        { id: 'b', label: 'b', role: 'distributor', position: 1, locked: false },
      ],
      edges: [],
    };
    expect(nodesOrdered(c).map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('findEdge', () => {
  const c: ValueChain = {
    nodes: [],
    edges: [
      { fromNodeId: 'a', toNodeId: 'b', notes: 'flow' },
      { fromNodeId: 'b', toNodeId: 'c' },
    ],
  };
  it('finds an edge by endpoints', () => {
    expect(findEdge(c, 'a', 'b')?.notes).toBe('flow');
  });
  it('returns undefined when no match', () => {
    expect(findEdge(c, 'a', 'c')).toBeUndefined();
  });
});

describe('isCloseCall', () => {
  it('is true only when verdict === "close-call"', () => {
    expect(isCloseCall({ verdict: 'close-call' })).toBe(true);
    expect(isCloseCall({ verdict: 'clearly-worth-it' })).toBe(false);
    expect(isCloseCall({ verdict: 'probably-worth-it' })).toBe(false);
    expect(isCloseCall({ verdict: null })).toBe(false);
  });
});

describe('extractAssumptions', () => {
  it('returns an empty list for empty or whitespace text', () => {
    expect(extractAssumptions('')).toEqual([]);
    expect(extractAssumptions('   ')).toEqual([]);
  });

  it('splits on . ! ? and trims', () => {
    const out = extractAssumptions('First sentence here. Second sentence! Third? Tiny.');
    // "Tiny." is 5 chars after trim — under the 12-char floor, dropped.
    expect(out).toEqual([
      'First sentence here.',
      'Second sentence!',
    ]);
  });

  it('caps at 4 candidates', () => {
    const text = 'One long sentence here. Two long sentence here. Three long sentence here. Four long sentence here. Five long sentence here. Six long sentence here.';
    expect(extractAssumptions(text)).toHaveLength(4);
  });

  it('drops sentences shorter than 12 chars', () => {
    expect(extractAssumptions('Yes. Whatever long thing comes next.')).toEqual([
      'Whatever long thing comes next.',
    ]);
  });
});

describe('emptyDoorAState', () => {
  it('produces a v=2 blob with one primary route and the locked endpoint chain', () => {
    const s = emptyDoorAState();
    expect(s.v).toBe(2);
    expect(s.optionSpace).toEqual([]);
    expect(s.subgroups).toEqual([]);
    expect(s.beachheadId).toBeNull();
    expect(s.l10.routes).toHaveLength(1);
    const chain = s.l10.routes[0].chain;
    expect(chain.nodes).toHaveLength(2);
    expect(chain.nodes[0]).toMatchObject({ id: 'n-you', locked: true, position: 0 });
    expect(chain.nodes[1]).toMatchObject({ id: 'n-end', locked: true, position: 1 });
    expect(chain.edges).toEqual([{ fromNodeId: 'n-you', toNodeId: 'n-end' }]);
    expect(s.l10.routes[0].margins).toEqual({ priceUnits: null, estimates: [] });
  });
});

describe('makeDefaultChain / emptyRoute', () => {
  it('makeDefaultChain is a direct You → End user chain', () => {
    const c = makeDefaultChain();
    expect(c.nodes.map((n) => n.id)).toEqual(['n-you', 'n-end']);
    expect(chainDepth(c)).toBe(0);
  });

  it('emptyRoute wraps a default chain with empty margins under the given id/label', () => {
    const r = emptyRoute('route-x', 'Via distributor');
    expect(r.id).toBe('route-x');
    expect(r.label).toBe('Via distributor');
    expect(r.chain.nodes).toHaveLength(2);
    expect(r.margins).toEqual({ priceUnits: null, estimates: [] });
  });
});

describe('stepHasDraft', () => {
  it('is false on a fresh empty state for every sub-step', () => {
    const s = emptyDoorAState();
    const ids = ['l8.1','l8.2','l8.3','l8.4','l9.1','l9.2','l9.3','l9.4','l10.1','l10.2','l10.3','l10.4'];
    for (const id of ids) expect(stepHasDraft(id, s)).toBe(false);
  });

  it('l8.1 flips true when optionSpace has at least one parent group', () => {
    const s = emptyDoorAState();
    expect(stepHasDraft('l8.1', s)).toBe(false);
    s.optionSpace = [{ id: 'p1', name: 'consults' }];
    expect(stepHasDraft('l8.1', s)).toBe(true);
  });

  it('l8.3 flips true only when at least one sub-group has all three axes scored', () => {
    const s = emptyDoorAState();
    s.subgroups = [{
      id: 's1', parentGroupId: 'p1', name: 'partial',
      pain: 'critical', reachability: null, size: null,
    }];
    expect(stepHasDraft('l8.3', s)).toBe(false);
    s.subgroups[0].reachability = 'know-personally';
    s.subgroups[0].size = 'real-market';
    expect(stepHasDraft('l8.3', s)).toBe(true);
  });

  it('l9.2 reflects pain text in the L11 pains model (not legacy painRating)', () => {
    const s = emptyDoorAState();
    expect(stepHasDraft('l9.2', s)).toBe(false);
    // A pain with no text yet still reads as "not started".
    expect(stepHasDraft('l9.2', addPain(s, { text: '', severity: 'med', evidenceStar: 1 }))).toBe(false);
    // Once any pain carries text, the step is in progress.
    expect(stepHasDraft('l9.2', addPain(s, { text: 'deploys take 40 min', severity: 'high', evidenceStar: 2 }))).toBe(true);
    // Legacy painRating alone no longer drives the draft state — pain now lives in pains[].
    const legacyOnly = emptyDoorAState();
    legacyOnly.l9.painRating = 'critical';
    expect(stepHasDraft('l9.2', legacyOnly)).toBe(false);
  });

  it('l9.3 reflects either the optional summary or any filled solution row', () => {
    const s = emptyDoorAState();
    expect(stepHasDraft('l9.3', s)).toBe(false);
    // Summary alone marks it in progress.
    expect(stepHasDraft('l9.3', { ...s, l9: { ...s.l9, solution: 'a one-liner' } })).toBe(true);
    // A filled solution row also marks it in progress (no summary needed).
    let withRow = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    withRow = setSolutionRow(withRow, withRow.pains[0].id, { solutionText: 'ship faster' });
    expect(stepHasDraft('l9.3', withRow)).toBe(true);
    // An evidence-only row (no solution text) does NOT mark it in progress.
    let emptyRow = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    emptyRow = setSolutionRow(emptyRow, emptyRow.pains[0].id, { evidenceStar: 5 });
    expect(stepHasDraft('l9.3', emptyRow)).toBe(false);
  });

  it('l10.1 ignores the locked endpoint nodes and the default empty edge', () => {
    // Fresh state has 2 endpoint nodes + 1 empty edge — must read as no draft.
    expect(stepHasDraft('l10.1', emptyDoorAState())).toBe(false);
  });

  it('l10.1 flips true when the founder adds an edge note', () => {
    const s = emptyDoorAState();
    s.l10.routes[0].chain.edges[0].notes = 'license $1.20/unit';
    expect(stepHasDraft('l10.1', s)).toBe(true);
  });

  it('l10.1 flips true once there is more than one route', () => {
    const s = emptyDoorAState();
    s.l10.routes.push(emptyRoute('route-2', 'Route 2'));
    expect(stepHasDraft('l10.1', s)).toBe(true);
  });

  it('l10.2 flips true when any route has a price or a markup estimate', () => {
    const s = emptyDoorAState();
    expect(stepHasDraft('l10.2', s)).toBe(false);
    s.l10.routes[0].margins.priceUnits = 9.99;
    expect(stepHasDraft('l10.2', s)).toBe(true);
  });

  it('l10.3 flips true on either business-model selection or other-text', () => {
    const s = emptyDoorAState();
    s.l10.businessModelOther = 'tip jar';
    expect(stepHasDraft('l10.3', s)).toBe(true);
  });

  it('returns false for an unknown step id', () => {
    expect(stepHasDraft('l99.9', emptyDoorAState())).toBe(false);
  });
});

describe('hydrate', () => {
  it('returns a fresh empty state for null / non-object input', () => {
    expect(hydrate(null).v).toBe(2);
    expect(hydrate(undefined).v).toBe(2);
    expect(hydrate('string').optionSpace).toEqual([]);
    expect(hydrate(42).subgroups).toEqual([]);
  });

  it('fills in missing keys defensively', () => {
    const partial = { optionSpace: [{ id: 'p1', name: 'consults' }] };
    const out = hydrate(partial);
    expect(out.optionSpace).toEqual(partial.optionSpace);
    expect(out.l9.problemRestated).toBe('');
    expect(out.l10.routes).toHaveLength(1);
    expect(out.l10.routes[0].chain.nodes).toHaveLength(2);
    expect(out.l10.routes[0].margins.priceUnits).toBeNull();
  });

  it('preserves valid existing l9 / l10 sub-fields', () => {
    const blob = {
      l9: { painRating: 'critical', solution: 'something' },
      l10: { businessModelIds: ['subscription'] },
    };
    const out = hydrate(blob);
    expect(out.l9.painRating).toBe('critical');
    expect(out.l9.solution).toBe('something');
    expect(out.l10.businessModelIds).toEqual(['subscription']);
  });

  it('migrates a legacy single { chain, margins } L10 into one primary route', () => {
    const legacyChain = {
      nodes: [
        { id: 'n-you', label: 'You', role: 'maker', position: 0, locked: true },
        { id: 'n-mid', label: 'Distributor', role: 'distributor', position: 1, locked: false },
        { id: 'n-end', label: 'End user', role: 'end-user', position: 2, locked: true },
      ],
      edges: [
        { fromNodeId: 'n-you', toNodeId: 'n-mid', notes: '$1.20/unit' },
        { fromNodeId: 'n-mid', toNodeId: 'n-end' },
      ],
    };
    const out = hydrate({
      l10: {
        chain: legacyChain,
        margins: {
          priceUnits: 9.99,
          estimates: [{ fromNodeId: 'n-you', toNodeId: 'n-mid', markupPct: 15, fromDefault: false }],
        },
        businessModelIds: ['subscription'],
      },
    });
    expect(out.l10.routes).toHaveLength(1);
    expect(out.l10.routes[0].id).toBe('route-1');
    expect(out.l10.routes[0].chain).toEqual(legacyChain);
    expect(out.l10.routes[0].margins.priceUnits).toBe(9.99);
    expect(out.l10.routes[0].margins.estimates).toHaveLength(1);
    expect(out.l10.businessModelIds).toEqual(['subscription']);
  });

  it('round-trips a multi-route L10 blob intact', () => {
    const blob = {
      l10: {
        routes: [
          emptyRoute('route-1', 'Direct'),
          {
            id: 'route-2', label: 'Via distributor',
            chain: makeDefaultChain(),
            margins: { priceUnits: 5, estimates: [] },
          },
        ],
        businessModelIds: [],
        businessModelOther: '',
        competitors: [],
      },
    };
    const out = hydrate(blob);
    expect(out.l10.routes.map((r) => r.label)).toEqual(['Direct', 'Via distributor']);
    expect(out.l10.routes[1].margins.priceUnits).toBe(5);
  });
});

// ── Pains: stable multi-pain model ──

/** Three pains on a fresh state: a (primary), b, c. */
const threePains = () => {
  let s = emptyDoorAState();
  s = addPain(s, { text: 'a', severity: 'high', evidenceStar: 1 });
  s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
  s = addPain(s, { text: 'c', severity: 'low', evidenceStar: 3 });
  return s;
};

describe('addPain', () => {
  it('adds the first pain as the sole primary at order 0', () => {
    const s = addPain(emptyDoorAState(), { text: 'slow onboarding', severity: 'high', evidenceStar: 3 });
    expect(s.pains).toHaveLength(1);
    const [p] = s.pains;
    expect(p).toMatchObject({ text: 'slow onboarding', severity: 'high', evidenceStar: 3, isPrimary: true, order: 0 });
    expect(p.id).toMatch(/^pain_/);
    expect(Number.isNaN(Date.parse(p.createdAt))).toBe(false);
  });

  it('mints a distinct id for each pain', () => {
    let s = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
    expect(s.pains[0].id).not.toBe(s.pains[1].id);
  });

  it('leaves the existing primary in place and appends contiguous orders', () => {
    const s = threePains();
    const primaryId = s.pains[0].id;
    expect(s.pains.filter((p) => p.isPrimary)).toHaveLength(1);
    expect(getPrimaryPain(s)?.id).toBe(primaryId);
    expect(s.pains.map((p) => p.order)).toEqual([0, 1, 2]);
  });

  it('rejects a 4th pain (MAX_PAINS = 3)', () => {
    expect(MAX_PAINS).toBe(3);
    expect(() => addPain(threePains(), { text: 'd', severity: 'low', evidenceStar: 1 })).toThrow();
  });
});

describe('promotePrimary', () => {
  it('moves primary to the target without touching any id or order', () => {
    const s = threePains();
    const idsBefore = s.pains.map((p) => p.id);
    const ordersBefore = s.pains.map((p) => p.order);
    const target = s.pains[2].id;
    const next = promotePrimary(s, target);
    expect(getPrimaryPain(next)?.id).toBe(target);
    expect(next.pains.filter((p) => p.isPrimary)).toHaveLength(1);
    expect(next.pains.map((p) => p.id)).toEqual(idsBefore);
    expect(next.pains.map((p) => p.order)).toEqual(ordersBefore);
  });

  it('throws on an unknown id', () => {
    expect(() => promotePrimary(threePains(), 'pain_nope')).toThrow();
  });

  it('is idempotent on the current primary', () => {
    const s = threePains();
    const cur = getPrimaryPain(s)!.id;
    const next = promotePrimary(s, cur);
    expect(getPrimaryPain(next)?.id).toBe(cur);
    expect(next.pains.filter((p) => p.isPrimary)).toHaveLength(1);
  });
});

describe('deletePain', () => {
  it('refuses to delete the last remaining pain', () => {
    const s = addPain(emptyDoorAState(), { text: 'only', severity: 'high', evidenceStar: 1 });
    expect(() => deletePain(s, s.pains[0].id)).toThrow();
  });

  it('refuses to delete the primary while others exist', () => {
    const s = threePains();
    expect(() => deletePain(s, getPrimaryPain(s)!.id)).toThrow();
  });

  it('deletes a non-primary pain and renumbers orders contiguously', () => {
    const s = threePains(); // [a*, b, c]
    const middle = s.pains[1].id;
    const next = deletePain(s, middle);
    expect(next.pains).toHaveLength(2);
    expect(getPainById(next, middle)).toBeUndefined();
    expect(next.pains.map((p) => p.order)).toEqual([0, 1]);
  });

  it('allows deleting the old primary once another is promoted', () => {
    const s = threePains();
    const oldPrimary = getPrimaryPain(s)!.id;
    const other = s.pains[1].id;
    const next = deletePain(promotePrimary(s, other), oldPrimary);
    expect(getPainById(next, oldPrimary)).toBeUndefined();
    expect(getPrimaryPain(next)?.id).toBe(other);
    expect(next.pains.map((p) => p.order)).toEqual([0, 1]);
  });

  it('throws on an unknown id', () => {
    expect(() => deletePain(threePains(), 'pain_nope')).toThrow();
  });
});

describe('pain selectors', () => {
  it('getPains returns pains sorted by order regardless of array order', () => {
    let s = threePains();
    s = { ...s, pains: [s.pains[2], s.pains[0], s.pains[1]] }; // scramble
    expect(getPains(s).map((p) => p.order)).toEqual([0, 1, 2]);
    expect(getPains(s).map((p) => p.text)).toEqual(['a', 'b', 'c']);
  });

  it('getPrimaryPain is null on an empty collection', () => {
    expect(getPrimaryPain(emptyDoorAState())).toBeNull();
  });

  it('getPainById finds by id and returns undefined for a miss', () => {
    const s = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    expect(getPainById(s, s.pains[0].id)?.text).toBe('a');
    expect(getPainById(s, 'pain_missing')).toBeUndefined();
  });
});

describe('painLabel', () => {
  it('computes PAIN-1/2/3 from order (1-based, render-time only)', () => {
    expect(painLabel({ order: 0 })).toBe('PAIN-1');
    expect(painLabel({ order: 1 })).toBe('PAIN-2');
    expect(painLabel({ order: 2 })).toBe('PAIN-3');
  });
});

describe('hydrate — pains migration', () => {
  it('migrates a legacy single L9 pain into one primary pain', () => {
    const out = hydrate({ l9: { painRating: 'critical', painJustification: 'Deploys take 40 minutes' } });
    expect(out.pains).toHaveLength(1);
    const [p] = out.pains;
    expect(p).toMatchObject({
      text: 'Deploys take 40 minutes', severity: 'high', evidenceStar: 1, isPrimary: true, order: 0,
    });
    expect(p.id).toMatch(/^pain_/);
  });

  it('maps severity from the legacy pain rating', () => {
    expect(hydrate({ l9: { painRating: 'useful', painJustification: 'x' } }).pains[0].severity).toBe('med');
    expect(hydrate({ l9: { painRating: 'nice-to-have', painJustification: 'x' } }).pains[0].severity).toBe('low');
  });

  it('migrates on a rating alone, even with no justification text', () => {
    const out = hydrate({ l9: { painRating: 'critical' } });
    expect(out.pains).toHaveLength(1);
    expect(out.pains[0]).toMatchObject({ text: '', severity: 'high', isPrimary: true });
  });

  it('mints a STABLE id for the migrated pain across repeated hydrates', () => {
    const blob = { l9: { painRating: 'critical', painJustification: 'p' } };
    expect(hydrate(blob).pains[0].id).toBe(hydrate(blob).pains[0].id);
  });

  it('produces no pains when the founder never recorded one', () => {
    expect(hydrate({ l9: { problemRestated: 'just a problem' } }).pains).toEqual([]);
    expect(hydrate(null).pains).toEqual([]);
    expect(hydrate({}).pains).toEqual([]);
  });

  it('round-trips an existing pains array, healing order and primary', () => {
    const blob = {
      pains: [
        { id: 'pain_b', text: 'b', severity: 'med', evidenceStar: 2, isPrimary: false, order: 5, createdAt: 'x' },
        { id: 'pain_a', text: 'a', severity: 'high', evidenceStar: 4, isPrimary: false, order: 2, createdAt: 'x' },
      ],
    };
    const out = hydrate(blob);
    // Renumbered contiguously by stored order; primary healed to the lowest-order pain.
    expect(out.pains.map((p) => [p.id, p.order])).toEqual([['pain_a', 0], ['pain_b', 1]]);
    expect(out.pains.filter((p) => p.isPrimary).map((p) => p.id)).toEqual(['pain_a']);
  });

  it('keeps the explicit primary when the array already has exactly one', () => {
    const blob = {
      pains: [
        { id: 'pain_a', text: 'a', severity: 'high', evidenceStar: 1, isPrimary: false, order: 0, createdAt: 'x' },
        { id: 'pain_b', text: 'b', severity: 'low', evidenceStar: 1, isPrimary: true, order: 1, createdAt: 'x' },
      ],
    };
    expect(getPrimaryPain(hydrate(blob))?.id).toBe('pain_b');
  });

  it('drops pain records lacking a string id (id is the identity)', () => {
    const blob = {
      pains: [
        { text: 'no id', severity: 'high', evidenceStar: 1, isPrimary: true, order: 0, createdAt: 'x' },
        { id: 'pain_ok', text: 'ok', severity: 'low', evidenceStar: 1, isPrimary: false, order: 1, createdAt: 'x' },
      ],
    };
    const out = hydrate(blob);
    expect(out.pains.map((p) => p.id)).toEqual(['pain_ok']);
    expect(getPrimaryPain(out)?.id).toBe('pain_ok'); // primary healed onto the survivor
  });

  it('prefers an existing pains array over the legacy single-pain fields', () => {
    const blob = {
      pains: [{ id: 'pain_x', text: 'new', severity: 'low', evidenceStar: 2, isPrimary: true, order: 0, createdAt: 'x' }],
      l9: { painRating: 'critical', painJustification: 'old' },
    };
    expect(hydrate(blob).pains.map((p) => p.id)).toEqual(['pain_x']);
  });
});

// ── editPain (field edits flow through a Sprint 1 mutator) ──

describe('editPain', () => {
  it('patches text / severity / evidenceStar without touching identity fields', () => {
    const s = threePains();
    const target = s.pains[1];
    const next = editPain(s, target.id, { text: 'edited', severity: 'high', evidenceStar: 5 });
    const p = getPainById(next, target.id)!;
    expect(p).toMatchObject({ text: 'edited', severity: 'high', evidenceStar: 5 });
    // id / order / primary / createdAt are never touched by an edit.
    expect(p.id).toBe(target.id);
    expect(p.order).toBe(target.order);
    expect(p.isPrimary).toBe(target.isPrimary);
    expect(p.createdAt).toBe(target.createdAt);
  });

  it('patches a single field and leaves the others as they were', () => {
    const s = threePains();
    const target = s.pains[0];
    const next = editPain(s, target.id, { evidenceStar: 4 });
    const p = getPainById(next, target.id)!;
    expect(p.evidenceStar).toBe(4);
    expect(p.text).toBe(target.text);
    expect(p.severity).toBe(target.severity);
  });

  it('leaves the other pains untouched (same refs)', () => {
    const s = threePains();
    const next = editPain(s, s.pains[0].id, { text: 'x' });
    expect(next.pains[1]).toBe(s.pains[1]);
    expect(next.pains[2]).toBe(s.pains[2]);
  });

  it('throws on an unknown id', () => {
    expect(() => editPain(threePains(), 'pain_nope', { text: 'x' })).toThrow();
  });
});

// ── painLayerEvidenceStar (L11 roll-up = MIN evidence across all pains) ──

describe('painLayerEvidenceStar', () => {
  it('is 0 for an empty collection (no pains → no stars yet)', () => {
    expect(painLayerEvidenceStar(emptyDoorAState())).toBe(0);
  });

  it('is the single pain\'s star when there is exactly one pain', () => {
    const s = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 4 });
    expect(painLayerEvidenceStar(s)).toBe(4);
  });

  it('takes the MIN across all pains — the weakest pain sets the layer star', () => {
    let s = emptyDoorAState();
    s = addPain(s, { text: 'a', severity: 'high', evidenceStar: 5 });
    s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
    s = addPain(s, { text: 'c', severity: 'low', evidenceStar: 3 });
    expect(painLayerEvidenceStar(s)).toBe(2);
  });

  it('a strong primary does not mask a weak secondary', () => {
    let s = addPain(emptyDoorAState(), { text: 'primary', severity: 'high', evidenceStar: 5 });
    s = addPain(s, { text: 'weak secondary', severity: 'low', evidenceStar: 1 });
    expect(getPrimaryPain(s)?.evidenceStar).toBe(5);
    expect(painLayerEvidenceStar(s)).toBe(1);
  });

  it('reflects an edit that raises the weakest pain', () => {
    let s = threePains(); // stars 1, 2, 3 → min 1
    expect(painLayerEvidenceStar(s)).toBe(1);
    s = editPain(s, s.pains[0].id, { evidenceStar: 4 });
    s = editPain(s, s.pains[1].id, { evidenceStar: 5 });
    s = editPain(s, s.pains[2].id, { evidenceStar: 5 });
    expect(painLayerEvidenceStar(s)).toBe(4); // weakest is now the primary at ★4
  });
});

// ── L09 solution rows: setSolutionRow / getSolutionRow ──

describe('setSolutionRow', () => {
  it('creates a row on first touch, defaulting the untouched field', () => {
    const s0 = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    const id = s0.pains[0].id;
    const s1 = setSolutionRow(s0, id, { solutionText: 'ship faster' });
    expect(s1.solutionRows).toEqual([{ painId: id, solutionText: 'ship faster', evidenceStar: 1 }]);
  });

  it('patches an existing row in place without duplicating it', () => {
    const s0 = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    const id = s0.pains[0].id;
    let s = setSolutionRow(s0, id, { solutionText: 'v1' });
    s = setSolutionRow(s, id, { solutionText: 'v2', evidenceStar: 4 });
    expect(s.solutionRows).toHaveLength(1);
    expect(getSolutionRow(s, id)).toEqual({ painId: id, solutionText: 'v2', evidenceStar: 4 });
  });

  it('never mutates the painId and leaves the other rows as they were (same ref)', () => {
    let s = emptyDoorAState();
    s = addPain(s, { text: 'a', severity: 'high', evidenceStar: 1 });
    s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
    const [pa, pb] = s.pains;
    s = setSolutionRow(s, pa.id, { solutionText: 'A' });
    s = setSolutionRow(s, pb.id, { solutionText: 'B' });
    const paRowBefore = getSolutionRow(s, pa.id)!;
    const after = setSolutionRow(s, pb.id, { solutionText: 'B2' });
    expect(getSolutionRow(after, pa.id)).toBe(paRowBefore); // untouched row keeps its ref
    expect(getSolutionRow(after, pb.id)).toEqual({ painId: pb.id, solutionText: 'B2', evidenceStar: 1 });
  });

  it('throws on an unknown pain id', () => {
    expect(() => setSolutionRow(emptyDoorAState(), 'pain_nope', { solutionText: 'x' })).toThrow();
  });
});

describe('getSolutionRow', () => {
  it('returns the row for a pain and undefined for a miss', () => {
    const s0 = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    const id = s0.pains[0].id;
    expect(getSolutionRow(s0, id)).toBeUndefined();
    const s1 = setSolutionRow(s0, id, { solutionText: 'x' });
    expect(getSolutionRow(s1, id)?.solutionText).toBe('x');
    expect(getSolutionRow(s1, 'pain_other')).toBeUndefined();
  });
});

describe('beachheadSegmentLabel', () => {
  const withSub = (name: string, locked: boolean) => {
    const s = emptyDoorAState();
    s.subgroups = [{ id: 'sg1', parentGroupId: 'p1', name, pain: null, reachability: null, size: null }];
    if (locked) s.beachheadId = 'sg1';
    return s;
  };

  it('falls back to a neutral subject when no beachhead is locked', () => {
    expect(beachheadSegmentLabel(emptyDoorAState())).toBe('This segment');
    expect(beachheadSegmentLabel(withSub('Indie iOS devs', false))).toBe('This segment');
  });

  it('returns the locked beachhead sub-group name', () => {
    expect(beachheadSegmentLabel(withSub('Indie iOS devs', true))).toBe('Indie iOS devs');
  });

  it('falls back when the locked beachhead has a blank name', () => {
    expect(beachheadSegmentLabel(withSub('   ', true))).toBe('This segment');
  });
});

describe('solutionLayerClaim', () => {
  it('prefers the optional one-line summary (trimmed)', () => {
    const s = emptyDoorAState();
    s.l9.solution = '  A one-liner.  ';
    expect(solutionLayerClaim(s)).toBe('A one-liner.');
  });

  it("falls back to the primary pain's solution when there is no summary", () => {
    let s = emptyDoorAState();
    s = addPain(s, { text: 'a', severity: 'high', evidenceStar: 1 }); // primary
    s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
    s = setSolutionRow(s, s.pains[1].id, { solutionText: 'secondary fix' });
    s = setSolutionRow(s, s.pains[0].id, { solutionText: 'primary fix' });
    expect(solutionLayerClaim(s)).toBe('primary fix');
  });

  it('falls back to the first filled row when the primary is unaddressed', () => {
    let s = emptyDoorAState();
    s = addPain(s, { text: 'a', severity: 'high', evidenceStar: 1 }); // primary, unaddressed
    s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
    s = setSolutionRow(s, s.pains[1].id, { solutionText: 'secondary fix' });
    expect(solutionLayerClaim(s)).toBe('secondary fix');
  });

  it('is empty when nothing is filled', () => {
    expect(solutionLayerClaim(emptyDoorAState())).toBe('');
  });
});

describe('hydrate — solution rows + derived assumptions', () => {
  it('seeds empty collections on a fresh / legacy / non-object blob', () => {
    expect(hydrate({}).solutionRows).toEqual([]);
    expect(hydrate({}).derivedAssumptions).toEqual([]);
    expect(hydrate(null).solutionRows).toEqual([]);
    expect(hydrate(null).derivedAssumptions).toEqual([]);
  });

  it('round-trips valid rows and drops id-less / duplicate rows, coercing bad types', () => {
    const out = hydrate({
      solutionRows: [
        { painId: 'pain_a', solutionText: 'x', evidenceStar: 3 },
        { painId: 'pain_a', solutionText: 'dupe', evidenceStar: 1 }, // duplicate painId → dropped
        { solutionText: 'no id' },                                   // no painId → dropped
        { painId: 'pain_b', solutionText: 7, evidenceStar: 9 },      // bad types → coerced to '', 1
      ],
    });
    expect(out.solutionRows).toEqual([
      { painId: 'pain_a', solutionText: 'x', evidenceStar: 3 },
      { painId: 'pain_b', solutionText: '', evidenceStar: 1 },
    ]);
  });

  it('round-trips a derived-assumption snapshot defensively', () => {
    const out = hydrate({
      derivedAssumptions: [
        { painId: 'pain_a', text: 'S will x because y.', evidenceStar: 2, needsRederive: false },
        { painId: 'pain_b', evidenceStar: 2 },        // no text → dropped
        { text: 'no painId', evidenceStar: 1 },       // no painId → dropped
      ],
    });
    expect(out.derivedAssumptions).toEqual([
      { painId: 'pain_a', text: 'S will x because y.', evidenceStar: 2, needsRederive: false },
    ]);
  });
});
