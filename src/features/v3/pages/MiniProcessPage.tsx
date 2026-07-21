// Mini-process runner. Displays the catalog for a layer (or project-wide if no
// layer specified). Selecting a process opens a READ-ONLY preview — it creates
// no run and writes no data. A persistent run is created only when the founder
// chooses "Start tracking this process"; if an active run already exists we open
// it instead of creating a duplicate. The active-run view tracks per-step
// progress, captured N, and notes, with autosave feedback. Completion
// auto-upgrades the linked layer's source_value.

import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useVenture } from '../hooks/useVenture';
import { useMiniProcessRuns, type MiniProcessRunRow } from '../hooks/useMiniProcessRuns';
import { PageShell, SaveStatus, Term, VentureHeader } from '../components/atoms';
import type { SaveState } from '../hooks/useClaimDraft';
import {
  findMiniProcess, MINI_PROCESS_CATALOG, miniProcessesForLayer,
  type MiniProcessDefinition,
} from '../lib/miniProcesses';
import {
  effortLevel, sampleSizeLabel, miniProcessSampleUnit, miniProcessMethods,
} from '../lib/copy';
import { PK_LAYER_BY_ID } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

// Run-status of a catalog entry, derived from existing run rows (no schema).
type CatalogStatus = 'recommended' | 'in_progress' | 'completed';
function catalogStatus(kind: string, runs: MiniProcessRunRow[]): CatalogStatus {
  if (runs.some((r) => r.kind === kind && r.state === 'in_progress')) return 'in_progress';
  if (runs.some((r) => r.kind === kind && r.state === 'completed')) return 'completed';
  return 'recommended';
}

const STATUS_STYLE: Record<CatalogStatus, { label: string; bg: string; fg: string }> = {
  recommended: { label: 'Recommended', bg: '#e6f4f1', fg: '#0f766e' },
  in_progress: { label: 'In progress', bg: '#fef3c7', fg: '#92400e' },
  completed:   { label: 'Completed',   bg: '#dcfce7', fg: '#065f46' },
};

