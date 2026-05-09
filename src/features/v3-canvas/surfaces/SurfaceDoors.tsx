// Surface 2 (Door A · guided) + Surface 3 (Door B · snapshot).
// Editorial (preferred) + Strata (alt) for each.

import { CategoryBadge, SourcePicker, SourcePill, TierGlyphs, TierLadder, VoiceCallout, WinHead } from '../atoms';
import {
  PK_LAYERS, PK_SOURCES, pkBuildStack, pkFilledCount, pkTier, VENTURE,
} from '../data';
import type { Industry, PkLayer, StackCell, StackState } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

// ──────────────────────────────────────────────────────────────────
// DOOR A — Guided start. First question is Customer Segment.
// ──────────────────────────────────────────────────────────────────

export function DoorAEditorial({ industry = 'software' }: { industry?: Industry }) {
  const v = VENTURE[industry];

  const candidates = [
    {
      pick: true,
      who: 'Urban dog-owners 28–45 within 24h of loss',
      trigger: 'Pet just escaped — adrenaline + guilt window',
      access: 'warm' as const,
      accessLabel: 'Vet clinics + lost-pet FB groups',
    },
    {
      pick: false,
      who: 'Suburban families with school-age kids who lost a pet 1–7 days ago',
      trigger: 'Need to give the kids an answer by the weekend',
      access: 'cold' as const,
      accessLabel: 'Nextdoor + paid lost-pet alerts',
    },
    {
      pick: false,
      who: 'Senior dog-owners (65+) with mobility limits',
      trigger: "Can't physically search — needs a network",
      access: 'cold' as const,
      accessLabel: 'Senior centers + church groups',
    },
  ];

  const queue = [
    { n: 'L08', name: 'Customer Segment', q: 'Three groups, then pick the sharpest.', t: '5m', s: 'now' as const },
    { n: 'L10', name: 'Problem',          q: 'Trigger event + workaround + cost.', t: '4m', s: 'next' as const },
    { n: 'L11', name: 'Pain Scale',       q: 'Annoyance, Small, Moderate, Major, Requirement.', t: '2m', s: 'queued' as const },
    { n: 'L09', name: 'Solution',         q: "How does it solve the problem? What's the user benefit?", t: '4m', s: 'queued' as const },
    { n: 'L07', name: 'Business Model',   q: 'How does this make money? Who pays?', t: '3m', s: 'queued' as const },
    { n: 'L04', name: 'Competitive Market', q: 'Direct, indirect, do-nothing — the 2-degree map.', t: '4m', s: 'queued' as const },
  ];

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <WinHead
        sub={`Door A · Guided · ${v.name}`}
        title="Question 01 of foundation"
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                width: 22, height: 4, borderRadius: 2,
                background: i === 0 ? '#0f766e' : '#e2e8f0',
              }} />
            ))}
          </div>
        }
      />
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr',
        gap: 0, minHeight: 0,
      }}>
        <div style={{
          padding: '40px 52px 32px', borderRight: '1px solid #ece6d6',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          overflow: 'auto',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <CategoryBadge cat="critical" />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
                letterSpacing: '0.1em',
              }}>L08 · CUSTOMER SEGMENT</span>
            </div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 34,
              lineHeight: 1.16, color: '#0b1220', letterSpacing: '-0.015em',
            }}>List three groups who could buy this. Then pick the sharpest one.</div>
            <div style={{
              fontSize: 13, color: '#64748b', lineHeight: 1.55, marginTop: 12,
              maxWidth: 560,
            }}>
              We start broad before we narrow. Generate three candidate cohorts —
              then collapse to a beachhead. Don&apos;t write &ldquo;everyone with X.&rdquo;
              Sharp boundary, named trigger, an access path you can actually walk.
            </div>

            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidates.map((c, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 14,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  border: `1px solid ${c.pick ? '#0f766e' : '#e8dfc9'}`,
                  background: c.pick ? '#f0faf7' : '#fffdf7',
                  borderRadius: 8, position: 'relative',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', marginTop: 2,
                    border: `1.5px solid ${c.pick ? '#0f766e' : '#cbd5e1'}`,
                    background: c.pick ? '#0f766e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {c.pick && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#fff',
                      }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, color: '#0b1220',
                      fontWeight: c.pick ? 600 : 500, lineHeight: 1.35,
                    }}>{c.who}</div>
                    <div style={{
                      display: 'flex', gap: 14, marginTop: 6,
                      fontSize: 11.5, color: '#64748b',
                      fontFamily: FONT_MONO, letterSpacing: '0.02em',
                    }}>
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>TRIGGER</span>
                        <span style={{ color: '#475569', fontFamily: 'inherit' }}>{c.trigger}</span>
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', gap: 14, marginTop: 3,
                      fontSize: 11.5, color: '#64748b',
                      fontFamily: FONT_MONO, letterSpacing: '0.02em',
                    }}>
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>ACCESS</span>
                        <span style={{ color: '#475569', fontFamily: 'inherit' }}>{c.accessLabel}</span>
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
                    padding: '3px 7px', borderRadius: 4,
                    background: c.access === 'warm' ? '#dcfce7' : '#fef3c7',
                    color: c.access === 'warm' ? '#166534' : '#92400e',
                  }}>{c.access.toUpperCase()}</div>
                </div>
              ))}
              <button type="button" style={{
                alignSelf: 'flex-start', padding: '6px 10px', marginTop: 2,
                fontSize: 12, color: '#64748b', background: 'transparent',
                border: '1px dashed #cbd5e1', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>+ another candidate</button>
            </div>

            <div style={{
              marginTop: 20, paddingTop: 16, borderTop: '1px solid #ece6d6',
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
                color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600,
                marginBottom: 8,
              }}>Your beachhead, sharpened</div>
              <textarea
                style={{
                  width: '100%', minHeight: 64, padding: '10px 12px',
                  border: '1px solid #d6cfb8', borderRadius: 8, fontSize: 14,
                  lineHeight: 1.5, background: '#fff', color: '#0b1220',
                  resize: 'none', fontFamily: 'inherit', outline: 'none',
                }}
                defaultValue="Urban dog-owners 28–45 inside the first 24h of loss. Reachable through vet clinics and city-specific lost-pet FB groups."
              />
              <div style={{ marginTop: 12 }}>
                <SourcePicker value="experience" layerId="customerSegment" />
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', marginTop: 22,
            paddingTop: 16, borderTop: '1px solid #ece6d6',
          }}>
            <button type="button" style={{
              padding: '11px 20px', background: '#0b1220', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 500,
              cursor: 'pointer',
            }}>Save beachhead &amp; continue →</button>
            <button type="button" style={{
              padding: '11px 14px', background: 'transparent', color: '#475569',
              border: 'none', fontSize: 13, cursor: 'pointer',
            }}>Drop me into the dashboard</button>
          </div>
        </div>
        <div style={{
          padding: '40px 40px 32px', background: '#f4f1ea',
          display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto',
        }}>
          <VoiceCallout
            kicker="From Monty"
            quote="If your customer segment is a market, you're already losing the meeting. A beachhead is sharp enough to cut paper."
            tail="Investors rate this layer first because it predicts everything else. Don't optimize for being right — optimize for being specific enough to be wrong."
          />

          <div style={{
            padding: '14px 16px', background: '#fffdf7',
            border: '1px solid #e8dfc9', borderRadius: 8,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0f766e', fontWeight: 700,
              marginBottom: 8,
            }}>How the foundation works</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '18px 1fr', gap: '7px 10px',
              fontSize: 12, color: '#475569', lineHeight: 1.45,
            }}>
              <span style={{ fontFamily: FONT_MONO, color: '#94a3b8', fontWeight: 600 }}>01</span>
              <span>Six investor-critical layers, in the order they get pressed in a real meeting.</span>
              <span style={{ fontFamily: FONT_MONO, color: '#94a3b8', fontWeight: 600 }}>02</span>
              <span>Write what you have. Pick a source. Stars come from <em>how</em> you know, not <em>what</em>.</span>
              <span style={{ fontFamily: FONT_MONO, color: '#94a3b8', fontWeight: 600 }}>03</span>
              <span>You graduate to the full stack when the foundation reaches 2 stars across the board.</span>
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', marginBottom: 6,
            }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#64748b', fontWeight: 700,
              }}>Foundation queue</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#64748b' }}>
                <span style={{ color: '#0f766e', fontWeight: 700 }}>1</span> / 6 · ~20 min
              </span>
            </div>
            <div style={{
              height: 4, borderRadius: 2, background: '#e8dfc9', overflow: 'hidden',
            }}>
              <div style={{ width: '8.3%', height: '100%', background: '#0f766e' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map((item) => {
              const tone = item.s === 'now' ? '#0f766e' : item.s === 'next' ? '#475569' : '#94a3b8';
              const bg = item.s === 'now' ? '#fff' : 'transparent';
              const border = item.s === 'now' ? '1px solid #0f766e' : '1px solid #e8dfc9';
              return (
                <div key={item.n} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 10,
                  alignItems: 'flex-start', padding: '9px 11px',
                  background: bg, border, borderRadius: 6,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, color: tone,
                    letterSpacing: '0.06em', fontWeight: 700, marginTop: 2,
                  }}>{item.n}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      color: item.s === 'now' ? '#0b1220' : '#475569',
                      fontWeight: item.s === 'now' ? 600 : 500, lineHeight: 1.25,
                    }}>{item.name}</div>
                    <div style={{
                      fontSize: 11.5, color: '#64748b', marginTop: 2,
                      lineHeight: 1.4, fontStyle: 'italic',
                    }}>{item.q}</div>
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end', gap: 3,
                  }}>
                    {item.s === 'now' && (
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                        letterSpacing: '0.1em', color: '#0f766e',
                        padding: '2px 6px', background: '#dcfce7', borderRadius: 3,
                      }}>NOW</span>
                    )}
                    {item.s === 'next' && (
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600,
                        letterSpacing: '0.1em', color: '#64748b',
                        padding: '2px 6px', border: '1px solid #cbd5e1', borderRadius: 3,
                      }}>NEXT</span>
                    )}
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
                    }}>{item.t}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(15,118,110,0.06)',
            border: '1px dashed #0f766e',
          }}>
            <span style={{ fontSize: 14, marginTop: 1 }}>✓</span>
            <div style={{ fontSize: 11.5, color: '#0b1220', lineHeight: 1.5 }}>
              <strong style={{ color: '#0f766e', letterSpacing: '0.02em' }}>You graduate when:</strong> all six foundation layers ≥ 2 stars and Customer Segment, Problem, Pain Scale ≥ 3 stars. The full 16-layer stack unlocks then.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// A2 · Strata — bold dark backdrop, oversize question
