// Assumption stack page — combines all three channels.
//
//   Channel 1 (direct authoring):  the "+ add assumption" form at the top
//   Channel 2 (spawn tray):        the "Candidates from filled layers" section
//   Channel 3 (cross-layer flag):  the amber-bordered "Junction flags" section
//
// Founders can promote candidates, attach a source, drive the state machine,
// edit text (Reframe), and dismiss. All actions hit pivotkit_audit_log.

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import { useAssumptions } from '../hooks/useAssumptions';
import { PageShell, SourcePill, TierLadder, VentureHeader } from '../components/atoms';
import {
  PK_LAYER_BY_ID, PK_SOURCES, type SourceId,
} from '../lib/layers';
import {
  assumptionTier, type AssumptionRow, type AssumptionState, type AssumptionCandidate,
} from '../lib/assumptions';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

const STATE_COLORS: Record<AssumptionState, { bg: string; fg: string }> = {
  queued:    { bg: '#f1f5f9', fg: '#475569' },
  active:    { bg: '#fef3c7', fg: '#92400e' },
  validated: { bg: '#dcfce7', fg: '#065f46' },
  refined:   { bg: '#e0f2fe', fg: '#0369a1' },
  killed:    { bg: '#fef2f2', fg: '#9f1239' },
  dismissed: { bg: '#f1f5f9', fg: '#94a3b8' },
};

function StateBadge({ state }: { state: AssumptionState }) {
  const c = STATE_COLORS[state];
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999,
      background: c.bg, color: c.fg,
      fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '0.1em',
      textTransform: 'uppercase', fontWeight: 700,
    }}>{state}</span>
  );
}

function ChannelBadge({ channel }: { channel: AssumptionRow['channel'] }) {
  const map = {
    direct:      { bg: '#0b1220', fg: '#fff',    label: 'Direct' },
    spawned:     { bg: '#dcfce7', fg: '#0f766e', label: 'Spawned' },
    cross_layer: { bg: '#fef3c7', fg: '#b45309', label: 'Cross' },
  } as const;
  const c = map[channel];
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 4,
      background: c.bg, color: c.fg,
      fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.1em',
      textTransform: 'uppercase', fontWeight: 700,
    }}>{c.label}</span>
  );
}

