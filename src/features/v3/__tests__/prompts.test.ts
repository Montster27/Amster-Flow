// Active-prompting derivations.

import { describe, expect, it } from 'vitest';
import {
  deriveAllPrompts,
  deriveAssumptionPrompts,
  deriveGapPrompts,
  deriveStagnationPrompts,
} from '../lib/prompts';
import type { LayerStateRow, SourceId } from '../lib/layers';

const cell = (layer_id: string, source_value: SourceId | null, last_updated_at?: string): LayerStateRow =>
  ({ layer_id, claim_text: 'x', source_value, last_updated_at });

const stack = (...rows: LayerStateRow[]) =>
  Object.fromEntries(rows.map((r) => [r.layer_id, r]));

describe('deriveGapPrompts', () => {
  it('fires one prompt per gate that has a single layer one tier short', () => {
    // CPF needs customerSegment ≥ 4. Has interviews (4 — passes), problem at
    // research (3 — needs 4, gap 1), painScale at research (3, passes),
    // competitiveMarket at research (4, passes). Should fire exactly one
    // gap prompt for problem.
    const s = stack(
      cell('customerSegment',   'interviews'),
      cell('problem',           'research'),
      cell('painScale',         'research'),
      cell('competitiveMarket', 'research'),
    );
    const prompts = deriveGapPrompts(s);
    expect(prompts).toHaveLength(1);
    expect(prompts[0].layerId).toBe('problem');
    expect(prompts[0].headline).toContain('CPF');
  });

  it('does not fire when every requirement is multiple tiers short', () => {
    const s = stack(
      cell('customerSegment',   'logical'),    // tier 1, needs 4 — gap 3
      cell('problem',           'logical'),    // gap 3
    );
    expect(deriveGapPrompts(s)).toHaveLength(0);
  });

  it('does not fire on a passed gate', () => {
    const s = stack(
      cell('customerSegment',   'interviews'),
      cell('problem',           'interviews'),
      cell('painScale',         'research'),
      cell('competitiveMarket', 'research'),
    );
    expect(deriveGapPrompts(s)).toHaveLength(0);
  });
});

describe('deriveAssumptionPrompts', () => {
  it('flags critical layers at "logical" or "experience"', () => {
    const s = stack(
      cell('customerSegment', 'logical'),     // critical, fires sharp
      cell('problem',         'experience'),  // critical, fires firm
      cell('worldImpact',     'logical'),     // not critical, skip
    );
    const prompts = deriveAssumptionPrompts(s);
    expect(prompts).toHaveLength(2);
    expect(prompts.find((p) => p.layerId === 'customerSegment')?.intensity).toBe('sharp');
    expect(prompts.find((p) => p.layerId === 'problem')?.intensity).toBe('firm');
    expect(prompts.find((p) => p.layerId === 'worldImpact')).toBeUndefined();
  });

  it('does not flag layers at research+', () => {
    const s = stack(
      cell('customerSegment', 'research'),
      cell('problem',         'interviews'),
    );
    expect(deriveAssumptionPrompts(s)).toHaveLength(0);
  });
});

describe('deriveStagnationPrompts', () => {
  const days = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

  it('returns nothing under 14 days', () => {
    const rows = [cell('customerSegment', 'research', days(7))];
    expect(deriveStagnationPrompts(rows, 'cpf')).toHaveLength(0);
  });

  it('warns at 14 days', () => {
    const rows = [cell('customerSegment', 'research', days(15))];
    const p = deriveStagnationPrompts(rows, 'cpf');
    expect(p).toHaveLength(1);
    expect(p[0].intensity).toBe('subtle');
  });

  it('escalates to firm at 28 days', () => {
    const rows = [cell('customerSegment', 'research', days(30))];
    expect(deriveStagnationPrompts(rows, 'cpf')[0].intensity).toBe('firm');
  });

  it('escalates to sharp at 42 days', () => {
    const rows = [cell('customerSegment', 'research', days(50))];
    expect(deriveStagnationPrompts(rows, 'cpf')[0].intensity).toBe('sharp');
  });

  it('does not fire at BMV (brief: stagnation only pre-BMV)', () => {
    const rows = [cell('customerSegment', 'research', days(60))];
    expect(deriveStagnationPrompts(rows, 'bmv')).toHaveLength(0);
  });
});

describe('deriveAllPrompts ordering', () => {
  it('sharper-intensity prompts come first', () => {
    // logical on customerSegment fires assumption-prompt at sharp.
    // We also fab a long-stagnation date which fires sharp stagnation.
    const longAgo = new Date(Date.now() - 60 * 86400000).toISOString();
    const s = stack(cell('customerSegment', 'logical', longAgo));
    const prompts = deriveAllPrompts({
      stack: s,
      rows: Object.values(s),
      stage: 'cpf',
    });
    // First should be sharp.
    expect(prompts[0].intensity).toBe('sharp');
  });
});
