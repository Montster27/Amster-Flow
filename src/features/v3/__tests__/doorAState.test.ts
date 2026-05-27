// Tests for the Door A state pure helpers.
// Pins down score math, beachhead ranking, chain depth, close-call detection,
// and the defensive hydrate() merge so a refactor can't silently drift them.

import { describe, expect, it } from 'vitest';
import {
  SCORE_MAX, SCORE_MIN,
  chainDepth, computeBeachheadScore, emptyDoorAState,
  extractAssumptions, findEdge, hydrate, isCloseCall, nodesOrdered,
  normalizedScore, topRankedSubgroup,
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
  it('produces a v=1 blob with the locked endpoint chain', () => {
    const s = emptyDoorAState();
    expect(s.v).toBe(1);
    expect(s.optionSpace).toEqual([]);
    expect(s.subgroups).toEqual([]);
    expect(s.beachheadId).toBeNull();
    expect(s.l10.chain.nodes).toHaveLength(2);
    expect(s.l10.chain.nodes[0]).toMatchObject({ id: 'n-you', locked: true, position: 0 });
    expect(s.l10.chain.nodes[1]).toMatchObject({ id: 'n-end', locked: true, position: 1 });
    expect(s.l10.chain.edges).toEqual([{ fromNodeId: 'n-you', toNodeId: 'n-end' }]);
  });
});

describe('hydrate', () => {
  it('returns a fresh empty state for null / non-object input', () => {
    expect(hydrate(null).v).toBe(1);
    expect(hydrate(undefined).v).toBe(1);
    expect(hydrate('string').optionSpace).toEqual([]);
    expect(hydrate(42).subgroups).toEqual([]);
  });

  it('fills in missing keys defensively', () => {
    const partial = { optionSpace: [{ id: 'p1', name: 'consults' }] };
    const out = hydrate(partial);
    expect(out.optionSpace).toEqual(partial.optionSpace);
    expect(out.l9.problemRestated).toBe('');
    expect(out.l10.chain.nodes).toHaveLength(2);
    expect(out.l10.margins.priceUnits).toBeNull();
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
});
