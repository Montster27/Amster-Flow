// Surface 4 · Converged dashboard. DashMid (4×4 grid) toggles with DashTight (stack-health).

import type { ReactNode } from 'react';
import { PK_GATES, PK_LAYERS, PK_VOICE, pkBuildStack, pkFilledCount, pkTier, VENTURE } from '../data';
import type { Evaluator, Industry, StackState } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

function MHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <div style={{
      padding: '14px 24px', borderBottom: '1px solid #ece6d6',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fbfaf7',
    }}>
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600,
        }}>{kicker}</div>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 20, color: '#0b1220',
          marginTop: 2, letterSpacing: '-0.01em',
        }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function MBar({ tier, max = 5, tone = 'teal' }: { tier: number; max?: number; tone?: 'teal' | 'amber' }) {
  const accent = tone === 'amber' ? '#b45309' : '#0f766e';
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          width: 8, height: 4, borderRadius: 1,
          background: i < tier ? accent : '#e2e8f0',
        }} />
      ))}
    </div>
  );
}

// 4×4 grid of layer mini-cards (one screen, no scroll)
export function DashMid({
  industry = 'software', state = 'midCPF', evaluator = 'investor',
}: { industry?: Industry; state?: StackState; evaluator?: Evaluator }) {
  const v = VENTURE[industry];
  const stack = pkBuildStack(industry, state);
  const filled = pkFilledCount(stack);
  const cpf = PK_GATES.cpf;
  const cpfPassed = cpf.reqs.filter((r) => pkTier(r.layer, stack[r.layer]?.src) >= r.tier).length;

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <MHead
        kicker={`${v.name} · ${v.industry} · stack`}
        title={v.tagline}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>FILLED</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 20, color: '#0b1220', lineHeight: 1,
              }}>{filled}<span style={{ color: '#cbd5e1' }}>/16</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>CPF</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 20, color: '#0f766e', lineHeight: 1,
              }}>{cpfPassed}<span style={{ color: '#cbd5e1' }}>/{cpf.reqs.length}</span></div>
            </div>
            <button type="button" style={{
              padding: '7px 12px', background: '#0b1220', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}>Pitch view →</button>
          </div>
        }
      />

      <div style={{
        flex: 1, padding: '18px 24px', display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(0, 1fr)',
        gap: 10, overflow: 'hidden',
      }}>
        {PK_LAYERS.map((L) => {
          const cell = stack[L.id];
          const isCrit = L.cat === 'critical';
          const tier = cell?.tier || 0;
          const heat = isCrit && tier < 3;
          return (
            <div key={L.id} style={{
              padding: '10px 12px',
              background: isCrit ? '#fff' : '#fbfaf7',
              border: heat ? '1px solid #fcd34d'
                : isCrit ? '1px solid #0f766e'
                : '1px solid #e8dfc9',
              boxShadow: heat ? '0 0 0 3px rgba(251,191,36,0.18)'
                : isCrit ? '0 0 0 3px rgba(15,118,110,0.06)'
                : 'none',
              borderRadius: 8,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              gap: 6, minWidth: 0,
            }}>
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
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: isCrit ? 600 : 500,
                  color: isCrit ? '#0b1220' : '#475569', lineHeight: 1.2,
                  letterSpacing: '-0.005em',
                }}>{L.name}</div>
                {isCrit && cell?.text && (
                  <div style={{
                    fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 1.35,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{cell.text}</div>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
              }}>
                <MBar tier={tier} tone={heat ? 'amber' : 'teal'} />
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 9, color: '#94a3b8',
                  letterSpacing: '0.04em',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: 80, textTransform: 'uppercase',
                }}>{cell?.src || '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '10px 24px', borderTop: '1px solid #ece6d6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
            letterSpacing: '0.1em',
          }}>EVALUATOR</span>
          {(['investor', 'customer', 'grant', 'advisor'] as const).map((e) => (
            <span key={e} style={{
              fontSize: 10.5, fontFamily: FONT_MONO, letterSpacing: '0.06em',
              textTransform: 'uppercase', fontWeight: e === evaluator ? 700 : 400,
              color: e === evaluator ? '#0b1220' : '#94a3b8',
              borderBottom: e === evaluator ? '2px solid #0f766e' : '2px solid transparent',
              paddingBottom: 2,
            }}>{e}</span>
          ))}
        </div>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
          letterSpacing: '0.08em',
        }}>Last edit · 4m ago</span>
      </div>
    </div>
  );
}

