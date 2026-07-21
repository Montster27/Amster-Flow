import { describe, expect, it } from 'vitest';
import {
  PERSPECTIVES, PERSPECTIVE_BY_ID, perspectiveHighlights,
  perspectiveGuidance, perspectiveIsActive, type Perspective,
} from '../lib/perspectives';
import { PK_LAYER_BY_ID } from '../lib/layers';

const EXPECTED: Record<Exclude<Perspective, 'all'>, string[]> = {
  investor: ['customerSegment', 'problem', 'painScale', 'competitiveMarket', 'solution', 'product', 'businessModel'],
  designer: ['customerSegment', 'problem', 'painScale', 'solution', 'product', 'requirements', 'design', 'integrations'],
  'product-delivery': ['product', 'requirements', 'design', 'integrations', 'production', 'businessModel', 'company'],
};

describe('perspectives config', () => {
  it('exposes the four perspectives including the renamed Product & Delivery', () => {
    expect(PERSPECTIVES.map((p) => p.id)).toEqual(['all', 'investor', 'designer', 'product-delivery']);
    expect(PERSPECTIVE_BY_ID['product-delivery'].label).toBe('Product & Delivery');
  });

  it('matches the brief highlight sets exactly', () => {
    for (const [id, layers] of Object.entries(EXPECTED)) {
      expect([...PERSPECTIVE_BY_ID[id as Perspective].highlight].sort())
        .toEqual([...layers].sort());
    }
  });

  it('only references real layer ids in highlight sets', () => {
    for (const p of PERSPECTIVES) {
      for (const id of p.highlight) expect(PK_LAYER_BY_ID[id]).toBeTruthy();
    }
  });

  it('"all" highlights nothing and is not active', () => {
    expect(perspectiveIsActive('all')).toBe(false);
    expect(perspectiveHighlights('all', 'customerSegment')).toBe(false);
    expect(perspectiveGuidance('all', 'customerSegment')).toBeNull();
  });

  it('highlights and explains layers a role foregrounds, and stays quiet elsewhere', () => {
    expect(perspectiveHighlights('investor', 'businessModel')).toBe(true);
    expect(perspectiveGuidance('investor', 'businessModel')).toMatch(/Investors will expect strong evidence/);
    // requirements is a designer layer, not an investor one
    expect(perspectiveHighlights('investor', 'requirements')).toBe(false);
    expect(perspectiveGuidance('investor', 'requirements')).toBeNull();
    expect(perspectiveGuidance('designer', 'design')).toMatch(/Design decisions depend heavily/);
    expect(perspectiveIsActive('designer')).toBe(true);
  });
});