export function DoorAStrata({ industry = 'software' }: { industry?: Industry }) {
  const v = VENTURE[industry];
  return (
    <div style={{
      height: '100%', background: '#0b1220', color: '#fff',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '14px 24px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: '#0f766e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11,
        }}>PK</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>Door A · Guided · {v.name}</div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', gap: 18, alignItems: 'center', fontFamily: FONT_MONO,
          fontSize: 11, color: '#475569', letterSpacing: '0.08em',
        }}>
          <span>STAGE · CPF</span>
          <span>·</span>
          <span style={{ color: '#0f766e' }}>FOUNDATION 1/6</span>
        </div>
      </div>
      <div style={{
        flex: 1, padding: '40px 64px', display: 'grid',
        gridTemplateColumns: '1.5fr 0.9fr', gap: 48,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{
              padding: '4px 10px', background: '#0f766e', color: '#fff',
              fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 700, borderRadius: 3,
            }}>L08</span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: '#fcd34d',
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
            }}>Critical · Investor pressure</span>
          </div>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 48,
            lineHeight: 1.12, color: '#fff', letterSpacing: '-0.022em',
            marginBottom: 24,
          }}>Customer Segment.</div>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 26,
            lineHeight: 1.34, color: '#cbd5e1', letterSpacing: '-0.008em',
            fontWeight: 400, maxWidth: 680,
          }}>Who is the smallest, most cohesive group with the greatest need? Three specific people. Their company. Their job title. The Tuesday they&apos;d buy this.</div>
          <textarea
            placeholder="Don't say 'everyone'. Don't say 'small businesses'. Three names."
            style={{
              marginTop: 32, width: '100%', minHeight: 130, padding: '18px 20px',
              background: '#020617', color: '#fff',
              border: '1px solid #1e293b', borderRadius: 8,
              fontSize: 15, lineHeight: 1.55, fontFamily: 'inherit',
              outline: 'none', resize: 'none',
            }}
            defaultValue="Urban dog-owners 28–45 within 24h of loss."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
              letterSpacing: '0.12em',
            }}>HOW DO YOU KNOW?</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PK_SOURCES.map((s) => {
                const active = s.id === 'experience';
                return (
                  <button key={s.id} type="button" style={{
                    padding: '7px 12px', borderRadius: 18,
                    background: active ? '#0f766e' : 'transparent',
                    border: `1px solid ${active ? '#0f766e' : '#334155'}`,
                    color: active ? '#fff' : '#94a3b8',
                    fontSize: 12, fontFamily: FONT_MONO, letterSpacing: '0.04em',
                    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 500,
                  }}>{s.short}</button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{
            padding: '18px 22px', background: '#020617',
            border: '1px solid #1e293b', borderRadius: 10, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 14, bottom: 14, width: 3,
              background: '#fcd34d',
            }} />
            <div style={{ paddingLeft: 14 }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10.5, color: '#fcd34d',
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                marginBottom: 8,
              }}>Pushback · investor</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 22, lineHeight: 1.32, color: '#fff',
              }}>&ldquo;That&apos;s a market, not a beachhead. Name three specific companies and the human at each who&apos;d buy this on Tuesday.&rdquo;</div>
              <div style={{
                marginTop: 10, fontFamily: FONT_MONO, fontSize: 10,
                color: '#64748b', letterSpacing: '0.08em',
              }}>— MONTY</div>
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#475569',
              letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
              marginBottom: 10,
            }}>Tier preview · what would unlock</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PK_SOURCES.map((s) => (
                <div key={s.id} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                  gap: 10, alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
                    letterSpacing: '0.05em', width: 90,
                  }}>{s.short}</span>
                  <TierLadder
                    tier={pkTier('customerSegment', s.id)}
                    size="sm"
                    tone={s.id === 'experience' ? 'critical' : 'thoughtful'}
                  />
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, color: '#64748b',
                  }}>{pkTier('customerSegment', s.id)}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// DOOR B — Snapshot dump. All 16 layers visible at once.
