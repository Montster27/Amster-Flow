// Converged dashboard — both doors land here. 4×4 grid of layer cards
// driven by real layer_state rows. HEAT pills surface on critical layers
// below tier 3.

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import { GateBadge, PageShell, TierLadder, VentureHeader } from '../components/atoms';
import { PromptsPanel } from '../components/PromptsPanel';
import { IndustrySwitcher } from '../components/IndustrySwitcher';
import { layersFor } from '../lib/industryVariants';
import { PK_GATES, PK_LAYER_BY_ID, pkTier } from '../lib/layers';
import { lookupPushback } from '../lib/voice';
import { deriveAllPrompts, type ActivePrompt } from '../lib/prompts';
import type { Industry, LayerStateRow } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

// 1-10 spelled out; bare number after. Lowercase so it slots into mid-sentence
// templates ("and one layer is on tests"). Templates handle their own
// sentence-initial capitalization.
function numberWord(n: number): string {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return n >= 0 && n <= 10 ? words[n] : String(n);
}

// Returns the single CPF requirement that's exactly one tier short — i.e. one
// source upgrade on this layer would clear CPF. Null if zero or more than one
// requirement is unmet, or if the gap is more than one. Drives Rule 4 below.
function findOneUpgradeFromCPF(
  stack: Record<string, LayerStateRow | undefined>,
): { id: string; name: string } | null {
  const unmet: { id: string; gap: number }[] = [];
  for (const r of PK_GATES.cpf.reqs) {
    const tier = pkTier(r.layer, stack[r.layer]?.source_value);
    const gap = r.tier - tier;
    if (gap > 0) unmet.push({ id: r.layer, gap });
  }
  if (unmet.length !== 1 || unmet[0].gap !== 1) return null;
  const layer = PK_LAYER_BY_ID[unmet[0].id];
  return layer ? { id: layer.id, name: layer.name } : null;
}

// State line for the Stack summary panel. Rule-driven from stack state —
// never hand-authored per user. Voice and structure approved by Monty
// 2026-05-27; if you edit, keep the structural rule but match the voice
// (declarative, no validation theater).
function deriveStateLine(args: {
  filled: number;
  totalLayers: number;
  stage: 'cpf' | 'psf' | 'bmv' | null;
  stack: Record<string, LayerStateRow | undefined>;
}): string {
  const { filled, stage, stack } = args;

  const cpfCleared = stage !== null;
  const psfCleared = stage === 'psf' || stage === 'bmv';
  const atCPF = stage === 'cpf';
  const beyondCPF = psfCleared;
  const hasPrototype = Object.values(stack).some((r) => r?.source_value === 'prototype');

  // Investor-critical band: cat === 'critical' (7 layers — the 6 foundation
  // plus product). filledCritical only counts layers with a written claim.
  const criticalFilled = Object.values(PK_LAYER_BY_ID)
    .filter((L) => L.cat === 'critical')
    .map((L) => ({ L, row: stack[L.id] }))
    .filter(({ row }) => row?.claim_text && row.claim_text.trim().length > 0);
  const allCriticalOnExperience = criticalFilled.length > 0
    && criticalFilled.every(({ row }) => row?.source_value === 'experience');

  // Rule 1 — empty stack
  if (filled === 0) {
    return "You haven't filled anything yet. Pick a door and start. The stack doesn't fill itself.";
  }

  // Rule 2 — beyond CPF, some layers on prototype tests
  if (beyondCPF && hasPrototype) {
    const prototypeCount = Object.values(stack).filter((r) => r?.source_value === 'prototype').length;
    const verb = prototypeCount === 1 ? 'layer is' : 'layers are';
    return `You're at CPF, and ${numberWord(prototypeCount)} ${verb} on tests instead of opinions. That's where the doubt actually starts thinning. Open Pitch view and find the one that's still soft.`;
  }

  // Rule 3 — at CPF on experience
  if (atCPF) {
    return "You're at CPF on experience. That removes your doubt. It doesn't remove an investor's. Open Pitch view — find the claim that still has doubt in it.";
  }

  // Rule 4 — one source upgrade from clearing CPF
  if (!cpfCleared) {
    const oneAway = findOneUpgradeFromCPF(stack);
    if (oneAway) {
      return `${oneAway.name} is one source upgrade from clearing CPF. Interviews or a prototype test removes the doubt this layer still carries. Nothing else moves the gate.`;
    }
  }

  // Rule 5 — partial fill, all investor-critical layers on experience
  if (criticalFilled.length > 0 && allCriticalOnExperience) {
    const layerWord = criticalFilled.length === 1 ? 'layer' : 'layers';
    const ownDoubt = criticalFilled.length === 1 ? 'On experience' : 'All on experience';
    return `Filled ${numberWord(criticalFilled.length)} investor-critical ${layerWord}. ${ownDoubt} — your own doubt, removed. The investor still has theirs. Pick the layer most likely to fall first and go remove their doubt.`;
  }

  // Rule 6 — fallback (partial, mixed sources, not yet at a gate)
  return `Filled ${numberWord(filled)} of 16 layers. Keep going — the gates don't move until the sources do.`;
}

