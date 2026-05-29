// Voice content lookup — focus on the graceful-fallback behaviour described in
// voice.ts: evaluator-specific pushback falls back to the universal string, and
// missing layers/tiers resolve to null (correct for cleared layers).

import { describe, expect, it } from 'vitest';
import {
  lookupPushback,
  pushbackOver,
  lookupStepVoice,
  lookupStepWarning,
  numberWord,
} from '../lib/voice';

describe('lookupPushback — evaluator → universal fallback', () => {
  // painScale tier 3 is the one entry in the catalog with BOTH a universal and
  // an evaluator-specific (grant) override — the ideal fallback fixture.
  it('returns the evaluator-specific override when one exists', () => {
    const grant = lookupPushback('painScale', 3, 'grant');
    expect(grant).toContain('Grant committees');
  });

  it('falls back to the universal string when the evaluator has no override', () => {
    const universal = lookupPushback('painScale', 3, 'investor');
    expect(universal).toContain('paid pilot or LOI');
    expect(universal).not.toContain('Grant committees');
  });

  it('resolves every evaluator without an override to the SAME universal string', () => {
    const investor = lookupPushback('painScale', 3, 'investor');
    const customer = lookupPushback('painScale', 3, 'customer');
    const advisor = lookupPushback('painScale', 3, 'advisor');
    expect(customer).toBe(investor);
    expect(advisor).toBe(investor);
    // …and the grant override is genuinely different from that universal.
    expect(lookupPushback('painScale', 3, 'grant')).not.toBe(investor);
  });

  it('returns the universal string for a layer/tier that has no overrides at all', () => {
    // customerSegment tier 0 only defines `universal`.
    const a = lookupPushback('customerSegment', 0, 'grant');
    const b = lookupPushback('customerSegment', 0, 'investor');
    expect(a).toBe(b);
    expect(a).toContain('Beachhead Brief');
  });

  it('returns null for an unknown layer', () => {
    expect(lookupPushback('definitelyNotALayer', 0, 'investor')).toBeNull();
  });

  it('returns null for a tier with no entry (a cleared layer)', () => {
    // customerSegment only defines tiers 0–3; tiers 4–5 have cleared the bar.
    expect(lookupPushback('customerSegment', 4, 'investor')).toBeNull();
    expect(lookupPushback('customerSegment', 5, 'grant')).toBeNull();
  });
});

describe('pushbackOver — sort ascending + skip cleared layers', () => {
  it('emits only layers with an entry, sorted by tier ascending', () => {
    // tierFor stub: businessModel=0, customerSegment=3, everything else cleared (5).
    const tierFor = (layerId: string): number =>
      layerId === 'businessModel' ? 0 : layerId === 'customerSegment' ? 3 : 5;
    const out = pushbackOver({}, 'investor', tierFor);

    expect(out.map((o) => o.layerId)).toEqual(['businessModel', 'customerSegment']);
    expect(out.map((o) => o.tier)).toEqual([0, 3]);
    expect(out[0].line.length).toBeGreaterThan(0);
  });
});

describe('lookupStepVoice / lookupStepWarning', () => {
  it('returns the step copy for a known step id', () => {
    expect(lookupStepVoice('l10.1')).toContain('Every customer is a consumer eventually');
  });

  it('returns the warning for a known key and null otherwise', () => {
    expect(lookupStepWarning('l9.4.close_call')).toContain('Close-call');
    expect(lookupStepWarning('no.such.warning')).toBeNull();
  });
});

describe('numberWord — spelled 0–10, digit fallback otherwise', () => {
  it('spells 0 through 10', () => {
    expect(numberWord(0)).toBe('zero');
    expect(numberWord(5)).toBe('five');
    expect(numberWord(10)).toBe('ten');
  });

  it('falls back to the digit string outside 0–10', () => {
    expect(numberWord(11)).toBe('11');
    expect(numberWord(100)).toBe('100');
    expect(numberWord(-1)).toBe('-1');
  });
});
