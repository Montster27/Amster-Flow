// Mini-process preview vs. active run (Finding 10).
//
// The central guarantee: opening a process preview must create no run and write
// nothing. We stub the Supabase client at the `sb` boundary and record every
// insert/update, so "previewing performs no write" is asserted against the
// actual write path rather than a UI proxy.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  venture: {
    project_id: 'proj-1', industry_variant: 'software', evaluator: 'investor',
    door_choice: 'B', intensity: 'direct', has_completed_onboarding: true,
  } as Record<string, unknown>,
  runs: [] as Record<string, unknown>[],
  writes: [] as { op: 'insert' | 'update'; table: string; payload: unknown }[],
  navigate: vi.fn(),
  search: new URLSearchParams(''),
}));

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => h.navigate,
    useParams: () => ({ projectId: 'proj-1' }),
    useSearchParams: () => [h.search, vi.fn()],
  };
});

// Chainable stub of the typed Supabase client used by useMiniProcessRuns.
vi.mock('../lib/pivotkitDb', () => {
  const makeQuery = (table: string) => {
    let returnRow: Record<string, unknown> | null = null;
    const q: Record<string, unknown> = {};
    Object.assign(q, {
      select: () => q,
      eq: () => q,
      order: () => Promise.resolve({ data: h.runs, error: null }),
      single: () => Promise.resolve({ data: returnRow, error: null }),
      insert: (payload: Record<string, unknown>) => {
        h.writes.push({ op: 'insert', table, payload });
        returnRow = { id: 'run-new', started_at: new Date().toISOString(), completed_at: null, notes: null, ...payload };
        return q;
      },
      update: (payload: Record<string, unknown>) => {
        h.writes.push({ op: 'update', table, payload });
        returnRow = { ...(h.runs[0] ?? {}), ...payload };
        return q;
      },
    });
    return q;
  };
  return { sb: { from: (t: string) => makeQuery(t) } };
});

vi.mock('../lib/storage', () => ({
  ensureVenture: vi.fn(async () => h.venture),
  fetchVenture: vi.fn(async () => h.venture),
  updateVenture: vi.fn(async () => h.venture),
  fetchLayerStack: vi.fn(async () => []),
  upsertLayerState: vi.fn(async () => ({})),
  logAuditEvent: vi.fn(),
}));

import MiniProcessPage from '../pages/MiniProcessPage';

const WTP_TITLE = 'Willingness-to-Pay test';

function inProgressRun(kind: string, id = 'run-existing') {
  return {
    id, project_id: 'proj-1', kind, layer_id: 'painScale',
    state: 'in_progress', progress: { completedSteps: [], capturedN: 0 },
    notes: null, started_at: new Date().toISOString(), completed_at: null, created_by: null,
  };
}

async function renderPage() {
  render(<MiniProcessPage />);
  await screen.findByText('Mini-processes');
}

describe('MiniProcessPage — preview vs. run (Finding 10)', () => {
  beforeEach(() => {
    h.runs.length = 0;
    h.writes.length = 0;
    h.navigate.mockClear();
    h.search = new URLSearchParams('');
  });

  it('catalog offers "View process", never a bare "Start"', async () => {
    await renderPage();
    const viewButtons = await screen.findAllByRole('button', { name: /view process/i });
    expect(viewButtons.length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^Start →$/ })).not.toBeInTheDocument();
  });

  it('catalog states target sample in words and an effort level, not just n=', async () => {
    await renderPage();
    // "10 respondents" rather than "n=10"
    expect(await screen.findByText('10 respondents')).toBeInTheDocument();
    expect(screen.queryByText(/n=\d/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Light|Moderate|Significant/).length).toBeGreaterThan(0);
  });

  it('opening a preview creates NO run and writes nothing', async () => {
    h.search = new URLSearchParams('preview=wtp_test');
    await renderPage();

    expect(await screen.findByRole('heading', { name: WTP_TITLE })).toBeInTheDocument();
    // The whole point: zero writes of any kind reached the database.
    expect(h.writes).toHaveLength(0);
  });

  it('preview is read-only — no completion inputs, notes, complete or stop controls', async () => {
    h.search = new URLSearchParams('preview=wtp_test');
    await renderPage();
    await screen.findByRole('heading', { name: WTP_TITLE });

    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /stop tracking/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    // ...but it does explain the process and offer the explicit start action.
    expect(screen.getByText('What this helps you learn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start tracking this process' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to process catalog' })).toBeInTheDocument();
  });

  it('"Start tracking this process" creates exactly one run and opens it', async () => {
    const user = userEvent.setup();
    h.search = new URLSearchParams('preview=wtp_test');
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Start tracking this process' }));

    const inserts = h.writes.filter((w) => w.op === 'insert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe('pivotkit_mini_process_runs');
    expect(inserts[0].payload).toMatchObject({ kind: 'wtp_test', state: 'in_progress' });
    expect(h.navigate).toHaveBeenCalledWith('/v3/mini-process/proj-1?run=run-new');
  });

  it('an existing active run opens instead of creating a duplicate', async () => {
    const user = userEvent.setup();
    h.runs.push(inProgressRun('wtp_test'));
    h.search = new URLSearchParams('preview=wtp_test');
    await renderPage();

    // Preview offers Continue, not Start.
    expect(screen.queryByRole('button', { name: 'Start tracking this process' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Continue process →' }));

    expect(h.writes.filter((w) => w.op === 'insert')).toHaveLength(0);
    expect(h.navigate).toHaveBeenCalledWith('/v3/mini-process/proj-1?run=run-existing');
  });

  it('catalog card for a process with an active run says "Continue process"', async () => {
    h.runs.push(inProgressRun('wtp_test'));
    await renderPage();
    expect(await screen.findByRole('button', { name: 'Continue process →' })).toBeInTheDocument();
  });

  it('the active-run view is distinct: In progress state, notes, progress and completion controls', async () => {
    h.runs.push(inProgressRun('wtp_test'));
    h.search = new URLSearchParams('run=run-existing');
    await renderPage();

    expect(await screen.findByText('In progress')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop tracking' })).toBeInTheDocument();
  });

  it('"Stop tracking" explains the effect and only stops after confirmation', async () => {
    const user = userEvent.setup();
    h.runs.push(inProgressRun('wtp_test'));
    h.search = new URLSearchParams('run=run-existing');
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Stop tracking' }));
    // Accurate promise: the existing implementation marks the run abandoned and
    // keeps it in history — it does not delete notes or progress.
    expect(screen.getByText(/remain available in its history/i)).toBeInTheDocument();
    expect(h.writes.filter((w) => w.op === 'update')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Yes, stop tracking' }));
    const updates = h.writes.filter((w) => w.op === 'update');
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toMatchObject({ state: 'abandoned' });
  });

  it('never uses the punitive "Abandon" wording', async () => {
    h.runs.push(inProgressRun('wtp_test'));
    h.search = new URLSearchParams('run=run-existing');
    await renderPage();
    await screen.findByLabelText('Notes');
    expect(screen.queryByText(/abandon/i)).not.toBeInTheDocument();
  });
});