// Map a prompt to a featured "next move" view. Keeps the prompt's locked
// voice for headline/body; only the kicker is reframed as directional.
function featuredKicker(prompt: ActivePrompt): string {
  switch (prompt.kind) {
    case 'gap':        return 'Closest unlock';
    case 'assumption': return 'Next move';
    case 'stagnation': return 'Step back';
  }
}

function StackSummary({
  stateLine, featured, flagsCount, flagsExpanded, onToggleFlags,
  onOpenLayer, onOpenPitch, hasFilled,
}: {
  stateLine: string;
  featured: ActivePrompt | null;
  flagsCount: number;
  flagsExpanded: boolean;
  onToggleFlags: () => void;
  onOpenLayer: (layerId: string) => void;
  onOpenPitch: () => void;
  hasFilled: boolean;
}) {
  return (
    <section style={{
      padding: '18px 22px', marginBottom: 18,
      background: '#fff', border: '1px solid #e8dfc9', borderRadius: 12,
      borderLeft: '3px solid #0f766e',
    }}>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, color: '#0f766e',
        letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase',
        marginBottom: 8,
      }}>Stack summary</div>
      <div style={{
        fontFamily: FONT_SERIF, fontSize: 22, color: '#0b1220',
        letterSpacing: '-0.008em', lineHeight: 1.32, marginBottom: 14,
      }}>{stateLine}</div>

      {featured ? (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 18,
          alignItems: 'center',
          padding: '12px 14px', borderRadius: 8,
          background: '#f4f1ea', border: '1px solid #e8dfc9',
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9.5, color: '#92400e',
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
              marginBottom: 3,
            }}>{featuredKicker(featured)}</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
              lineHeight: 1.3, letterSpacing: '-0.005em',
            }}>{featured.headline}</div>
            <div style={{
              fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.45,
            }}>{featured.body}</div>
          </div>
          {featured.layerId && (
            <button
              type="button"
              onClick={() => onOpenLayer(featured.layerId!)}
              style={{
                padding: '8px 14px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >Open {PK_LAYER_BY_ID[featured.layerId]?.name ?? 'layer'} →</button>
          )}
        </div>
      ) : hasFilled ? (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 18,
          alignItems: 'center',
          padding: '12px 14px', borderRadius: 8,
          background: '#f4f1ea', border: '1px solid #e8dfc9',
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9.5, color: '#0f766e',
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
              marginBottom: 3,
            }}>Next move</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 16, color: '#0b1220',
              lineHeight: 1.3, letterSpacing: '-0.005em',
            }}>Pressure-test what you have.</div>
            <div style={{
              fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.45,
            }}>No active flags. Pitch view walks an investor through the stack one beat at a time.</div>
          </div>
          <button
            type="button"
            onClick={onOpenPitch}
            style={{
              padding: '8px 14px', background: '#0b1220', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >Pitch view →</button>
        </div>
      ) : null}

      {flagsCount > 0 && (
        <button
          type="button"
          onClick={onToggleFlags}
          aria-expanded={flagsExpanded}
          style={{
            marginTop: 14, padding: 0, background: 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, color: '#475569',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
          }}>{flagsExpanded ? '▾' : '▸'}</span>
          <span>{flagsExpanded ? 'Hide' : 'See'} all flags ({flagsCount})</span>
        </button>
      )}
    </section>
  );
}

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
  const [flagsExpanded, setFlagsExpanded] = useState(false);

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

  const stateLine = deriveStateLine({ filled, totalLayers, stage, stack });
  const featured: ActivePrompt | null = prompts[0] ?? null;
  const flagsCount = prompts.length + (pressLayer && pressLine ? 1 : 0);

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
        <StackSummary
          stateLine={stateLine}
          featured={featured}
          flagsCount={flagsCount}
          flagsExpanded={flagsExpanded}
          onToggleFlags={() => setFlagsExpanded((v) => !v)}
          onOpenLayer={(layerId) => navigate(`/v3/door-b/${projectId}#${layerId}`)}
          onOpenPitch={() => navigate(`/v3/pitch/${projectId}`)}
          hasFilled={filled > 0}
        />

        {flagsExpanded && (
          <>
            <PromptsPanel
              prompts={prompts}
              onOpenLayer={(layerId) => navigate(`/v3/door-b/${projectId}#${layerId}`)}
            />
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
          </>
        )}

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
