// Door A · Guided start — six foundation questions, in the order investors
// press first. Saves to layer_states with real persistence. Graduate to the
// dashboard when the foundation reaches 2 stars across the board.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import { CategoryBadge, PageShell, SourcePicker, TierLadder, VentureHeader } from '../components/atoms';
import { lookupPushback } from '../lib/voice';
import {
  FOUNDATION_QUEUE, PK_LAYER_BY_ID, pkTier,
} from '../lib/layers';
import type { SourceId } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

const SAVE_DEBOUNCE_MS = 800;

export default function DoorAPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const { stack, loading, error, gates, saveLayer, refetch } = useLayerStack(projectId);

  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState('');
  const [draftSource, setDraftSource] = useState<SourceId | null>(null);
  const [pendingSave, setPendingSave] = useState(false);

  const queue = useMemo(() => FOUNDATION_QUEUE.map((id) => PK_LAYER_BY_ID[id]), []);
  const current = queue[idx];

  // Sync draft when active layer changes
  useEffect(() => {
    const cell = stack[current.id];
    setDraft(cell?.claim_text ?? '');
    setDraftSource((cell?.source_value as SourceId | null) ?? null);
  }, [current.id, stack]);

  // Mark door choice on first save
  useEffect(() => {
    if (venture && !venture.door_choice) {
      void updateVenture({ door_choice: 'A' });
    }
  }, [venture, updateVenture]);

  // Debounced auto-save when draft changes (matches user typing)
  useEffect(() => {
    if (!projectId) return;
    const cell = stack[current.id];
    const trimmed = draft.trim();
    const claimChanged = (cell?.claim_text ?? '') !== trimmed;
    if (!claimChanged) return;
    const t = window.setTimeout(async () => {
      setPendingSave(true);
      try {
        await saveLayer(current.id, { claim_text: trimmed.length === 0 ? null : trimmed });
      } finally {
        setPendingSave(false);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [draft, current.id, projectId, saveLayer, stack]);

  if (!projectId) return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  if (loading || vLoading) return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  if (error) {
    return <PageShell>
      <div role="alert" style={{ padding: 40, color: '#be123c' }}>Failed to load: {error}</div>
    </PageShell>;
  }

  const tier = pkTier(current.id, draftSource);
  const evaluator = venture?.evaluator ?? 'investor';
  const pushback = lookupPushback(current.id, tier, evaluator);

  const onSourceChange = async (next: SourceId | null) => {
    setDraftSource(next);
    setPendingSave(true);
    try {
      const trimmed = draft.trim();
      await saveLayer(current.id, {
        claim_text: trimmed.length === 0 ? null : trimmed,
        source_value: next,
      });
    } finally {
      setPendingSave(false);
    }
  };

  const advance = async () => {
    // Force any pending save to flush
    const trimmed = draft.trim();
    const cell = stack[current.id];
    if ((cell?.claim_text ?? '') !== trimmed || (cell?.source_value ?? null) !== draftSource) {
      await saveLayer(current.id, {
        claim_text: trimmed.length === 0 ? null : trimmed,
        source_value: draftSource,
      });
    }
    if (idx < queue.length - 1) {
      setIdx(idx + 1);
    } else {
      // All 6 done — graduate
      await refetch();
      await updateVenture({ has_completed_onboarding: true });
      navigate(`/v3/dashboard/${projectId}`);
    }
  };

  const foundationProgress = queue.map((L) => ({
    L,
    tier: pkTier(L.id, stack[L.id]?.source_value),
    filled: !!stack[L.id]?.claim_text,
  }));
  const cleared = foundationProgress.filter((p) => p.tier >= 2).length;

  return (
    <PageShell>
      <VentureHeader
        ventureName="Door A · Guided start"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <button
            type="button"
            onClick={() => navigate(`/v3/door-b/${projectId}`)}
            style={{
              padding: '7px 12px', background: 'transparent', color: '#475569',
              border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Drop into full stack →</button>
        }
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 320px',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <div style={{
          padding: '40px 56px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', borderRight: '1px solid #ece6d6',
          gap: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <CategoryBadge cat="critical" />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
                letterSpacing: '0.1em',
              }}>L{String(current.n).padStart(2, '0')} · {current.name.toUpperCase()}</span>
            </div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 38,
              lineHeight: 1.12, color: '#0b1220', letterSpacing: '-0.018em',
              maxWidth: 720,
            }}>{current.q}</div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Your claim about ${current.name.toLowerCase()}…`}
              style={{
                marginTop: 24, width: '100%', minHeight: 120, padding: '14px 16px',
                border: '1px solid #d6cfb8', borderRadius: 8,
                fontSize: 14.5, lineHeight: 1.55, fontFamily: 'inherit',
                background: '#fff', color: '#0b1220', resize: 'vertical',
                outline: 'none',
              }}
            />

            <div style={{ marginTop: 16 }}>
              <SourcePicker
                value={draftSource}
                layerId={current.id}
                onChange={(next) => { void onSourceChange(next); }}
              />
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <TierLadder tier={tier} />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
                letterSpacing: '0.06em',
              }}>{tier}/5{pendingSave ? ' · saving' : ''}</span>
            </div>

            {pushback && (
              <div style={{
                marginTop: 18, padding: '14px 16px',
                background: '#fff8eb', border: '1px solid #fde68a',
                borderLeft: '3px solid #b45309', borderRadius: 8,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9.5, color: '#92400e',
                  letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                }}>From Monty · pushback at tier {tier}</div>
                <div style={{
                  fontFamily: FONT_SERIF, fontSize: 15.5, lineHeight: 1.4,
                  color: '#0b1220', fontStyle: 'italic',
                }}>&ldquo;{pushback}&rdquo;</div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 20, borderTop: '1px solid #ece6d6',
          }}>
            <button
              type="button"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              style={{
                padding: '10px 16px', background: 'transparent',
                border: '1px solid #e2e8f0', color: idx === 0 ? '#cbd5e1' : '#64748b',
                fontSize: 12.5, borderRadius: 6,
                cursor: idx === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >← Prev</button>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.12em',
            }}>QUESTION {idx + 1} OF {queue.length}</span>
            <button
              type="button"
              onClick={() => { void advance(); }}
              style={{
                padding: '11px 18px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {idx === queue.length - 1 ? 'Save & graduate to dashboard →' : 'Next question →'}
            </button>
          </div>
        </div>

        <aside style={{
          padding: '20px 18px', overflow: 'auto', background: '#f4f1ea',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#64748b', fontWeight: 700,
              }}>Foundation queue</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#64748b' }}>
                <span style={{ color: '#0f766e', fontWeight: 700 }}>{cleared}</span> / {queue.length} ≥ 2★
              </span>
            </div>
            <div style={{
              height: 4, borderRadius: 2, background: '#e8dfc9', overflow: 'hidden',
            }}>
              <div style={{
                width: `${(cleared / queue.length) * 100}%`, height: '100%',
                background: '#0f766e', transition: 'width .25s',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {foundationProgress.map(({ L, tier: t, filled }, i) => {
              const isCurrent = i === idx;
              return (
                <button
                  key={L.id}
                  type="button"
                  onClick={() => setIdx(i)}
                  style={{
                    textAlign: 'left',
                    display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 10,
                    alignItems: 'flex-start', padding: '10px 12px',
                    background: isCurrent ? '#fff' : 'transparent',
                    border: isCurrent ? '1px solid #0f766e' : '1px solid #e8dfc9',
                    borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10,
                    color: isCurrent ? '#0f766e' : '#94a3b8',
                    letterSpacing: '0.06em', fontWeight: 700, marginTop: 2,
                  }}>L{String(L.n).padStart(2, '0')}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, color: isCurrent ? '#0b1220' : '#475569',
                      fontWeight: isCurrent ? 600 : 500, lineHeight: 1.25,
                    }}>{L.name}</div>
                    {filled && (
                      <div style={{
                        fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                      }}>{stack[L.id]?.claim_text}</div>
                    )}
                  </div>
                  <TierLadder tier={t} size="sm" />
                </button>
              );
            })}
          </div>

          <div style={{
            padding: '10px 12px', borderRadius: 6,
            background: 'rgba(15,118,110,0.06)',
            border: '1px dashed #0f766e',
            fontSize: 11.5, color: '#0b1220', lineHeight: 1.5,
          }}>
            <strong style={{ color: '#0f766e', letterSpacing: '0.02em' }}>Graduates at:</strong> all six layers ≥ 2 stars. The full 16-layer stack unlocks then.
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
