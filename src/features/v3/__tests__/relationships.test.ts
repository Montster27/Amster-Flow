import { describe, expect, it } from 'vitest';
import { LAYER_RELATIONSHIPS, relationsFor } from '../lib/relationships';
import { PK_LAYERS, PK_LAYER_BY_ID } from '../lib/layers';

describe('layer relationships (Questions Up & Down graph)', () => {
  it('gives every one of the 16 layers at least one up-or-down move', () => {
    for (const L of PK_LAYERS) {
      const rel = relationsFor(L.id);
      const hasMove = Boolean(rel.up || rel.down);
      expect(hasMove, `${L.id} has no up/down relation`).toBe(true);
    }
  });

  it('only points at real layer ids, and never at itself', () => {
    for (const [layerId, rel] of Object.entries(LAYER_RELATIONSHIPS)) {
      for (const r of [rel.up, rel.down]) {
        if (!r) continue;
        expect(PK_LAYER_BY_ID[r.layer], `${layerId} → ${r.layer}`).toBeTruthy();
        expect(r.layer).not.toBe(layerId);
        expect(r.prompt.length).toBeGreaterThan(0);
      }
      for (const id of rel.related ?? []) expect(PK_LAYER_BY_ID[id]).toBeTruthy();
    }
  });

  it('preserves the brief\'s seed prompts', () => {
    expect(relationsFor('solution').up?.layer).toBe('problem');
    expect(relationsFor('problem').down?.layer).toBe('customerSegment');
    expect(relationsFor('product').up?.layer).toBe('solution');
    expect(relationsFor('requirements').down?.layer).toBe('design');
    expect(relationsFor('businessModel').down?.layer).toBe('customerSegment');
    expect(relationsFor('design').up?.layer).toBe('requirements');
  });

  it('returns an empty object for an unknown layer', () => {
    expect(relationsFor('nope')).toEqual({});
  });
});