// ──────────────────────────────────────────────────────────────────

interface QuadConfig {
  indirect: string[];
  adjacent: string[];
  doNothing: string[];
}

const QUADS: Record<Industry, QuadConfig> = {
  software: {
    indirect: ['Plain spreadsheet + cron', 'Email templates'],
    adjacent: ['Pet insurers', 'Microchip registries', 'Vet network APIs'],
    doNothing: ['Wait & flyer the neighborhood'],
  },
  biotech: {
    indirect: ['Clinical gestalt + WBC count', 'Lactate trending'],
    adjacent: ['Hospital lab vendors', 'Antimicrobial-stewardship teams', 'CMS payer policy'],
    doNothing: ['Empiric broad-spectrum until cultures return'],
  },
  hardware: {
    indirect: ['Manual jig + clipboard', 'Excel SPC'],
    adjacent: ['Industrial PLC vendors', 'MES integrators', 'OSHA / safety auditors'],
    doNothing: ['Run line the way we always have'],
  },
  fintech: {
    indirect: ['Bookkeeper + spreadsheets', 'In-house treasury team'],
    adjacent: ['Card networks', 'KYC/AML vendors', 'State licensing regulators'],
    doNothing: ['Float the cash, eat the fees'],
  },
};

interface QuadProps {
  kicker: string;
  title: string;
  chips: string[];
  accent?: string;
  addCta?: string;
  placeholder: string;
  dashed?: boolean;
}

