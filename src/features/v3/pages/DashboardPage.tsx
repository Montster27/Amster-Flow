// Converged dashboard — both doors land here. 4×4 grid of layer cards
// driven by real layer_state rows. HEAT pills surface on critical layers
// below tier 3.

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import { GateBadge, PageShell, TierLadder, VentureHeader } from '../components/atoms';
import { PromptsPanel } from '../components/PromptsPanel';
import { IndustrySwitcher } from '../components/IndustrySwitcher';
import { layersFor } from '../lib/industryVariants';
import { pkTier } from '../lib/layers';
import { lookupPushback } from '../lib/voice';
import { deriveAllPrompts } from '../lib/prompts';
import type { Industry } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

export default function V3DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const { rows, stack, loading, error, gates, stage, filled, totalLayers } = useLayerStack(projectId);
  const industry: Industry = (venture?.industry_variant ?? 'software') as Industry;
  const layers = useMemo(() => layersFor(industry), [industry]);
  const prompts = useMemo(
    () => deriveAllPrompts({ stack, rows, stage }),
    [stack, rows, stage],
  );

  if (!projectId) return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  if (loading || vLoading) return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  if (error) {
    return <PageShell>
      <div role="alert" style={{ padding: 40, color: '#be123c' }}>Failed to load: {error}</div>
    </PageShell>;
  }

  // Find highest-priority pressure layer (lowest tier critical layer)
  const press = ['customerSegment', 'problem', 'painScale', 'competitiveMarket', 'solution', 'businessModel', 'product']
    .map((id) => ({ id, tier: pkTier(id, stack[id]?.source_value) }))
    .filter((x) => x.tier < 3)
    .sort((a, b) => a.tier - b.tier)[0];
  const pressLayer = press ? layers.find((L) => L.id === press.id) : null;
  const pressLine = press
    ? lookupPushback(press.id, press.tier, venture?.evaluator ?? 'investor')
    : null;

  return (
    <PageShell>
      <VentureHeader
        ventureName="Stack dashboard"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IndustrySwitcher
              current={industry}
              onChange={(next) => { void updateVenture({ industry_variant: next }); }}
            />
            <button
              type="button"
              onClick={() => navigate(`/v3/door-b/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#475569',
                border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Edit stack</button>
            <button
              type="button"
              onClick={() => navigate(`/v3/assumptions/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#475569',
                border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Assumptions</button>
            <button
              type="button"
              onClick={() => navigate(`/v3/mini-process/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: '#475569',
                border: '1px solid #d6cfb8', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Mini-processes</button>
            <button
              type="button"
              onClick={() => navigate(`/v3/pitch/${projectId}`)}
              style={{
                padding: '7px 12px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Pitch view →</button>
          </div>
        }
      />

      <div style={{ padding: '20px 28px' }}>
        <PromptsPanel
          prompts={prompts}
          onOpenLayer={(layerId) => navigate(`/v3/door-b/${projectId}#${layerId}`)}
        />

        <div style={{
          display: 'flex', gap: 18, alignItems: 'baseline', marginBottom: 18,
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.12em', fontWeight: 700,
            }}>FILLED</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 26, color: '#0b1220', lineHeight: 1,
            }}>{filled}<span style={{ color: '#cbd5e1' }}>/{totalLayers}</span></div>
          </div>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.12em', fontWeight: 700,
            }}>STAGE</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 26, color: stage ? '#0f766e' : '#94a3b8',
              lineHeight: 1, textTransform: 'uppercase',
            }}>{stage ?? 'pre-cpf'}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {gates.map((g) => <GateBadge key={g.id} gate={g} />)}
          </div>
        </div>

        {pressLayer && pressLine && (
          <div style={{
            padding: '14px 18px', borderRadius: 10, marginBottom: 16,
            background: '#fff8eb', border: '1px solid #fde68a',
            borderLeft: '3px solid #b45309',
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18,
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#92400e',
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
            }}>Heat ▸ L{String(pressLayer.n).padStart(2, '0')} {pressLayer.name}</span>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
              lineHeight: 1.35, fontStyle: 'italic',
            }}>&ldquo;{pressLine}&rdquo;</div>
            <button
              type="button"
              onClick={() => navigate(`/v3/door-b/${projectId}#${pressLayer.id}`)}
              style={{
                padding: '7px 12px', background: '#b45309', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Open layer →</button>
          </div>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {layers.map((L) => {
            const cell = stack[L.id];
            const isCrit = L.cat === 'critical';
            const tier = pkTier(L.id, cell?.source_value);
            const heat = isCrit && tier < 3;
            return (
              <button
                key={L.id}
                type="button"
                onClick={() => navigate(`/v3/door-b/${projectId}#${L.id}`)}
                style={{
                  textAlign: 'left', padding: '12px 14px', minHeight: 110,
                  background: isCrit ? '#fff' : '#fbfaf7',
                  border: heat ? '1px solid #fcd34d'
                    : isCrit ? '1px solid #0f766e'
                    : '1px solid #e8dfc9',
                  boxShadow: heat ? '0 0 0 3px rgba(251,191,36,0.18)'
                    : isCrit ? '0 0 0 3px rgba(15,118,110,0.06)'
                    : 'none',
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                    color: isCrit ? '#0f766e' : '#cbd5e1', letterSpacing: '0.08em',
                  }}>L{String(L.n).padStart(2, '0')}</span>
                  {heat && (
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 8.5, fontWeight: 700,
                      color: '#92400e', background: '#fef3c7',
                      padding: '2px 5px', borderRadius: 3, letterSpacing: '0.08em',
                    }}>HEAT</span>
                  )}
                </div>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: isCrit ? 600 : 500,
                    color: isCrit ? '#0b1220' : '#475569', lineHeight: 1.25,
                  }}>{L.name}</div>
                  {isCrit && cell?.claim_text && (
                    <div style={{
                      fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{cell.claim_text}</div>
                  )}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                }}>
                  <TierLadder tier={tier} tone={isCrit ? 'critical' : 'thoughtful'} size="sm" />
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, color: '#94a3b8',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>{cell?.source_value ?? '—'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
