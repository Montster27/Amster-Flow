// Tests for the L09 derived-assumption helpers.
// deriveAssumption is a pure projection of (segment, pain, solution); the empty
// row → null contract is what keeps unaddressed pains out of the snapshot.
// rebuildDerivedAssumptions walks pains in stable order and drops the gaps.

import { describe, expect, it } from 'vitest';
import { deriveAssumption, rebuildDerivedAssumptions } from '../lib/deriveAssumption';
import { addPain, emptyDoorAState, setSolutionRow, type Pain } from '../lib/doorAState';

const pain = (overrides: Partial<Pain> = {}): Pain => ({
  id: 'pain_1', text: 'deploys take 40 minutes', severity: 'high', evidenceStar: 2,
  isPrimary: true, order: 0, createdAt: '1970-01-01T00:00:00.000Z', ...overrides,
});

describe('deriveAssumption', () => {
  it('builds "{segment} will {solutionText} because {pain.text}." for a filled row', () => {
    const out = deriveAssumption({
      segment: 'Indie iOS devs',
      pain: pain({ text: 'deploys take 40 minutes' }),
      solution: { solutionText: 'ship in under 5 minutes', evidenceStar: 3 },
    });
    expect(out).toEqual({
      painId: 'pain_1',
      text: 'Indie iOS devs will ship in under 5 minutes because deploys take 40 minutes.',
      evidenceStar: 3,
      needsRederive: false,
    });
  });

  it('returns null for an empty solutionText', () => {
    expect(deriveAssumption({ segment: 'S', pain: pain(), solution: { solutionText: '', evidenceStar: 1 } }))
      .toBeNull();
  });

  it('returns null for a whitespace-only solutionText', () => {
    expect(deriveAssumption({ segment: 'S', pain: pain(), solution: { solutionText: '   ', evidenceStar: 4 } }))
      .toBeNull();
  });

  it('returns null when the row is missing (undefined / null)', () => {
    expect(deriveAssumption({ segment: 'S', pain: pain(), solution: undefined })).toBeNull();
    expect(deriveAssumption({ segment: 'S', pain: pain(), solution: null })).toBeNull();
  });

  it('carries the solution row evidenceStar and the stable painId', () => {
    const out = deriveAssumption({
      segment: 'S', pain: pain({ id: 'pain_xyz' }),
      solution: { solutionText: 'do the thing', evidenceStar: 5 },
    });
    expect(out?.painId).toBe('pain_xyz');
    expect(out?.evidenceStar).toBe(5);
    expect(out?.needsRederive).toBe(false);
  });
});

describe('rebuildDerivedAssumptions', () => {
  it('produces one claim per FILLED row, in stable pain order, skipping gaps', () => {
    let s = emptyDoorAState();
    s = addPain(s, { text: 'a', severity: 'high', evidenceStar: 1 }); // primary
    s = addPain(s, { text: 'b', severity: 'med', evidenceStar: 2 });
    s = addPain(s, { text: 'c', severity: 'low', evidenceStar: 3 });
    const [pa, , pc] = s.pains;
    // Fill the first and third pains; leave the middle one unaddressed.
    s = setSolutionRow(s, pa.id, { solutionText: 'kill a', evidenceStar: 4 });
    s = setSolutionRow(s, pc.id, { solutionText: 'kill c', evidenceStar: 2 });

    const out = rebuildDerivedAssumptions(s, 'Beachhead');
    expect(out.map((d) => d.painId)).toEqual([pa.id, pc.id]); // middle gap dropped
    expect(out[0].text).toBe('Beachhead will kill a because a.');
    expect(out[1].text).toBe('Beachhead will kill c because c.');
    expect(out.map((d) => d.evidenceStar)).toEqual([4, 2]);
  });

  it('is empty when no row is filled', () => {
    let s = addPain(emptyDoorAState(), { text: 'a', severity: 'high', evidenceStar: 1 });
    s = setSolutionRow(s, s.pains[0].id, { evidenceStar: 5 }); // star but no text
    expect(rebuildDerivedAssumptions(s, 'Seg')).toEqual([]);
  });
});
