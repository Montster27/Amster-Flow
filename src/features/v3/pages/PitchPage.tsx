// Investor pitch view — beats from real layer state.
// Each beat reads claim_text from a layer. Below tier 3 → pushback callout.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import { PageShell, VentureHeader } from '../components/atoms';
import { PK_LAYER_BY_ID, pkTier } from '../lib/layers';
import { lookupPushback } from '../lib/voice';
import type { Evaluator } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

interface Beat {
  layerId: string;
  label: string;
}

const BEATS: readonly Beat[] = [
  { layerId: 'customerSegment',   label: 'Who' },
  { layerId: 'problem',           label: 'What hurts' },
  { layerId: 'painScale',         label: 'How much' },
  { layerId: 'solution',          label: 'What we do' },
  { layerId: 'businessModel',     label: 'How we earn' },
  { layerId: 'competitiveMarket', label: 'Why us' },
  { layerId: 'product',           label: 'What you see' },
];

const EVALUATORS: { value: Evaluator; label: string }[] = [
  { value: 'investor', label: 'Investor' },
  { value: 'customer', label: 'Customer' },
  { value: 'grant',    label: 'Grant' },
  { value: 'advisor',  label: 'Advisor' },
];

export default function PitchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const { stack, loading, error, gates } = useLayerStack(projectId);
  const [idx, setIdx] = useState(0);

  if (!projectId) return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  if (loading || vLoading) return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  if (error) {
    return <PageShell>
      <div role="alert" style={{ padding: 40, color: '#be123c' }}>Failed to load: {error}</div>
    </PageShell>;
  }

  const evaluator = venture?.evaluator ?? 'investor';
  const current = BEATS[idx];
  const layer = PK_LAYER_BY_ID[current.layerId];
  const cell = stack[current.layerId];
  const tier = pkTier(current.layerId, cell?.source_value);
  const pushback = lookupPushback(current.layerId, tier, evaluator);

  return (
    <PageShell>
      <VentureHeader
        ventureName="Investor pitch run"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.12em',
            }}>EVALUATOR</span>
            <select
              value={evaluator}
              onChange={(e) => { void updateVenture({ evaluator: e.target.value as Evaluator }); }}
              style={{
                padding: '5px 8px', border: '1px solid #d6cfb8', borderRadius: 6,
                background: '#fff', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              {EVALUATORS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => navigate(`/v3/dashboard/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#475569',
                border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Dashboard</button>
          </div>
        }
      />

      <div style={{ padding: '14px 28px', display: 'flex', gap: 8 }}>
        {BEATS.map((b, i) => (
          <span
            key={b.layerId}
            style={{
              width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
              background: i === idx ? '#0b1220' : i < idx ? '#0f766e' : '#e2e8f0',
              transition: 'all 0.15s',
            }}
          />
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1.55fr 1fr', minHeight: 'calc(100vh - 130px)',
      }}>
        <div style={{
          padding: '40px 56px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', borderRight: '1px solid #ece6d6',
        }}>
          <div>
            {/* Sprint 3 T13 — drop L-numbers from beat headers. The beat label
                (Who / What hurts / How much) carries the meaning; layer numbers
                are out of narrative order here and read as clutter. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#0f766e',
                letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                padding: '4px 10px', background: '#dcfce7', borderRadius: 3,
              }}>{current.label}</span>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>{layer.name}</span>
            </div>

            <div style={{
              fontFamily: FONT_SERIF, fontSize: 42,
              color: '#0b1220', lineHeight: 1.12, letterSpacing: '-0.018em',
              maxWidth: 720,
            }}>&ldquo;{cell?.claim_text || layer.q}&rdquo;</div>

            {!cell?.claim_text && (
              <div style={{
                marginTop: 16, fontFamily: FONT_MONO, fontSize: 11,
                color: '#94a3b8', letterSpacing: '0.06em',
              }}>
                No claim yet. <button
                  type="button"
                  onClick={() => navigate(`/v3/door-b/${projectId}#${layer.id}`)}
                  style={{
                    background: 'none', border: 'none', color: '#0f766e',
                    cursor: 'pointer', fontFamily: 'inherit', padding: 0, fontSize: 11,
                    textDecoration: 'underline',
                  }}
                >fill it in</button>.
              </div>
            )}

            {pushback && (
              <div style={{
                marginTop: 24, padding: '14px 18px',
                background: '#fff8eb', border: '1px solid #fde68a',
                borderLeft: '3px solid #b45309', borderRadius: 8,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#b45309',
                    color: '#fff', fontFamily: FONT_SERIF, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontStyle: 'italic',
                  }}>M</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9.5, color: '#92400e',
                    letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                  }}>Pushback at tier {tier}</span>
                </div>
                <div style={{
                  fontFamily: FONT_SERIF, fontSize: 17,
                  lineHeight: 1.4, color: '#0b1220', fontStyle: 'italic',
                }}>&ldquo;{pushback}&rdquo;</div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 24, borderTop: '1px solid #ece6d6', marginTop: 24,
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
            >← Prev{idx > 0 ? `: ${BEATS[idx - 1].label}` : ''}</button>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.12em',
            }}>BEAT {idx + 1} OF {BEATS.length}</span>
            <button
              type="button"
              onClick={() => setIdx((i) => Math.min(BEATS.length - 1, i + 1))}
              disabled={idx === BEATS.length - 1}
              style={{
                padding: '10px 16px', background: idx === BEATS.length - 1 ? '#e2e8f0' : '#0b1220',
                color: idx === BEATS.length - 1 ? '#94a3b8' : '#fff', border: 'none',
                borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                cursor: idx === BEATS.length - 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >Next{idx < BEATS.length - 1 ? `: ${BEATS[idx + 1].label}` : ''} →</button>
          </div>
        </div>

        <aside style={{
          padding: '24px 22px', overflow: 'auto', background: '#f4f1ea',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
          }}>Up next</div>
          {/* Sprint 3 T13 — show only the immediate next beat in detail; the
              remaining beats collapse to a count so the founder's attention
              stays on what's coming next, not the whole remaining run. */}
          {(() => {
            const remaining = BEATS.slice(idx + 1);
            if (remaining.length === 0) {
              return (
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
                  letterSpacing: '0.08em',
                }}>End of pitch.</div>
              );
            }
            const nextBeat = remaining[0];
            const BL = PK_LAYER_BY_ID[nextBeat.layerId];
            const bcell = stack[nextBeat.layerId];
            const btier = pkTier(nextBeat.layerId, bcell?.source_value);
            const heat = btier < 3;
            const extra = remaining.length - 1;
            return (
              <>
                <button
                  type="button"
                  onClick={() => setIdx(BEATS.findIndex((x) => x.layerId === nextBeat.layerId))}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px', background: '#fff',
                    border: heat ? '1px solid #fde68a' : '1px solid #e8dfc9',
                    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8,
                  }}>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                      color: '#0f766e', letterSpacing: '0.08em',
                    }}>{nextBeat.label}</span>
                  </div>
                  <div style={{
                    fontSize: 12.5, color: '#0b1220', lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    fontWeight: 500,
                  }}>{bcell?.claim_text || BL.q}</div>
                  {heat && (
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 9, color: '#92400e',
                      letterSpacing: '0.08em', fontWeight: 700,
                    }}>EXPECT PUSHBACK</span>
                  )}
                </button>
                {extra > 0 && (
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
                    letterSpacing: '0.08em', fontWeight: 500,
                    padding: '2px 4px',
                  }}>+ {extra} more {extra === 1 ? 'beat' : 'beats'}</div>
                )}
              </>
            );
          })()}
        </aside>
      </div>
    </PageShell>
  );
}