export default function AssumptionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading } = useVenture(projectId);
  const { rows: layerRows, loading: lLoading, gates } = useLayerStack(projectId);
  const {
    rows: assumptions, loading: aLoading, error,
    candidates, createDirect, promote, setState, setSource, edit, dismissCandidate,
  } = useAssumptions(projectId, layerRows);

  const [draft, setDraft] = useState({ layerId: '' as string, text: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ text: '', notes: '' });

  const partition = useMemo(() => {
    const byState: Record<AssumptionState, AssumptionRow[]> = {
      queued: [], active: [], validated: [], refined: [], killed: [], dismissed: [],
    };
    for (const a of assumptions) byState[a.state].push(a);
    return byState;
  }, [assumptions]);

  const candidateCount = useMemo(() =>
    Object.values(candidates.spawned).reduce((n, cs) => n + cs.length, 0)
    + candidates.crossLayer.length,
  [candidates]);

  if (!projectId) return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  if (lLoading || vLoading || aLoading) {
    return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  }
  if (error) {
    return <PageShell>
      <div role="alert" style={{ padding: 40, color: '#be123c' }}>Failed to load: {error}</div>
    </PageShell>;
  }

  const onAddDirect = async () => {
    if (!draft.text.trim()) return;
    setSubmitting(true);
    try {
      await createDirect({
        layerId: draft.layerId || null,
        text: draft.text.trim(),
        notes: draft.notes.trim() || undefined,
      });
      setDraft({ layerId: '', text: '', notes: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <VentureHeader
        ventureName="Assumption stack"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate(`/v3/dashboard/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#475569',
                border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Dashboard</button>
            <button
              type="button"
              onClick={() => navigate(`/v3/door-b/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#475569',
                border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Edit stack</button>
          </div>
        }
      />

      <div style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>

        {/* ── Channel 1 — direct authoring ── */}
        <section style={{
          padding: '16px 18px', background: '#fff',
          border: '1px solid #e8dfc9', borderRadius: 10,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
            marginBottom: 10,
          }}>+ Direct authoring (channel 1)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 10 }}>
            <textarea
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              placeholder="Write the assumption: e.g. Solo-practice rural vets carry $80/mo discretionary SaaS budget."
              style={{
                width: '100%', minHeight: 60, padding: '10px 12px',
                border: '1px solid #d6cfb8', borderRadius: 6,
                fontSize: 13.5, lineHeight: 1.5, fontFamily: 'inherit',
                background: '#fbfaf7', resize: 'vertical', outline: 'none',
              }}
            />
            <select
              value={draft.layerId}
              onChange={(e) => setDraft({ ...draft, layerId: e.target.value })}
              style={{
                padding: '8px 10px', border: '1px solid #d6cfb8', borderRadius: 6,
                background: '#fff', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              <option value="">Free-floating (no anchor layer)</option>
              {Object.values(PK_LAYER_BY_ID).map((L) => (
                <option key={L.id} value={L.id}>L{String(L.n).padStart(2,'0')} · {L.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Optional notes (why does this matter?)"
              style={{
                flex: 1, padding: '7px 10px', border: '1px solid #e2e8f0',
                borderRadius: 6, fontSize: 12.5, fontFamily: 'inherit',
                background: '#fff', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => { void onAddDirect(); }}
              disabled={submitting || !draft.text.trim()}
              style={{
                padding: '8px 14px',
                background: !draft.text.trim() ? '#e2e8f0' : '#0b1220',
                color: !draft.text.trim() ? '#94a3b8' : '#fff',
                border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                cursor: !draft.text.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >Add to stack</button>
          </div>
        </section>

        {/* ── Channel 3 — cross-layer flags (most pressing first) ── */}
        {candidates.crossLayer.length > 0 && (
          <section style={{
            padding: '16px 18px', background: '#fff8eb',
            border: '1px solid #fde68a', borderLeft: '3px solid #b45309',
            borderRadius: 10,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#92400e', fontWeight: 700,
              }}>⚠ Cross-layer flags (channel 3)</div>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#92400e',
                letterSpacing: '0.06em',
              }}>{candidates.crossLayer.length} pending</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {candidates.crossLayer.map((c) => (
                <CandidateCard
                  key={c.rule_id}
                  candidate={c}
                  onPromote={() => { void promote(c); }}
                  onDismiss={() => { void dismissCandidate(c); }}
                  tone="amber"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Channel 2 — spawn tray ── */}
        {Object.keys(candidates.spawned).length > 0 && (
          <section style={{
            padding: '16px 18px', background: '#fff',
            border: '1px solid #e8dfc9', borderRadius: 10,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
              }}>Candidates from filled layers (channel 2)</div>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
                letterSpacing: '0.06em',
              }}>{candidateCount - candidates.crossLayer.length} from {Object.keys(candidates.spawned).length} layers</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {Object.entries(candidates.spawned).flatMap(([layerId, cs]) =>
                cs.map((c) => (
                  <CandidateCard
                    key={`${layerId}:${c.rule_id}`}
                    candidate={c}
                    onPromote={() => { void promote(c); }}
                    onDismiss={() => { void dismissCandidate(c); }}
                    tone="teal"
                  />
                )),
              )}
            </div>
          </section>
        )}

        {/* ── Stack: queued + active ── */}
        <section style={{
          padding: '16px 18px', background: '#fff',
          border: '1px solid #e8dfc9', borderRadius: 10,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
            }}>Stack</div>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
              letterSpacing: '0.06em',
            }}>{partition.queued.length + partition.active.length} active · {partition.validated.length} validated · {partition.killed.length + partition.dismissed.length} resolved</span>
          </div>

          {assumptions.length === 0 ? (
            <div style={{
              padding: '20px 14px', fontSize: 13, color: '#94a3b8',
              fontStyle: 'italic', textAlign: 'center',
            }}>No assumptions yet. Write one above, or accept a candidate from a filled layer.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {[...partition.queued, ...partition.active, ...partition.refined, ...partition.validated, ...partition.killed, ...partition.dismissed].map((a) => (
                <AssumptionCard
                  key={a.id}
                  row={a}
                  isEditing={editingId === a.id}
                  editDraft={editDraft}
                  onStartEdit={() => {
                    setEditingId(a.id);
                    setEditDraft({ text: a.assumption_text, notes: a.notes ?? '' });
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={async () => {
                    if (!editDraft.text.trim()) { setEditingId(null); return; }
                    await edit(a.id, {
                      text: editDraft.text.trim(),
                      notes: editDraft.notes.trim() || null,
                    });
                    setEditingId(null);
                  }}
                  onEditDraftChange={setEditDraft}
                  onSourceChange={(src) => { void setSource(a.id, src); }}
                  onStateChange={(s) => { void setState(a.id, s); }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

// ── CandidateCard ──
function CandidateCard({
  candidate, onPromote, onDismiss, tone,
}: {
  candidate: AssumptionCandidate;
  onPromote: () => void;
  onDismiss: () => void;
  tone: 'teal' | 'amber';
}) {
  const accent = tone === 'amber' ? '#b45309' : '#0f766e';
  const primary = PK_LAYER_BY_ID[candidate.source_layer_id];
  const secondary = candidate.cross_source_layer_id
    ? PK_LAYER_BY_ID[candidate.cross_source_layer_id] : null;

  return (
    <div style={{
      padding: '12px 14px', background: '#fff',
      border: `1.5px solid ${accent}`, borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '0.08em',
          color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase',
        }}>
          L{String(primary?.n ?? 0).padStart(2, '0')} {primary?.name}
          {secondary && (
            <> × L{String(secondary.n).padStart(2, '0')} {secondary.name}</>
          )}
        </span>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9, color: accent,
          background: `${accent}14`, padding: '2px 6px', borderRadius: 3,
          fontWeight: 700, letterSpacing: '0.08em',
        }}>{candidate.channel === 'cross_layer' ? 'CROSS-LAYER' : 'NEW'}</span>
      </div>
      <div style={{
        fontSize: 14, color: '#0b1220', lineHeight: 1.4,
        fontWeight: 500, letterSpacing: '-0.005em',
      }}>{candidate.assumption_text}</div>
      {candidate.notes && (
        <div style={{
          fontSize: 11.5, color: '#64748b', fontStyle: 'italic',
          lineHeight: 1.4,
        }}>{candidate.notes}</div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          type="button"
          onClick={onPromote}
          style={{
            padding: '7px 12px', background: '#0b1220', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Add to stack</button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            padding: '7px 12px', background: 'transparent', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Dismiss</button>
      </div>
    </div>
  );
}

// ── AssumptionCard ──
function AssumptionCard({
  row, isEditing, editDraft, onStartEdit, onCancelEdit, onSaveEdit,
  onEditDraftChange, onSourceChange, onStateChange,
}: {
  row: AssumptionRow;
  isEditing: boolean;
  editDraft: { text: string; notes: string };
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onEditDraftChange: (v: { text: string; notes: string }) => void;
  onSourceChange: (src: SourceId | null) => void;
  onStateChange: (s: AssumptionState) => void;
}) {
  const tier = assumptionTier(row);
  const layer = row.source_layer_id ? PK_LAYER_BY_ID[row.source_layer_id] : null;
  const muted = row.state === 'killed' || row.state === 'dismissed';

  return (
    <div style={{
      padding: '12px 14px', background: '#fff',
      border: '1px solid #e8dfc9', borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 8,
      opacity: muted ? 0.6 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <ChannelBadge channel={row.channel} />
        <StateBadge state={row.state} />
        {layer && (
          <span style={{
            fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>L{String(layer.n).padStart(2, '0')} · {layer.name}</span>
        )}
        <span style={{ flex: 1 }} />
        <TierLadder tier={tier} size="sm" />
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
          letterSpacing: '0.06em',
        }}>{tier}/5</span>
      </div>

      {isEditing ? (
        <>
          <textarea
            value={editDraft.text}
            onChange={(e) => onEditDraftChange({ ...editDraft, text: e.target.value })}
            style={{
              width: '100%', minHeight: 56, padding: '8px 10px',
              border: '1px solid #d6cfb8', borderRadius: 6,
              fontSize: 13.5, lineHeight: 1.5, fontFamily: 'inherit',
              background: '#fbfaf7', resize: 'vertical', outline: 'none',
            }}
          />
          <input
            type="text"
            value={editDraft.notes}
            onChange={(e) => onEditDraftChange({ ...editDraft, notes: e.target.value })}
            placeholder="Notes"
            style={{
              padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
              fontSize: 12.5, fontFamily: 'inherit', background: '#fff', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { void onSaveEdit(); }}
              style={{
                padding: '6px 12px', background: '#0f766e', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >Save (reframe)</button>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                padding: '6px 12px', background: 'transparent', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
            lineHeight: 1.4, letterSpacing: '-0.005em',
            textDecoration: row.state === 'killed' ? 'line-through' : 'none',
          }}>&ldquo;{row.assumption_text}&rdquo;</div>
          {row.notes && (
            <div style={{
              fontSize: 11.5, color: '#64748b', fontStyle: 'italic', lineHeight: 1.4,
            }}>{row.notes}</div>
          )}
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
              letterSpacing: '0.06em',
            }}>SOURCE</span>
            {row.source_value
              ? <SourcePill src={row.source_value} />
              : <SourcePill src={null} />}
            <select
              value={row.source_value ?? ''}
              onChange={(e) => onSourceChange((e.target.value || null) as SourceId | null)}
              disabled={muted}
              style={{
                padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6,
                background: '#fff', fontSize: 11, fontFamily: 'inherit',
              }}
            >
              <option value="">— change source —</option>
              {PK_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <span style={{ flex: 1 }} />
            {!muted && (
              <>
                {row.state !== 'validated' && (
                  <button
                    type="button"
                    onClick={() => onStateChange('validated')}
                    title="Mark validated"
                    style={{
                      padding: '4px 9px', background: '#dcfce7', color: '#065f46',
                      border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                      fontFamily: FONT_MONO, letterSpacing: '0.04em', fontWeight: 600,
                    }}
                  >Validate</button>
                )}
                <button
                  type="button"
                  onClick={onStartEdit}
                  style={{
                    padding: '4px 9px', background: 'transparent', color: '#0369a1',
                    border: '1px solid #bae6fd', borderRadius: 4, fontSize: 11,
                    cursor: 'pointer', fontFamily: FONT_MONO,
                    letterSpacing: '0.04em', fontWeight: 600,
                  }}
                >Reframe</button>
                {row.state !== 'killed' && (
                  <button
                    type="button"
                    onClick={() => onStateChange('killed')}
                    style={{
                      padding: '4px 9px', background: 'transparent', color: '#9f1239',
                      border: '1px solid #fda4af', borderRadius: 4, fontSize: 11,
                      cursor: 'pointer', fontFamily: FONT_MONO,
                      letterSpacing: '0.04em', fontWeight: 600,
                    }}
                  >Kill</button>
                )}
              </>
            )}
            {muted && (
              <button
                type="button"
                onClick={() => onStateChange('queued')}
                style={{
                  padding: '4px 9px', background: 'transparent', color: '#0369a1',
                  border: '1px solid #bae6fd', borderRadius: 4, fontSize: 11,
                  cursor: 'pointer', fontFamily: FONT_MONO,
                  letterSpacing: '0.04em', fontWeight: 600,
                }}
              >Reopen</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
