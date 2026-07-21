// Controlled vocabulary + display-label maps (Findings 9, 12).
//
// These are display-only mappings: the assertions here guard that every stored
// AssumptionState still has a founder-facing label, without any state value
// being renamed.

import { describe, expect, it } from 'vitest';
import {
  ASSUMPTION_STATUS_DISPLAY, ASSUMPTION_STATUS_COLORS, assumptionStatusLabel,
  effortLevel, sampleSizeLabel, miniProcessSampleUnit, miniProcessMethods,
  ACRONYMS, WHOLE_VENTURE_LABEL,
} from '../lib/copy';
import type { AssumptionState } from '../lib/assumptions';
import { MINI_PROCESS_CATALOG } from '../lib/miniProcesses';

const ALL_STATES: AssumptionState[] = [
  'queued', 'active', 'validated', 'refined', 'killed', 'dismissed',
];

describe('assumption status display labels', () => {
  it('maps every stored state to a neutral, founder-facing label', () => {
    expect(ALL_STATES.map(assumptionStatusLabel)).toEqual([
      'Needs testing', // queued
      'Needs testing', // active
      'Supported',     // validated
      'Revised',       // refined
      'Closed',        // killed
      'Closed',        // dismissed
    ]);
  });

  it('never surfaces the raw internal state word as the label', () => {
    for (const s of ALL_STATES) {
      expect(assumptionStatusLabel(s).toLowerCase()).not.toBe(s);
    }
  });

  it('gives every state a description and a resolvable colour tone', () => {
    for (const s of ALL_STATES) {
      const d = ASSUMPTION_STATUS_DISPLAY[s];
      expect(d.description.length).toBeGreaterThan(0);
      expect(ASSUMPTION_STATUS_COLORS[d.tone]).toBeDefined();
    }
  });

  it('keeps the two terminal states distinguishable even though both read "Closed"', () => {
    // Documented limitation: no separate "disproven" state exists in the schema,
    // so the distinction lives in the description rather than the label.
    expect(ASSUMPTION_STATUS_DISPLAY.killed.label)
      .toBe(ASSUMPTION_STATUS_DISPLAY.dismissed.label);
    expect(ASSUMPTION_STATUS_DISPLAY.killed.description)
      .not.toBe(ASSUMPTION_STATUS_DISPLAY.dismissed.description);
  });

  it('names the no-layer case "Whole venture"', () => {
    expect(WHOLE_VENTURE_LABEL).toBe('Whole venture');
  });
});

describe('mini-process presentation helpers', () => {
  it('bands effort by time estimate', () => {
    expect(effortLevel(60)).toBe('Light');
    expect(effortLevel(90)).toBe('Light');
    expect(effortLevel(120)).toBe('Moderate');
    expect(effortLevel(180)).toBe('Moderate');
    expect(effortLevel(240)).toBe('Significant');
    expect(effortLevel(480)).toBe('Significant');
  });

  it('states sample size in words rather than n= notation', () => {
    expect(sampleSizeLabel(5, 'participants')).toBe('5 participants');
    expect(sampleSizeLabel(10, miniProcessSampleUnit('wtp_test'))).toBe('10 respondents');
    expect(sampleSizeLabel(1, miniProcessSampleUnit('paid_pilot'))).toBe('1 signed agreement');
  });

  it('gives every catalog entry a sample unit and a defined effort level', () => {
    for (const def of MINI_PROCESS_CATALOG) {
      expect(miniProcessSampleUnit(def.kind)).toBeTruthy();
      expect(['Light', 'Moderate', 'Significant']).toContain(effortLevel(def.timeEstimateMinutes));
    }
  });

  it('expands specialist research methods in plain language', () => {
    expect(miniProcessMethods('wtp_test')[0].term).toBe('Van Westendorp test');
    expect(miniProcessMethods('wtp_test')[0].definition).toMatch(/price-sensitivity/i);
    expect(miniProcessMethods('switch_interviews')[0].term).toBe('Switch interview');
    expect(miniProcessMethods('paid_pilot')[0].term).toBe('Letter of intent (LOI)');
    expect(miniProcessMethods('prototype_test')).toEqual([]);
  });
});

describe('acronyms', () => {
  it('carries the expanded term for each stage gate acronym', () => {
    expect(ACRONYMS.CPF.full).toBe('Customer–Problem Fit');
    expect(ACRONYMS.PSF.full).toBe('Problem–Solution Fit');
    expect(ACRONYMS.BMV.full).toBe('Business Model Viability');
    for (const key of Object.keys(ACRONYMS)) {
      expect(ACRONYMS[key].definition).toContain(ACRONYMS[key].full);
    }
  });
});
