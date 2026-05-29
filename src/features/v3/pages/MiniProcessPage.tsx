// Mini-process runner. Displays the catalog for a layer (or project-wide
// if no layer specified), tracks per-step progress, captured N, and notes.
// Completion auto-upgrades the linked layer's source_value.

import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useVenture } from '../hooks/useVenture';
import { useMiniProcessRuns } from '../hooks/useMiniProcessRuns';
import { PageShell, VentureHeader } from '../components/atoms';
import {
  findMiniProcess, MINI_PROCESS_CATALOG, miniProcessesForLayer,
  type MiniProcessDefinition,
} from '../lib/miniProcesses';
import { PK_LAYER_BY_ID } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

export default function MiniProcessPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { venture, loading: vLoading } = useVenture(projectId);
  const { runs, loading, error, start, toggleStepDone, setCapturedN, setNotes, complete, abandon } =
    useMiniProcessRuns(projectId);

  const filterLayerId = search.get('layer');
  const focusedRunId = search.get('run');

  const visibleCatalog = useMemo(() => {
    return filterLayerId ? miniProcessesForLayer(filterLayerId) : MINI_PROCESS_CATALOG;
  }, [filterLayerId]);

  const focusedRun = focusedRunId ? runs.find((r) => r.id === focusedRunId) : null;
  const focusedDef = focusedRun ? findMiniProcess(focusedRun.kind) : null;

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
            onBack={() => navigate(`/v3/mini-process/${projectId}${filterLayerId ? `?layer=${filterLayerId}` : ''}`)}
            onToggleStep={(i) => { void toggleStepDone(focusedRun.id, i); }}
            onSetCapturedN={(n) => { void setCapturedN(focusedRun.id, n); }}
            onSetNotes={(n) => { void setNotes(focusedRun.id, n); }}
            onComplete={async () => { await complete(focusedRun.id); }}
            onAbandon={async () => { await abandon(focusedRun.id); }}
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
                        onClick={() => navigate(`/v3/mini-process/${projectId}?run=${r.id}${filterLayerId ? `&layer=${filterLayerId}` : ''}`)}
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
                          }}>RESUME →</span>
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
                {visibleCatalog.map((def) => {
                  const layer = PK_LAYER_BY_ID[def.layerId];
                  const hasInProgressRun = runs.some(
                    (r) => r.kind === def.kind && r.state === 'in_progress',
                  );
                  return (
                    <div
                      key={def.kind}
                      style={{
                        padding: '14px 16px', background: '#fff',
                        border: '1px solid #e8dfc9', borderRadius: 10,
                        display: 'flex', flexDirection: 'column', gap: 8,
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12,
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
                          fontFamily: FONT_MONO, fontSize: 10, color: '#64748b',
                          letterSpacing: '0.06em',
                        }}>~{def.timeEstimateMinutes}m · n={def.targetN}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                        {def.tagline}
                      </div>
                      <button
                        type="button"
                        disabled={hasInProgressRun}
                        onClick={async () => {
                          const r = await start(def);
                          navigate(`/v3/mini-process/${projectId}?run=${r.id}${filterLayerId ? `&layer=${filterLayerId}` : ''}`);
                        }}
                        style={{
                          alignSelf: 'flex-start', padding: '7px 12px',
                          background: hasInProgressRun ? '#e2e8f0' : '#0b1220',
                          color: hasInProgressRun ? '#94a3b8' : '#fff',
                          border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                          cursor: hasInProgressRun ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >{hasInProgressRun ? 'Already running' : 'Start →'}</button>
                    </div>
                  );
                })}
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
                        }}>{r.state}</span>
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

// ── RunDetail ──
function RunDetail({
  run, def, onBack, onToggleStep, onSetCapturedN, onSetNotes, onComplete, onAbandon,
}: {
  run: { id: string; progress: { completedSteps?: number[]; capturedN?: number }; notes: string | null };
  def: MiniProcessDefinition;
  onBack: () => void;
  onToggleStep: (i: number) => void;
  onSetCapturedN: (n: number) => void;
  onSetNotes: (n: string) => void;
  onComplete: () => Promise<void>;
  onAbandon: () => Promise<void>;
}) {
  const [notesDraft, setNotesDraft] = useState(run.notes ?? '');
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
            fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>L{String(layer?.n ?? 0).padStart(2, '0')} · {layer?.name}</span>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 26, color: '#0b1220',
            letterSpacing: '-0.012em', marginTop: 4,
          }}>{def.title}</div>
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}
        >← back to catalog</button>
      </div>

      <div style={{
        fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
        lineHeight: 1.55, fontStyle: 'italic',
      }}>{def.tagline}</div>
      <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{def.body}</div>

      <div style={{
        padding: '10px 12px', background: '#f4f1ea', borderRadius: 6,
        fontSize: 12, color: '#475569', lineHeight: 1.5,
        display: 'flex', gap: 14,
      }}>
        <span><strong>Target N:</strong> {def.targetN}</span>
        <span><strong>Time est:</strong> ~{def.timeEstimateMinutes} min</span>
        <span><strong>Done when:</strong> {def.definitionOfDone}</span>
      </div>

      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
          marginBottom: 8,
        }}>Steps</div>
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
        <span style={{
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.08em',
          color: '#64748b', fontWeight: 600,
        }}>Captured (n)</span>
        <input
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
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
          marginBottom: 6,
        }}>Notes</div>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => { if (notesDraft !== (run.notes ?? '')) onSetNotes(notesDraft); }}
          placeholder="Findings, transcripts, links…"
          style={{
            width: '100%', minHeight: 80, padding: '10px 12px',
            border: '1px solid #d6cfb8', borderRadius: 6,
            fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit',
            background: '#fbfaf7', resize: 'vertical', outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #ece6d6', paddingTop: 12 }}>
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
        <button
          type="button"
          onClick={() => { void onAbandon(); }}
          style={{
            padding: '9px 14px', background: 'transparent', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Abandon</button>
      </div>
    </section>
  );
}