// Stack-health diagnostic
export function DashTight({
  industry = 'software', state = 'midCPF', evaluator = 'investor',
}: { industry?: Industry; state?: StackState; evaluator?: Evaluator }) {
  const v = VENTURE[industry];
  const stack = pkBuildStack(industry, state);
  const filled = pkFilledCount(stack);

  const bands = [
    { id: 'critical',  label: 'Critical band',  hint: 'Investor-load-bearing',
      ids: ['customerSegment', 'problem', 'painScale', 'solution', 'businessModel', 'competitiveMarket', 'product'] },
    { id: 'strategy',  label: 'Strategy',       hint: 'Long-arc questions',
      ids: ['worldImpact', 'exit', 'sectorMapping', 'marketExpansion', 'company'] },
    { id: 'execution', label: 'Execution',      hint: 'Becomes specific later',
      ids: ['requirements', 'design', 'integrations', 'production'] },
  ];

  const cpf = PK_GATES.cpf;
  const cpfPassed = cpf.reqs.filter((r) => pkTier(r.layer, stack[r.layer]?.src) >= r.tier).length;

  const press = ['customerSegment', 'problem', 'painScale', 'competitiveMarket', 'solution', 'businessModel', 'product']
    .map((id) => ({ id, tier: stack[id]?.tier || 0 }))
    .filter((x) => x.tier < 3)
    .sort((a, b) => a.tier - b.tier)[0];
  const pressLayer = press ? PK_LAYERS.find((L) => L.id === press.id) : null;
  const pressLine = press ? PK_VOICE.pushback[press.id]?.[press.tier] : null;

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <MHead
        kicker={`${v.name} · ${v.industry} · stack health`}
        title={v.tagline}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>FILLED</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 22, color: '#0b1220', lineHeight: 1,
              }}>{filled}<span style={{ color: '#cbd5e1' }}>/16</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>CPF GATE</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 22, color: '#0f766e', lineHeight: 1,
              }}>{cpfPassed}<span style={{ color: '#cbd5e1' }}>/{cpf.reqs.length}</span></div>
            </div>
            <button type="button" style={{
              padding: '8px 14px', background: '#0b1220', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}>Pitch view →</button>
          </div>
        }
      />

      <div style={{
        flex: 1, padding: '20px 24px', display: 'grid',
        gridTemplateColumns: '1fr', gridTemplateRows: 'auto auto 1fr',
        gap: 16, overflow: 'hidden',
      }}>
        {press && pressLayer && (
          <div style={{
            padding: '14px 20px', borderRadius: 10,
            background: '#fff8eb', border: '1px solid #fde68a',
            borderLeft: '3px solid #b45309',
            display: 'grid', gridTemplateColumns: 'auto 1fr auto',
            gap: 18, alignItems: 'center',
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#92400e',
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
            }}>Heat ▸ L{String(pressLayer.n).padStart(2, '0')} {pressLayer.name}</span>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 17, color: '#0b1220',
              lineHeight: 1.3, fontStyle: 'italic',
            }}>&ldquo;{pressLine}&rdquo;</div>
            <button type="button" style={{
              padding: '7px 12px', background: '#b45309', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}>Open layer →</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 14 }}>
          {bands.map((b) => {
            const tiers = b.ids.map((id) => stack[id]?.tier || 0);
            const avg = tiers.reduce((a, c) => a + c, 0) / Math.max(1, tiers.length);
            const isCrit = b.id === 'critical';
            return (
              <div key={b.id} style={{
                padding: '16px 18px', borderRadius: 10,
                background: isCrit ? '#fff' : '#fbfaf7',
                border: isCrit ? '1px solid #0f766e' : '1px solid #e8dfc9',
                boxShadow: isCrit ? '0 0 0 4px rgba(15,118,110,0.06)' : 'none',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10,
                    color: isCrit ? '#0f766e' : '#94a3b8',
                    letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                  }}>{b.label}</span>
                  <span style={{
                    fontFamily: FONT_SERIF, fontSize: 24,
                    color: isCrit ? '#0b1220' : '#94a3b8',
                  }}>{avg.toFixed(1)}<span style={{ fontSize: 12, color: '#94a3b8' }}>/5</span></span>
                </div>
                <div style={{
                  fontSize: 11, color: '#94a3b8', marginBottom: 12,
                  fontFamily: FONT_MONO, letterSpacing: '0.04em',
                }}>{b.hint}</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {b.ids.map((id) => {
                    const L = PK_LAYERS.find((x) => x.id === id);
                    if (!L) return null;
                    const t = stack[id]?.tier || 0;
                    return (
                      <div key={id} style={{
                        display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                        alignItems: 'center',
                      }}>
                        <span style={{
                          fontSize: 11.5,
                          color: isCrit ? '#0b1220' : '#64748b',
                          fontWeight: isCrit ? 500 : 400,
                        }}>{L.name}</span>
                        <MBar tier={t} tone={isCrit && t < 2 ? 'amber' : 'teal'} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 14, borderTop: '1px solid #ece6d6',
        }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: '#94a3b8',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>EVALUATOR</span>
            {(['investor', 'customer', 'grant', 'advisor'] as const).map((e) => (
              <span key={e} style={{
                fontSize: 11, fontFamily: FONT_MONO, letterSpacing: '0.06em',
                textTransform: 'uppercase', fontWeight: e === evaluator ? 700 : 400,
                color: e === evaluator ? '#0b1220' : '#94a3b8',
                borderBottom: e === evaluator ? '2px solid #0f766e' : '2px solid transparent',
                paddingBottom: 2,
              }}>{e}</span>
            ))}
          </div>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
            letterSpacing: '0.08em',
          }}>Last edit · 4m ago</span>
        </div>
      </div>
    </div>
  );
}
