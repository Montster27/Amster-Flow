// LayerDetailPage — single-layer inspection view (Sprint 2 T5).
//
// Lands at /v3/layer/:projectId/:layerId. Clicking a card on the dashboard
// or a layer row inside the Stage Gates panel arrives here. The page title
// reads "L08 · Customer Segment" so the founder knows they're inspecting one
// layer, not switching to the Door B snapshot dump.
//
// Editing here writes through to pivotkit_layer_states via the same saveLayer
// helper Door A / Door B use — no separate backing store.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssumptions } from '../hooks/useAssumptions';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import {
  CategoryBadge, PageShell, SourcePicker, SourcePill, TierLadder, VentureHeader,
} from '../components/atoms';
import { SectorMapPanel } from '../components/SectorMapPanel';
import { StageGatesPanel } from '../components/StageGatesPanel';
import { PK_LAYER_BY_ID, pkTier, type SourceId } from '../lib/layers';
import { lookupPushback } from '../lib/voice';
import {
  AMBER_FG, AMBER_LINE, AMBER_SOFT, FONT_MONO, FONT_SERIF, HAIR, INK, MUTED,
  PAPER, SLATE_FG, STONE, TAN, TEAL,
} from '../lib/tokens';

export default function LayerDetailPage() {
  const { projectId, layerId } = useParams<{ projectId: string; layerId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading } = useVenture(projectId);
  const {
    rows, stack, gates, stage, loading: lLoading, saveLayer,
  } = useLayerStack(projectId);
  const {
    candidates, promote, dismissCandidate, loading: aLoading,
  } = useAssumptions(projectId, rows);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layer = layerId ? PK_LAYER_BY_ID[layerId] : null;
  const row = layerId ? stack[layerId] : undefined;
  const tier = layer ? pkTier(layer.id, row?.source_value) : 0;
  const isCrit = layer?.cat === 'critical';
  const evaluator = venture?.evaluator ?? 'investor';
  const pushback = layer ? lookupPushback(layer.id, tier, evaluator) : null;
  const layerCandidates = layerId ? (candidates.spawned[layerId] ?? []) : [];

  if (!projectId || !layerId) {
    return <PageShell><div style={{ padding: 40 }}>Missing route params.</div></PageShell>;
  }
  if (vLoading || lLoading || aLoading) {
    return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  }
  if (!layer) {
    return (
      <PageShell>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#be123c', fontSize: 14 }}>
            Unknown layer: <code>{layerId}</code>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/v3/dashboard/${projectId}`)}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 14px', background: INK, color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12.5, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >← Back to dashboard</button>
        </div>
      </PageShell>
    );
  }

  const startEdit = () => {
    setDraft(row?.claim_text ?? '');
    setEditing(true);
    setError(null);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft('');
    setError(null);
  };
  const saveEdit = async () => {
    setSaving(true);
    setError(null);
    try {
      const trimmed = draft.trim();
      await saveLayer(layer.id, { claim_text: trimmed.length === 0 ? null : trimmed });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onSourceChange = async (next: SourceId | null) => {
    setSaving(true);
    setError(null);
    try {
      await saveLayer(layer.id, { source_value: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Prefer browser back so scroll position on the dashboard is restored
  // naturally. Fall back to an explicit dashboard navigation if we have no
  // prior history (direct-link arrival).
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/v3/dashboard/${projectId}`);
    }
  };

  const tone = isCrit ? 'critical' : 'thoughtful';

  return (
    <PageShell>
      <VentureHeader
        ventureName={`L${String(layer.n).padStart(2, '0')} · ${layer.name}`}
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <button
            type="button"
            onClick={goBack}
            aria-label="Back to dashboard"
            style={{
              padding: '7px 12px', background: 'transparent', color: SLATE_FG,
              border: `1px solid ${TAN}`, borderRadius: 6, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >← Back to dashboard</button>
        }
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0,
        minHeight: 'calc(100vh - 64px)',
      }}>
        <main style={{
          padding: '24px 32px', borderRight: `1px solid ${HAIR}`,
          background: PAPER, display: 'flex', flexDirection: 'column', gap: 18,
          minWidth: 0,
        }}>
          {/* Header row — badge, question, tier */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14,
          }}>
            <CategoryBadge cat={layer.cat} />
            <div style={{
              flex: 1, minWidth: 240,
              fontFamily: FONT_SERIF, fontSize: 16, color: SLATE_FG,
              fontStyle: 'italic', lineHeight: 1.4,
            }}>{layer.q}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <TierLadder tier={tier} tone={tone} />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: MUTED,
                letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums',
              }}>{tier}/5</span>
            </div>
          </div>

          {/* Custom view — dedicated tool in place of the generic claim form */}
          {layer.customView === 'sectorMap' && projectId && (
            <SectorMapPanel projectId={projectId} layer={layer} saveLayer={saveLayer} />
          )}

          {/* Claim section — read-only by default, Edit swaps to a textarea */}
          {layer.customView !== 'sectorMap' && (
          <>
          <section style={{
            padding: '16px 18px', background: '#fff',
            border: `1px solid ${TAN}`, borderRadius: 10,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: INK,
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
              }}>Your claim</div>
              {!editing && (
                <button
                  type="button"
                  onClick={startEdit}
                  aria-label={`Edit ${layer.name} claim`}
                  style={{
                    padding: '6px 12px', background: 'transparent', color: TEAL,
                    border: `1px solid ${TEAL}`, borderRadius: 6, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                  }}
                >Edit</button>
              )}
            </div>

            {editing ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Your claim about ${layer.name.toLowerCase()}…`}
                  autoFocus
                  style={{
                    width: '100%', minHeight: 96, padding: '10px 12px',
                    border: `1px solid ${TAN}`, borderRadius: 6,
                    fontSize: 13.5, lineHeight: 1.55, fontFamily: 'inherit',
                    color: INK, background: PAPER, resize: 'vertical', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { void saveEdit(); }}
                    disabled={saving}
                    style={{
                      padding: '8px 14px', background: INK, color: '#fff',
                      border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                      fontFamily: 'inherit',
                    }}
                  >{saving ? 'Saving…' : 'Save'}</button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    style={{
                      padding: '8px 14px', background: 'transparent', color: SLATE_FG,
                      border: `1px solid ${STONE}`, borderRadius: 6, fontSize: 12.5,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >Cancel</button>
                </div>
              </>
            ) : row?.claim_text ? (
              <div style={{
                fontSize: 14, lineHeight: 1.55, color: INK,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{row.claim_text}</div>
            ) : (
              <div style={{
                fontSize: 13, color: MUTED, fontStyle: 'italic', lineHeight: 1.5,
              }}>
                This layer is empty. Click Edit to fill it, or fill it through Door A's guided flow.
              </div>
            )}

            {error && (
              <div role="alert" style={{
                fontSize: 12, color: '#be123c', fontFamily: FONT_MONO,
              }}>Save failed: {error}</div>
            )}
          </section>

          {/* Source picker */}
          {!layer.hideSource && (
            <section style={{
              padding: '16px 18px', background: '#fff',
              border: `1px solid ${TAN}`, borderRadius: 10,
            }}>
              <SourcePicker
                value={row?.source_value ?? null}
                layerId={layer.id}
                onChange={(next) => { void onSourceChange(next); }}
                disabled={saving}
              />
              {row?.source_value && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9.5, color: MUTED,
                    letterSpacing: '0.06em',
                  }}>CURRENT</span>
                  <SourcePill src={row.source_value} />
                </div>
              )}
            </section>
          )}

          {/* Pushback */}
          {pushback && (
            <section style={{
              padding: '14px 18px', borderRadius: 10,
              background: AMBER_SOFT, border: `1px solid ${AMBER_LINE}`,
              borderLeft: `3px solid ${AMBER_FG}`,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#92400e',
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                marginBottom: 6,
              }}>Pushback at tier {tier} · {evaluator}</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 16, lineHeight: 1.4,
                color: INK, fontStyle: 'italic',
              }}>&ldquo;{pushback}&rdquo;</div>
            </section>
          )}

          {/* Per-layer assumption candidates */}
          {layerCandidates.length > 0 && (
            <section style={{
              padding: '16px 18px', background: '#fff',
              border: `1px solid ${TAN}`, borderRadius: 10,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, color: INK,
                  letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                }}>Assumption candidates from this layer</div>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED,
                  letterSpacing: '0.06em',
                }}>{layerCandidates.length} pending</span>
              </div>
              {layerCandidates.map((c) => (
                <div key={c.rule_id} style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: PAPER, border: `1.5px solid ${TEAL}`,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{
                    fontSize: 13.5, color: INK, lineHeight: 1.4, fontWeight: 500,
                  }}>{c.assumption_text}</div>
                  {c.notes && (
                    <div style={{
                      fontSize: 11.5, color: SLATE_FG, fontStyle: 'italic',
                      lineHeight: 1.4,
                    }}>{c.notes}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        void promote(c).catch((e) => {
                          setError(e instanceof Error ? e.message : 'Could not add to stack');
                        });
                      }}
                      aria-label={`Add to stack: ${c.assumption_text}`}
                      style={{
                        padding: '6px 12px', background: INK, color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >Add to stack</button>
                    <button
                      type="button"
                      onClick={() => { void dismissCandidate(c); }}
                      aria-label={`Dismiss candidate: ${c.assumption_text}`}
                      style={{
                        padding: '6px 12px', background: 'transparent', color: SLATE_FG,
                        border: `1px solid ${STONE}`, borderRadius: 6, fontSize: 12,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >Dismiss</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Empty-candidates state, only after the layer is filled */}
          {layerCandidates.length === 0 && row?.claim_text && (
            <div style={{
              fontSize: 12, color: MUTED, fontStyle: 'italic', lineHeight: 1.5,
              padding: '12px 16px', borderRadius: 8,
              background: 'transparent', border: `1px dashed ${STONE}`,
            }}>
              No outstanding assumption candidates from this layer right now.
              Cross-layer flags still live on the Assumption stack page.
            </div>
          )}
          </>
          )}
        </main>

        <aside style={{
          padding: '24px 18px', background: '#f4f1ea',
          position: 'sticky', top: 64, alignSelf: 'flex-start',
          height: 'calc(100vh - 64px)', overflow: 'auto',
        }}>
          <StageGatesPanel
            gates={gates}
            stage={stage}
            onLayerClick={(id) => navigate(`/v3/layer/${projectId}/${id}`)}
            restrictToLayer={layer.id}
            showStageLabel={false}
            title="Contributing to"
          />
        </aside>
      </div>
    </PageShell>
  );
}
