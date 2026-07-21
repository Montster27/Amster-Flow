// Assumption Stack clarity (Finding 9) + controlled vocabulary (Finding 12).
//
// Covers the first-use explanation, the labelled empty-state example, the
// display-label mapping over the unchanged internal states, "Whole venture" vs
// a linked layer, and linked-layer navigation into Questions Up & Down.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  venture: {
    project_id: 'proj-1', industry_variant: 'software', evaluator: 'investor',
    door_choice: 'B', intensity: 'direct', has_completed_onboarding: true,
  } as Record<string, unknown>,
  assumptions: [] as Record<string, unknown>[],
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => h.navigate, useParams: () => ({ projectId: 'proj-1' }) };
});

vi.mock('../lib/storage', () => ({
  ensureVenture: vi.fn(async () => h.venture),
  fetchVenture: vi.fn(async () => h.venture),
  updateVenture: vi.fn(async () => h.venture),
  fetchLayerStack: vi.fn(async () => []),
  upsertLayerState: vi.fn(async () => ({})),
  fetchAssumptions: vi.fn(async () => h.assumptions),
  insertAssumption: vi.fn(),
  updateAssumption: vi.fn(),
  deleteAssumption: vi.fn(),
  insertAssumptionsIgnoringDuplicates: vi.fn(async () => []),
  logAuditEvent: vi.fn(),
}));

import AssumptionsPage from '../pages/AssumptionsPage';

function assumption(over: Record<string, unknown> = {}) {
  return {
    id: 'a-1', project_id: 'proj-1',
    source_layer_id: 'painScale', cross_source_layer_id: null,
    assumption_text: 'Vets will pay $80/mo.', notes: null,
    channel: 'direct', state: 'active', source_value: null, rule_id: null,
    mini_process_run_id: null,
    created_at: '2026-01-01', created_by: null, updated_at: '2026-01-01', resolved_at: null,
    ...over,
  };
}

async function renderPage() {
  render(<AssumptionsPage />);
  await screen.findByText('Assumption stack');
}

describe('AssumptionsPage — explaining the stack (Finding 9)', () => {
  beforeEach(() => {
    h.assumptions.length = 0;
    h.navigate.mockClear();
    window.localStorage.clear();
  });

  it('explains what an assumption is and shows the three-step lifecycle', async () => {
    await renderPage();
    expect(screen.getByText(/Assumptions are beliefs that still need evidence/)).toBeInTheDocument();
    expect(screen.getByText('Capture what you currently believe.')).toBeInTheDocument();
    expect(screen.getByText('Test it with evidence or a mini-process.')).toBeInTheDocument();
    expect(screen.getByText('Validate it, revise it, or resolve it.')).toBeInTheDocument();
  });

  it('empty state gives useful copy plus a clearly labelled, non-interactive example', async () => {
    await renderPage();
    expect(screen.getByText(/No assumptions yet\. Add something important that you believe but have not proven\./))
      .toBeInTheDocument();

    const example = screen.getByLabelText('Example assumption');
    expect(example).toBeInTheDocument();
    // Marked "Example" so it can't be mistaken for saved data...
    expect(screen.getByText('Example')).toBeInTheDocument();
    // ...and it carries the affected layer, status and suggested next step.
    expect(example).toHaveTextContent('Independent founders will pay monthly for structured venture guidance.');
    expect(example).toHaveTextContent('Business Model');
    expect(example).toHaveTextContent('Needs testing');
    expect(example).toHaveTextContent('Willingness-to-Pay test');
    // Non-interactive: the example contains no controls.
    expect(example.querySelectorAll('button')).toHaveLength(0);
  });

  it('uses the approved vocabulary, not the old jargon', async () => {
    await renderPage();
    expect(screen.getByText('Add an assumption')).toBeInTheDocument();
    expect(screen.getByLabelText('What does this assumption affect?')).toBeInTheDocument();

    expect(screen.queryByText(/Direct authoring/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free-floating/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/anchor layer/i)).not.toBeInTheDocument();
  });

  it('offers "Whole venture" as the no-layer option on the affects selector', async () => {
    await renderPage();
    const select = screen.getByLabelText('What does this assumption affect?') as HTMLSelectElement;
    expect([...select.options].map((o) => o.text)).toContain('Whole venture');
  });
});

describe('AssumptionsPage — display labels over unchanged internal states', () => {
  beforeEach(() => {
    h.assumptions.length = 0;
    h.navigate.mockClear();
    window.localStorage.clear();
  });

  it.each([
    ['queued', 'Needs testing'],
    ['active', 'Needs testing'],
    ['validated', 'Supported'],
    ['refined', 'Revised'],
    ['killed', 'Closed'],
    ['dismissed', 'Closed'],
  ])('renders stored state %s as "%s"', async (state, label) => {
    h.assumptions.push(assumption({ state }));
    await renderPage();
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('never shows the raw internal state words to the founder', async () => {
    h.assumptions.push(assumption({ state: 'killed' }));
    await renderPage();
    await screen.findByText('Closed');
    expect(screen.queryByText('killed')).not.toBeInTheDocument();
    expect(screen.queryByText('validated')).not.toBeInTheDocument();
  });

  it('labels an assumption with no linked layer as "Whole venture"', async () => {
    h.assumptions.push(assumption({ source_layer_id: null }));
    await renderPage();
    // "Whole venture" also names the selector option, so assert the card itself
    // (a non-<option> node) carries the label.
    const matches = await screen.findAllByText('Whole venture');
    expect(matches.some((el) => el.tagName !== 'OPTION')).toBe(true);
  });
});

describe('AssumptionsPage — linked layer and suggested test', () => {
  beforeEach(() => {
    h.assumptions.length = 0;
    h.navigate.mockClear();
    window.localStorage.clear();
  });

  it('clicking the linked layer opens that layer in Questions Up & Down', async () => {
    const user = userEvent.setup();
    h.assumptions.push(assumption({ source_layer_id: 'painScale' }));
    await renderPage();

    const link = await screen.findByRole('button', {
      name: /Linked layer Pain Scale — open in Questions Up & Down/,
    });
    await user.click(link);

    // The workspace reads its focused layer from this per-project key.
    expect(window.localStorage.getItem('pk.v3.qud.layer.proj-1')).toBe('painScale');
    expect(h.navigate).toHaveBeenCalledWith('/v3/door-b/proj-1');
  });

  it('suggests a mini-process and offers "View process" (not "Start")', async () => {
    const user = userEvent.setup();
    h.assumptions.push(assumption({ source_layer_id: 'painScale' }));
    await renderPage();

    expect(await screen.findByText(/Suggested way to test this:/)).toBeInTheDocument();
    const view = screen.getByRole('button', { name: 'View process: Willingness-to-Pay test' });
    expect(screen.queryByRole('button', { name: /^Start/ })).not.toBeInTheDocument();

    await user.click(view);
    // Opens the read-only preview — no run is created from the assumption card.
    expect(h.navigate).toHaveBeenCalledWith('/v3/mini-process/proj-1?preview=wtp_test');
  });
});