function Quad({ kicker, title, chips, accent = '#0f766e', addCta = '+ add', placeholder, dashed }: QuadProps) {
  return (
    <div style={{
      border: dashed ? '1px dashed #cbd5e1' : '1px solid #e8dfc9',
      background: dashed ? 'transparent' : '#fff',
      borderRadius: 6, padding: '10px 12px', minHeight: 88,
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700,
        }}>{kicker}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8' }}>
          {chips.length || 0}
        </span>
      </div>
      <div style={{
        fontSize: 12, color: '#0b1220', fontWeight: 500, lineHeight: 1.3,
      }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 1 }}>
        {chips.map((c, i) => (
          <span key={i} style={{
            fontSize: 11.5, padding: '3px 8px', borderRadius: 999,
            background: dashed ? '#fff7ed' : '#f4f1ea',
            border: `1px solid ${dashed ? '#fed7aa' : '#e8dfc9'}`,
            color: '#475569', whiteSpace: 'nowrap',
          }}>{c}</span>
        ))}
        {chips.length === 0 && (
          <span style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
            {placeholder}
          </span>
        )}
        <button type="button" style={{
          fontSize: 11, padding: '3px 7px', borderRadius: 999,
          border: '1px dashed #cbd5e1',
          background: 'transparent', color: '#94a3b8',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{addCta}</button>
      </div>
    </div>
  );
}

function CompetitiveMapRow({
  L, cell, industry,
}: { L: PkLayer; cell?: StackCell; industry: Industry }) {
  const direct = String(cell?.text || '').split(/;|·/).map((s) => s.trim()).filter(Boolean);
  const q = QUADS[industry] || QUADS.software;
  return (
    <div style={{
      borderLeft: '3px solid #0f766e', borderBottom: '1px dashed #e2e8f0',
      background: '#fbfaf7', padding: '12px 14px 14px',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '30px 1fr auto', gap: 14,
        alignItems: 'center', marginBottom: 10,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: '#0f766e',
          letterSpacing: '0.06em', fontWeight: 700,
        }}>L{String(L.n).padStart(2, '0')}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13.5, color: '#0b1220', fontWeight: 600 }}>{L.name}</span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9.5, padding: '2px 6px',
              background: '#fff7ed', color: '#92400e', borderRadius: 3,
              letterSpacing: '0.1em', border: '1px solid #fed7aa', fontWeight: 700,
            }}>2-DEGREE MAP</span>
          </div>
          <div style={{
            fontSize: 11.5, color: '#64748b', marginTop: 2, lineHeight: 1.4,
          }}>&ldquo;No competition&rdquo; is the most expensive line in your deck. Drop the ones you know into the map below — every empty quadrant is a question you haven&apos;t asked yet.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TierGlyphs tier={cell?.tier || 0} tone="critical" />
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#64748b',
            letterSpacing: '0.08em',
          }}>{(cell?.src || 'empty').toUpperCase()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Quad kicker="DIRECT" title="Same product, same buyer"
          chips={direct} accent="#0f766e" placeholder="No direct competitors yet." />
        <Quad kicker="INDIRECT / SUBSTITUTE" title="Different shape, same job"
          chips={q.indirect} accent="#2563eb" placeholder="What do they cobble together today?" />
        <Quad kicker="2 DEGREES OUT" title="Suppliers · channels · regulators"
          chips={q.adjacent} accent="#9333ea" placeholder="Who has to say yes for you to ship?" />
        <Quad kicker="DO NOTHING" title="The real default — and your toughest competitor"
          chips={q.doNothing} accent="#dc2626" dashed addCta="+ name the status-quo"
          placeholder="What happens if they do nothing?" />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 10,
        paddingTop: 10, borderTop: '1px dashed #e8dfc9',
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>spawn assumption →</span>
        <button type="button" style={{
          fontSize: 11.5, padding: '4px 10px', borderRadius: 999,
          border: '1px solid #d6cfb8', background: '#fff', color: '#0b1220',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>&ldquo;We win head-to-head vs {direct[0] || '<direct>'} on time-to-outcome&rdquo;</button>
        <button type="button" style={{
          fontSize: 11.5, padding: '4px 10px', borderRadius: 999,
          border: '1px solid #d6cfb8', background: '#fff', color: '#0b1220',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>&ldquo;Switching cost from {q.doNothing[0] || 'status quo'} is &lt; our price × 3&rdquo;</button>
        <div style={{ flex: 1 }} />
        <button type="button" style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none',
          background: '#0b1220', color: '#fff', cursor: 'pointer',
          fontFamily: FONT_MONO, letterSpacing: '0.06em',
        }}>OPEN FULL SECTOR MAP →</button>
      </div>
    </div>
  );
}

function MiniRow({
  L, cell, mode = 'editorial',
}: { L: PkLayer; cell?: StackCell; mode?: 'editorial' | 'strata' }) {
  const tier = cell?.tier || 0;
  const isCrit = L.cat === 'critical';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '30px 1fr auto auto', gap: 14,
      alignItems: 'center', padding: '10px 14px',
      borderLeft: `3px solid ${isCrit ? '#0f766e' : 'transparent'}`,
      borderBottom: '1px dashed #e2e8f0',
      background: isCrit && mode === 'strata' ? '#fffaf0' : 'transparent',
    }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 10.5,
        color: isCrit ? '#0f766e' : '#cbd5e1',
        letterSpacing: '0.06em', fontWeight: 700,
      }}>L{String(L.n).padStart(2, '0')}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: 13.5, color: '#0b1220',
          fontWeight: isCrit ? 600 : 500, letterSpacing: '-0.005em',
        }}>{L.name}</div>
        {cell?.text && (
          <div style={{
            fontSize: 11.5, color: '#64748b', marginTop: 2, lineHeight: 1.45,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          }}>{cell.text}</div>
        )}
      </div>
      <SourcePill src={cell?.src} />
      <TierLadder tier={tier} tone={isCrit ? 'critical' : 'thoughtful'} size="sm" />
    </div>
  );
}

