import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fixture + mocks are hoisted so the module mock can reference them.
const h = vi.hoisted(() => ({
  venture: {
    project_id: 'proj-1', industry_variant: 'software', evaluator: 'investor',
    door_choice: 'B', intensity: 'direct', has_completed_onboarding: false,
  } as Record<string, unknown>,
  rows: [
    { layer_id: 'customerSegment', project_id: 'proj-1', claim_text: 'SMB ops leads', source_value: 'interviews' },
    { layer_id: 'businessModel', project_id: 'proj-1', claim_text: 'per-seat SaaS', source_value: 'logical' },
  ] as Array<Record<string, unknown>>,
  upserts: [] as Array<Record<string, unknown>>,
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => h.navigate, useParams: () => ({ projectId: 'proj-1' }) };
});

vi.mock('../lib/storage', () => ({
  ensureVenture: vi.fn(async () => h.venture),
  fetchVenture: vi.fn(async () => h.venture),
  updateVenture: vi.fn(async (_id: string, patch: Record<string, unknown>) => ({ ...h.venture, ...patch })),
  fetchLayerStack: vi.fn(async () => h.rows),
  upsertLayerState: vi.fn(async (args: Record<string, unknown>) => {
    h.upserts.push(args);
    return { layer_id: args.layerId, project_id: args.projectId, claim_text: args.claim_text, source_value: args.source_value };
  }),
  fetchAssumptions: vi.fn(async () => []),
  insertAssumption: vi.fn(),
  updateAssumption: vi.fn(),
  deleteAssumption: vi.fn(),
  insertAssumptionsIgnoringDuplicates: vi.fn(async () => []),
  logAuditEvent: vi.fn(),
}));

import StackWorkspacePage from '../pages/StackWorkspacePage';

async function renderPage() {
  render(<StackWorkspacePage />);
  // Wait for the async venture/stack load.
  await screen.findByText(/You are here/);
}

describe('StackWorkspacePage (Questions Up & Down)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    h.upserts.length = 0;
    h.venture.door_choice = 'B';
    h.navigate.mockClear();
  });

  it('loads an existing venture and its stored answers into the focused layer', async () => {
    await renderPage();
    expect(screen.getByText('Questions Up & Down')).toBeInTheDocument();
    expect(screen.getByText('Explore your 16-layer stack')).toBeInTheDocument();
    // the focused layer name is the page's h2
    expect(screen.getByRole('heading', { name: 'Customer Segment' })).toBeInTheDocument();
    // default focus = Customer Segment, its stored claim is loaded
    expect(screen.getByText(/You are here/)).toHaveTextContent('Customer Segment');
    expect(screen.getByLabelText('Claim for Customer Segment')).toHaveValue('SMB ops leads');
  });

  it('shows exactly one recommended next move and a consistent autosave status', async () => {
    await renderPage();
    expect(screen.getAllByText('Recommended next move')).toHaveLength(1);
    expect(screen.getByText('Changes save automatically')).toBeInTheDocument();
  });

  it('switching perspective changes emphasis without touching answers or writing to the store', async () => {
    const user = userEvent.setup();
    await renderPage();
    const claim = screen.getByLabelText('Claim for Customer Segment');
    expect(claim).toHaveValue('SMB ops leads');

    await user.click(screen.getByRole('radio', { name: 'Investor' }));

    // answer unchanged, no persistence write triggered by a lens change
    expect(screen.getByLabelText('Claim for Customer Segment')).toHaveValue('SMB ops leads');
    expect(h.upserts).toHaveLength(0);
    // navigator now marks the relevant layer for the role
    expect(screen.getByRole('button', { name: /^Customer Segment\./ }).getAttribute('aria-label'))
      .toMatch(/In focus for Investor/);
  });

  it('persists the selected layer and perspective per project', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.click(screen.getByRole('radio', { name: 'Designer' }));
    await user.click(screen.getByRole('button', { name: /^Problem\./ }));

    expect(window.localStorage.getItem('pk.v3.qud.layer.proj-1')).toBe('problem');
    expect(window.localStorage.getItem('pk.v3.qud.perspective.proj-1')).toBe('designer');
  });

  it('offers "Continue guided flow" for a Door A venture and restores the stored step', async () => {
    const user = userEvent.setup();
    h.venture.door_choice = 'A';
    window.localStorage.setItem('pk.v3.lastStep.proj-1', 'l8.3');
    await renderPage();

    const cta = screen.getByRole('button', { name: 'Continue guided flow' });
    await user.click(cta);
    expect(h.navigate).toHaveBeenCalledWith('/v3/door-a/proj-1#l8.3');
  });

  it('shows a Dashboard action (not Continue guided flow) for a Door B venture', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: 'Dashboard →' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue guided flow' })).not.toBeInTheDocument();
  });

  it('exposes a mobile "Open full stack" control that opens the drawer', async () => {
    const user = userEvent.setup();
    await renderPage();
    const openBtn = screen.getByRole('button', { name: /open full stack/i });
    await user.click(openBtn);
    // the layout container gains the drawer-open class (CSS reveals the off-canvas nav)
    expect(document.querySelector('.qud-layout.qud-drawer-open')).toBeTruthy();
  });
});
