// Surface 5 · Investor-pitch pressure-test. PitchMid (preferred) + PitchTight (alt).

import type { ReactNode } from 'react';
import { PK_LAYERS, PK_VOICE, pkBuildStack, VENTURE } from '../data';
import type { Evaluator, Industry, StackState } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

function PHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
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

function PBar({ tier, max = 5, tone = 'teal' }: { tier: number; max?: number; tone?: 'teal' | 'amber' }) {
  const accent = tone === 'amber' ? '#b45309' : '#0f766e';
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          width: 10, height: 5, borderRadius: 1,
          background: i < tier ? accent : '#e2e8f0',
        }} />
      ))}
    </div>
  );
}

const BEATS = [
  { layer: 'customerSegment',   label: 'Who' },
  { layer: 'problem',           label: 'What hurts' },
  { layer: 'painScale',         label: 'How much' },
  { layer: 'solution',          label: 'What we do' },
  { layer: 'businessModel',     label: 'How we earn' },
  { layer: 'competitiveMarket', label: 'Why us' },
  { layer: 'product',           label: 'What you see' },
] as const;

// PITCH · MID — current beat large + 3 next-beat preview cards
export function PitchMid({
  industry = 'software', state = 'midCPF', evaluator = 'investor',
}: { industry?: Industry; state?: StackState; evaluator?: Evaluator }) {
  const v = VENTURE[industry];
  const stack = pkBuildStack(industry, state);

  const idx = 2;
  const current = BEATS[idx];
  const L = PK_LAYERS.find((x) => x.id === current.layer)!;
  const cell = stack[current.layer];
  const pushback = PK_VOICE.pushback[current.layer]?.[cell?.tier || 0];

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <PHead
        kicker={`${v.name} · pitch · evaluator: ${evaluator}`}
        title={`Beat ${idx + 1} of ${BEATS.length}`}
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            {BEATS.map((_b, i) => (
              <span key={i} style={{
                width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
                background: i === idx ? '#0b1220' : i < idx ? '#0f766e' : '#e2e8f0',
              }} />
            ))}
          </div>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.55fr 1fr', overflow: 'hidden' }}>
        <div style={{
          padding: '30px 36px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', overflow: 'hidden',
          borderRight: '1px solid #ece6d6',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#0f766e',
                letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                padding: '4px 10px', background: '#dcfce7', borderRadius: 3,
              }}>{current.label}</span>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>L{String(L.n).padStart(2, '0')} · {L.name}</span>
            </div>

            <div style={{
              fontFamily: FONT_SERIF, fontSize: 34,
              color: '#0b1220', lineHeight: 1.15, letterSpacing: '-0.015em',
            }}>&ldquo;{cell?.text || L.q}&rdquo;</div>

            {pushback && (
              <div style={{
                marginTop: 22, padding: '14px 16px', background: '#fff8eb',
                border: '1px solid #fde68a', borderLeft: '3px solid #b45309',
                borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#b45309',
                    color: '#fff', fontFamily: FONT_SERIF, fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontStyle: 'italic',
                  }}>M</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9.5, color: '#92400e',
                    letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                  }}>Pushback at tier {cell?.tier || 0}</span>
                </div>
                <div style={{
                  fontFamily: FONT_SERIF, fontSize: 15.5,
                  lineHeight: 1.4, color: '#0b1220', fontStyle: 'italic',
                }}>&ldquo;{pushback}&rdquo;</div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 18, borderTop: '1px solid #ece6d6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PBar tier={cell?.tier || 0} />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
                letterSpacing: '0.06em',
              }}>{cell?.tier || 0}/5 · {cell?.src || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={{
                padding: '8px 12px', background: 'transparent',
                border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12,
                borderRadius: 6, cursor: 'pointer',
              }}>← Prev</button>
              <button type="button" style={{
                padding: '8px 14px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
              }}>Next →</button>
            </div>
          </div>
        </div>

        <div style={{
          padding: '24px 22px', overflow: 'auto', background: '#f4f1ea',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
          }}>Up next</div>
          {BEATS.slice(idx + 1, idx + 5).map((b) => {
            const BL = PK_LAYERS.find((x) => x.id === b.layer)!;
            const bcell = stack[b.layer];
            const btier = bcell?.tier || 0;
            const heat = btier < 3;
            return (
              <div key={b.layer} style={{
                padding: '12px 14px', background: '#fff',
                border: heat ? '1px solid #fde68a' : '1px solid #e8dfc9',
                borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 8,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                    color: '#0f766e', letterSpacing: '0.08em',
                  }}>{b.label}</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
                    letterSpacing: '0.08em',
                  }}>L{String(BL.n).padStart(2, '0')}</span>
                </div>
                <div style={{
                  fontSize: 12.5, color: '#0b1220', lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  fontWeight: 500,
                }}>{bcell?.text || BL.q}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <PBar tier={btier} tone={heat ? 'amber' : 'teal'} />
                  {heat && (
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 9, color: '#92400e',
                      letterSpacing: '0.08em', fontWeight: 700,
                    }}>EXPECT PUSHBACK</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// PITCH · TIGHT — single-beat focus mode
export function PitchTight({
  industry = 'software', state = 'midCPF', evaluator = 'investor',
}: { industry?: Industry; state?: StackState; evaluator?: Evaluator }) {
  const v = VENTURE[industry];
  const stack = pkBuildStack(industry, state);
  const current = BEATS[2];
  const L = PK_LAYERS.find((x) => x.id === current.layer)!;
  const cell = stack[current.layer];
  const pushback = PK_VOICE.pushback[current.layer]?.[cell?.tier || 0];

  const beatsIndex = BEATS.indexOf(current);

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <PHead
        kicker={`${v.name} · pitch run · evaluator: ${evaluator}`}
        title={`Beat ${beatsIndex + 1} of ${BEATS.length}`}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            {BEATS.map((_b, i) => (
              <span key={i} style={{
                width: i === beatsIndex ? 22 : 8, height: 8, borderRadius: 4,
                background: i === beatsIndex ? '#0b1220' : i < beatsIndex ? '#0f766e' : '#e2e8f0',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden' }}>
        <div style={{
          padding: '40px 48px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', overflow: 'hidden',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#0f766e',
                letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                padding: '4px 10px', background: '#dcfce7', borderRadius: 3,
              }}>{current.label}</span>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                letterSpacing: '0.12em',
              }}>L{String(L.n).padStart(2, '0')} · {L.name}</span>
            </div>

            <div style={{
              fontFamily: FONT_SERIF, fontSize: 48,
              color: '#0b1220', lineHeight: 1.08, letterSpacing: '-0.02em',
              maxWidth: 680,
            }}>&ldquo;{cell?.text || L.q}&rdquo;</div>

            <div style={{ marginTop: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
              <PBar tier={cell?.tier || 0} max={5} />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
                letterSpacing: '0.06em',
              }}>{cell?.tier || 0} / 5 · sourced from {cell?.src || '—'}</span>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 24, borderTop: '1px solid #ece6d6',
          }}>
            <button type="button" style={{
              padding: '10px 16px', background: 'transparent',
              border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer',
            }}>← {BEATS[beatsIndex - 1]?.label}</button>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.12em',
            }}>SPACE TO ADVANCE</span>
            <button type="button" style={{
              padding: '10px 16px', background: '#0b1220',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{BEATS[beatsIndex + 1]?.label} →</button>
          </div>
        </div>

        <div style={{
          background: '#0b1220', color: '#fff', padding: '28px 24px',
          display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto',
        }}>
          {pushback ? (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#b45309',
                    color: '#fff', fontFamily: FONT_SERIF, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontStyle: 'italic',
                  }}>M</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, color: '#fcd34d',
                    letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                  }}>Pushback · as {evaluator}</span>
                </div>
                <div style={{
                  fontFamily: FONT_SERIF, fontSize: 22,
                  lineHeight: 1.32, fontStyle: 'italic',
                }}>&ldquo;{pushback}&rdquo;</div>
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, color: '#64748b',
                  letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8,
                  textTransform: 'uppercase',
                }}>To raise this layer</div>
                <ul style={{
                  margin: 0, padding: 0, listStyle: 'none',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.45,
                }}>
                  <li>· 5 willingness-to-pay calls × 30m</li>
                  <li>· Re-rate against the Annoyance/Major scale</li>
                  <li>· Cite at least one paying baseline</li>
                </ul>
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
              letterSpacing: '0.08em',
            }}>No pushback. Cleared.</div>
          )}

          <div style={{
            marginTop: 'auto', fontFamily: FONT_MONO, fontSize: 10,
            color: '#475569', letterSpacing: '0.08em',
          }}>Pushback intensity scales with how far below 3★ you are.</div>
        </div>
      </div>
    </div>
  );
}