export function DoorBEditorial({
  industry = 'software', state = 'midCPF',
}: { industry?: Industry; state?: StackState }) {
  const stack = pkBuildStack(industry, state);
  const v = VENTURE[industry];
  const filled = pkFilledCount(stack);
  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <WinHead
        sub={`Door B · Snapshot · ${v.name}`}
        title="The 16-layer dump"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
              letterSpacing: '0.08em',
            }}>{filled}/16 FILLED</span>
            <button type="button" style={{
              padding: '8px 14px', background: '#0b1220', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12.5, cursor: 'pointer',
            }}>Save snapshot</button>
          </div>
        }
      />
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #ece6d6', background: '#f4f1ea',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 18,
          color: '#0b1220', lineHeight: 1.4, flex: 1, maxWidth: 680,
        }}>&ldquo;Fill in what you know. Leave blanks where you don&apos;t. Pick the source — that&apos;s the only honesty I need from you.&rdquo;</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: '#94a3b8',
          letterSpacing: '0.08em',
        }}>— MONTY</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {PK_LAYERS.map((L) =>
          L.id === 'competitiveMarket' ? (
            <CompetitiveMapRow key={L.id} L={L} cell={stack[L.id]} industry={industry} />
          ) : (
            <MiniRow key={L.id} L={L} cell={stack[L.id]} mode="editorial" />
          ),
        )}
      </div>
    </div>
  );
}