export default function MiniProcessPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { venture, loading: vLoading } = useVenture(projectId);
  const { runs, loading, error, start, toggleStepDone, setCapturedN, setNotes, complete, abandon } =
    useMiniProcessRuns(projectId);

  const filterLayerId = search.get('layer');
  const focusedRunId = search.get('run');
  const previewKind = search.get('preview');

  const visibleCatalog = filterLayerId ? miniProcessesForLayer(filterLayerId) : MINI_PROCESS_CATALOG;

  const focusedRun = focusedRunId ? runs.find((r) => r.id === focusedRunId) : null;
  const focusedDef = focusedRun ? findMiniProcess(focusedRun.kind) : null;
  const previewDef = previewKind ? findMiniProcess(previewKind) : null;

  // Autosave feedback for the active run (notes + progress). We keep the last
  // failed mutation so Retry re-attempts it without losing the founder's input.
  const [runSaveState, setRunSaveState] = useState<SaveState>('idle');
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);
  const trackSave = useCallback(async (thunk: () => Promise<void>) => {
    lastActionRef.current = thunk;
    setRunSaveState('saving');
    try { await thunk(); setRunSaveState('saved'); }
    catch { setRunSaveState('error'); }
  }, []);

  const openCatalog = () =>
    navigate(`/v3/mini-process/${projectId}${filterLayerId ? `?layer=${filterLayerId}` : ''}`);
  const openRun = (runId: string) =>
    navigate(`/v3/mini-process/${projectId}?run=${runId}${filterLayerId ? `&layer=${filterLayerId}` : ''}`);
  const openPreview = (kind: string) =>
    navigate(`/v3/mini-process/${projectId}?preview=${kind}${filterLayerId ? `&layer=${filterLayerId}` : ''}`);

  // Start (or continue) tracking. Prevents accidental duplicate active runs: if
  // an in-progress run for this kind already exists, open it instead.
  const startTracking = async (def: MiniProcessDefinition) => {
    const existing = runs.find((r) => r.kind === def.kind && r.state === 'in_progress');
    if (existing) { openRun(existing.id); return; }
    const r = await start(def);
    openRun(r.id);
  };

  if (!projectId) return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  if (loading || vLoading) return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  if (error) {
    return <PageShell>
      <div role="alert" style={{ padding: 40, color: '#be123c' }}>Failed to load: {error}</div>
    </PageShell>;
  }

  return (
    <PageShell>
      <VentureHeader
        ventureName="Mini-processes"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        right={
          <button
            type="button"
            onClick={() => navigate(`/v3/dashboard/${projectId}`)}
            style={{
              padding: '7px 12px', background: 'transparent', color: '#475569',
              border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Dashboard</button>
        }
      />

      <div style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>

        {focusedRun && focusedDef ? (
          <RunDetail
            // Remount when the focused run changes so notesDraft (seeded from
            // run.notes via useState) resets instead of leaking the prior run's
            // draft into a different run.
            key={focusedRun.id}
            run={focusedRun}
            def={focusedDef}
            saveState={runSaveState}
            onRetrySave={() => { if (lastActionRef.current) void trackSave(lastActionRef.current); }}
            onBack={openCatalog}
            onToggleStep={(i) => { void trackSave(() => toggleStepDone(focusedRun.id, i)); }}
            onSetCapturedN={(n) => { void trackSave(() => setCapturedN(focusedRun.id, n)); }}
            onSetNotes={(n) => { void trackSave(() => setNotes(focusedRun.id, n)); }}
            onComplete={async () => { await complete(focusedRun.id); }}
            onStopTracking={async () => { await abandon(focusedRun.id); openCatalog(); }}
          />
        ) : previewDef ? (
          <ProcessPreview
            def={previewDef}
            activeRun={runs.find((r) => r.kind === previewDef.kind && r.state === 'in_progress') ?? null}
            onStart={() => { void startTracking(previewDef); }}
            onContinue={(id) => openRun(id)}
            onBack={openCatalog}
          />
        ) : (
          <>
            {/* Active runs */}
            {runs.filter((r) => r.state === 'in_progress').length > 0 && (
              <section>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
                  marginBottom: 10,
                }}>In progress</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {runs.filter((r) => r.state === 'in_progress').map((r) => {
                    const def = findMiniProcess(r.kind);
                    if (!def) return null;
                    const stepsDone = (r.progress.completedSteps ?? []).length;
                    const captured = r.progress.capturedN ?? 0;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => openRun(r.id)}
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px', background: '#fff',
                          border: '1.5px solid #0f766e', borderRadius: 10,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', flexDirection: 'column', gap: 6,
                          boxShadow: '0 0 0 4px rgba(15,118,110,0.06)',
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <span style={{
                            fontFamily: FONT_SERIF, fontSize: 18, color: '#0b1220',
                            letterSpacing: '-0.005em',
                          }}>{def.title}</span>
                          <span style={{
                            fontFamily: FONT_MONO, fontSize: 9.5, color: '#0f766e',
                            letterSpacing: '0.1em', fontWeight: 700,
                          }}>CONTINUE →</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                          {def.tagline}
                        </div>
                        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}>
                          <span>Steps: {stepsDone}/{def.steps.length}</span>
                          <span>Captured: {captured}/{def.targetN}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Catalog */}
            <section>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
                }}>
                  {filterLayerId
                    ? `Available for ${PK_LAYER_BY_ID[filterLayerId]?.name ?? filterLayerId}`
                    : 'Catalog'}
                </div>
                {filterLayerId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/v3/mini-process/${projectId}`)}
                    style={{
                      background: 'none', border: 'none', color: '#0f766e',
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    }}
                  >show all →</button>
                )}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {visibleCatalog.map((def) => (
                  <CatalogCard
                    key={def.kind}
                    def={def}
                    status={catalogStatus(def.kind, runs)}
                    onView={() => openPreview(def.kind)}
                    onContinue={() => {
                      const r = runs.find((x) => x.kind === def.kind && x.state === 'in_progress');
                      if (r) openRun(r.id);
                    }}
                  />
                ))}
              </div>
            </section>

            {/* History */}
            {runs.filter((r) => r.state !== 'in_progress').length > 0 && (
              <section>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
                  marginBottom: 10,
                }}>History</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {runs.filter((r) => r.state !== 'in_progress').map((r) => {
                    const def = findMiniProcess(r.kind);
                    return (
                      <div
                        key={r.id}
                        style={{
                          padding: '8px 12px', background: '#fff',
                          border: '1px solid #e8dfc9', borderRadius: 6,
                          display: 'flex', alignItems: 'center', gap: 12,
                          fontSize: 12.5,
                        }}
                      >
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                          padding: '2px 7px', borderRadius: 3,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          background: r.state === 'completed' ? '#dcfce7' : '#f1f5f9',
                          color: r.state === 'completed' ? '#065f46' : '#94a3b8',
                        }}>{r.state === 'abandoned' ? 'stopped' : r.state}</span>
                        <span style={{ flex: 1, color: '#0b1220' }}>{def?.title ?? r.kind}</span>
                        <span style={{
                          fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                          letterSpacing: '0.06em',
                        }}>{new Date(r.completed_at ?? r.started_at).toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

// ── CatalogCard — a catalog entry: layer, purpose, time, sample, effort, status ──
function CatalogCard({
  def, status, onView, onContinue,
}: {
  def: MiniProcessDefinition;
  status: CatalogStatus;
  onView: () => void;
  onContinue: () => void;
}) {
  const layer = PK_LAYER_BY_ID[def.layerId];
  const st = STATUS_STYLE[status];
  const effort = effortLevel(def.timeEstimateMinutes);
  const sample = sampleSizeLabel(def.targetN, miniProcessSampleUnit(def.kind));
  const methods = miniProcessMethods(def.kind);
  const inProgress = status === 'in_progress';

  return (
    <div style={{
      padding: '14px 16px', background: '#fff',
      border: '1px solid #e8dfc9', borderRadius: 10,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>L{String(layer?.n ?? 0).padStart(2, '0')} · {layer?.name}</span>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 18, color: '#0b1220',
            letterSpacing: '-0.005em', marginTop: 2,
          }}>{def.title}</div>
        </div>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
          padding: '3px 8px', borderRadius: 999, letterSpacing: '0.08em',
          textTransform: 'uppercase', background: st.bg, color: st.fg,
          whiteSpace: 'nowrap',
        }}>{st.label}</span>
      </div>

      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
        {def.tagline}
      </div>

      {/* Facts row: time · sample · effort */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Fact label="Time" value={`~${def.timeEstimateMinutes} min`} />
        <Fact label="Target" value={sample} />
        <Fact label="Effort" value={effort} />
      </div>

      {/* Specialist method glossary — plain-language tooltips */}
      {methods.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11.5, color: '#64748b' }}>
          {methods.map((m) => (
            <Term key={m.term} definition={m.definition}>{m.term}</Term>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={inProgress ? onContinue : onView}
        style={{
          alignSelf: 'flex-start', padding: '7px 12px',
          background: inProgress ? '#0f766e' : 'transparent',
          color: inProgress ? '#fff' : '#0f766e',
          border: inProgress ? 'none' : '1px solid #99d3cb',
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >{inProgress ? 'Continue process →' : 'View process →'}</button>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 5,
      padding: '3px 9px', background: '#f4f1ea', borderRadius: 6,
      fontSize: 11, color: '#475569',
    }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700,
      }}>{label}</span>
      <strong style={{ color: '#0b1220', fontWeight: 600 }}>{value}</strong>
    </span>
  );
}

// ── ProcessPreview — read-only overview. Creates no run, writes no data. ──
function ProcessPreview({
  def, activeRun, onStart, onContinue, onBack,
}: {
  def: MiniProcessDefinition;
  activeRun: MiniProcessRunRow | null;
  onStart: () => void;
  onContinue: (runId: string) => void;
  onBack: () => void;
}) {
  const layer = PK_LAYER_BY_ID[def.layerId];
  const sample = sampleSizeLabel(def.targetN, miniProcessSampleUnit(def.kind));
  const effort = effortLevel(def.timeEstimateMinutes);
  const methods = miniProcessMethods(def.kind);

  return (
    <section style={{
      padding: '20px 22px', background: '#fff',
      border: '1px solid #e8dfc9', borderRadius: 10,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>Preview · L{String(layer?.n ?? 0).padStart(2, '0')} · {layer?.name}</span>
          <h2 style={{
            margin: '4px 0 0', fontFamily: FONT_SERIF, fontSize: 26, color: '#0b1220',
            letterSpacing: '-0.012em', fontWeight: 400,
          }}>{def.title}</h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}
        >← Back to process catalog</button>
      </div>

      {/* What it helps you learn (tagline) + why it matters (body) */}
      <div>
        <SectionKicker>What this helps you learn</SectionKicker>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
          lineHeight: 1.55, fontStyle: 'italic',
        }}>{def.tagline}</div>
      </div>
      <div>
        <SectionKicker>Why it matters</SectionKicker>
        <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{def.body}</div>
      </div>

      {/* Facts */}
      <div style={{
        padding: '10px 12px', background: '#f4f1ea', borderRadius: 6,
        fontSize: 12, color: '#475569', lineHeight: 1.5,
        display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        <span><strong>Estimated time:</strong> ~{def.timeEstimateMinutes} min</span>
        <span><strong>Target sample:</strong> {sample}</span>
        <span><strong>Effort:</strong> {effort}</span>
        <span><strong>Done when:</strong> {def.definitionOfDone}</span>
      </div>

      {methods.length > 0 && (
        <div>
          <SectionKicker>Methods</SectionKicker>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12.5, color: '#475569' }}>
            {methods.map((m) => (
              <Term key={m.term} definition={m.definition}>{m.term}</Term>
            ))}
          </div>
        </div>
      )}

      {/* Steps (read-only outline — no checkboxes, no inputs) */}
      <div>
        <SectionKicker>Steps</SectionKicker>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {def.steps.map((s, i) => (
            <li key={i} style={{ fontSize: 13, color: '#0b1220', lineHeight: 1.5 }}>
              <strong>{s.title}.</strong>{' '}
              <span style={{ color: '#475569' }}>{s.prompt}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <SectionKicker>Expected output</SectionKicker>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{def.definitionOfDone}</div>
      </div>

      {/* Actions — the only place a run gets created. */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid #ece6d6', paddingTop: 14 }}>
        {activeRun ? (
          <button
            type="button"
            onClick={() => onContinue(activeRun.id)}
            style={primaryBtn}
          >Continue process →</button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            style={primaryBtn}
          >Start tracking this process</button>
        )}
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '9px 14px', background: 'transparent', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Back to process catalog</button>
      </div>
    </section>
  );
}

const primaryBtn = {
  padding: '10px 16px', background: '#0b1220', color: '#fff',
  border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
} as const;

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
      marginBottom: 6,
    }}>{children}</div>
  );
}

// ── RunDetail — the ACTIVE-RUN view. Only rendered for a real ?run= id. ──
function RunDetail({
  run, def, saveState, onRetrySave, onBack, onToggleStep, onSetCapturedN,
  onSetNotes, onComplete, onStopTracking,
}: {
  run: MiniProcessRunRow;
  def: MiniProcessDefinition;
  saveState: SaveState;
  onRetrySave: () => void;
  onBack: () => void;
  onToggleStep: (i: number) => void;
  onSetCapturedN: (n: number) => void;
  onSetNotes: (n: string) => void;
  onComplete: () => Promise<void>;
  onStopTracking: () => Promise<void>;
}) {
  const [notesDraft, setNotesDraft] = useState(run.notes ?? '');
  const [confirmStop, setConfirmStop] = useState(false);
  const completedSteps = new Set(run.progress.completedSteps ?? []);
  const captured = run.progress.capturedN ?? 0;
  const allDone = completedSteps.size >= def.steps.length && captured >= def.targetN;
  const layer = PK_LAYER_BY_ID[def.layerId];

  return (
    <section style={{
      padding: '20px 22px', background: '#fff',
      border: '1px solid #e8dfc9', borderRadius: 10,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>
            L{String(layer?.n ?? 0).padStart(2, '0')} · {layer?.name}
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: '#fef3c7', color: '#92400e',
            }}>In progress</span>
          </span>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 26, color: '#0b1220',
            letterSpacing: '-0.012em', marginTop: 4,
          }}>{def.title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}
          >← back to catalog</button>
          <SaveStatus state={saveState} onRetry={onRetrySave} />
        </div>
      </div>

      <div style={{
        fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
        lineHeight: 1.55, fontStyle: 'italic',
      }}>{def.tagline}</div>
      <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{def.body}</div>

      <div style={{
        padding: '10px 12px', background: '#f4f1ea', borderRadius: 6,
        fontSize: 12, color: '#475569', lineHeight: 1.5,
        display: 'flex', gap: 14, flexWrap: 'wrap',
      }}>
        <span><strong>Target:</strong> {sampleSizeLabel(def.targetN, miniProcessSampleUnit(def.kind))}</span>
        <span><strong>Time est:</strong> ~{def.timeEstimateMinutes} min</span>
        <span><strong>Done when:</strong> {def.definitionOfDone}</span>
      </div>

      <div>
        <SectionKicker>Steps</SectionKicker>
        <div style={{ display: 'grid', gap: 8 }}>
          {def.steps.map((s, i) => {
            const done = completedSteps.has(i);
            return (
              <div
                key={i}
                style={{
                  padding: '12px 14px', background: '#fff',
                  border: `1px solid ${done ? '#0f766e' : '#e8dfc9'}`,
                  borderRadius: 8,
                  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <button
                  type="button"
                  onClick={() => onToggleStep(i)}
                  aria-pressed={done}
                  aria-label={`${done ? 'Mark step not done' : 'Mark step done'}: ${s.title}`}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1.5px solid ${done ? '#0f766e' : '#cbd5e1'}`,
                    background: done ? '#0f766e' : 'transparent',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                  }}
                >{done ? '✓' : ''}</button>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0b1220' }}>
                    {i + 1}. {s.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, marginTop: 4 }}>
                    {s.prompt}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'center' }}>
        <label
          htmlFor="mini-process-captured"
          style={{
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.08em',
            color: '#64748b', fontWeight: 600,
          }}
        >Captured ({miniProcessSampleUnit(def.kind)})</label>
        <input
          id="mini-process-captured"
          type="number"
          value={captured}
          min={0}
          onChange={(e) => onSetCapturedN(Number(e.target.value) || 0)}
          style={{
            width: 80, padding: '6px 10px', border: '1px solid #d6cfb8',
            borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: '#fff',
          }}
        />
      </div>

      <div>
        <SectionKicker>Notes</SectionKicker>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => { if (notesDraft !== (run.notes ?? '')) onSetNotes(notesDraft); }}
          aria-label="Notes"
          placeholder="Findings, transcripts, links…"
          style={{
            width: '100%', minHeight: 80, padding: '10px 12px',
            border: '1px solid #d6cfb8', borderRadius: 6,
            fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit',
            background: '#fbfaf7', resize: 'vertical', outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #ece6d6', paddingTop: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { void onComplete(); }}
          style={{
            padding: '9px 16px',
            background: allDone ? '#0f766e' : '#fcd34d',
            color: allDone ? '#fff' : '#92400e',
            border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {allDone ? `Complete & upgrade ${layer?.name} →` : 'Mark complete (definition-of-done not yet met)'}
        </button>
        {!confirmStop ? (
          <button
            type="button"
            onClick={() => setConfirmStop(true)}
            style={{
              padding: '9px 14px', background: 'transparent', color: '#64748b',
              border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Stop tracking</button>
        ) : (
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#475569' }}>
              This stops the current run. Existing notes and progress will remain available in its history.
            </span>
            <button
              type="button"
              onClick={() => { void onStopTracking(); }}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#9f1239',
                border: '1px solid #fda4af', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}
            >Yes, stop tracking</button>
            <button
              type="button"
              onClick={() => setConfirmStop(false)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Keep tracking</button>
          </span>
        )}
      </div>
    </section>
  );
}