export function DoorBStrata({
  industry = 'software', state = 'midCPF',
}: { industry?: Industry; state?: StackState }) {
  const stack = pkBuildStack(industry, state);
  const v = VENTURE[industry];
  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <WinHead
        sub={`Door B · Snapshot · ${v.name}`}
        title="The 16-layer dump"
        right={
          <span style={{
            fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
            letterSpacing: '0.08em',
          }}>STRATA VIEW</span>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <div style={{
          padding: '14px 24px', borderBottom: '1px solid #e2e8f0',
          fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#94a3b8',
        }}>Strategy halo · L01–L03, L05–L07</div>
        {PK_LAYERS
          .filter((L) => L.cat === 'thoughtful' && L.band !== 'execution')
          .map((L) => (
            <MiniRow key={L.id} L={L} cell={stack[L.id]} mode="editorial" />
          ))}

        <div style={{
          padding: '14px 24px', borderTop: '1px solid #ece6d6',
          borderBottom: '1px solid #ece6d6', background: '#fff7e6',
          fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#92400e', fontWeight: 700,
        }}>Critical band · investors press here</div>
        <div style={{ background: '#fffaf0' }}>
          {PK_LAYERS.filter((L) => L.cat === 'critical').map((L) => (
            <MiniRow key={L.id} L={L} cell={stack[L.id]} mode="strata" />
          ))}
        </div>

        <div style={{
          padding: '14px 24px', borderTop: '1px solid #e2e8f0',
          fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#94a3b8',
        }}>Execution halo · L13–L16</div>
        {PK_LAYERS.filter((L) => L.band === 'execution').map((L) => (
          <MiniRow key={L.id} L={L} cell={stack[L.id]} mode="editorial" />
        ))}
      </div>
    </div>
  );
}
