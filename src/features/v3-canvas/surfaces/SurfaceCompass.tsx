// Surface 8 · Erin Scott Strategy Compass with two parallel-tested quadrants.

import type { ReactNode } from 'react';
import { PK_LAYERS, VENTURE } from '../data';
import type { Industry } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

function CHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
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

function CBar({ tier, max = 5, tone = 'teal' }: { tier: number; max?: number; tone?: 'teal' | 'amber' | 'rose' }) {
  const accent = tone === 'amber' ? '#b45309' : tone === 'rose' ? '#be123c' : '#0f766e';
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

interface Quadrant {
  id: string;
  name: string;
  pos: 'tl' | 'tr' | 'bl' | 'br';
  tagline: string;
  hypothesis: string;
  committed: boolean;
  kind?: 'parallel-A' | 'parallel-B';
  layers: string[];
  evidence?: { src: string; tier: number }[];
  killIf?: string;
  pulse: 'warm' | 'hot' | 'parked' | 'killed';
  note?: string;
}

export function CompassCommit({ industry = 'software' }: { industry?: Industry }) {
  const v = VENTURE[industry];

  const quadrants: Quadrant[] = [
    {
      id: 'ip', name: 'Intellectual Property', pos: 'tl',
      tagline: 'Own the idea, partner to commercialize.',
      hypothesis: 'A diagnostic-grade reunite-rate model is licensable to incumbent pet networks (Petco, Banfield) for $400K+ per integration.',
      committed: true, kind: 'parallel-A',
      layers: ['businessModel', 'customerSegment', 'competitiveMarket'],
      evidence: [
        { src: '2 calls · Petco partnerships', tier: 3 },
        { src: 'License precedent · 1 case', tier: 2 },
      ],
      killIf: 'No partner LOI within 12 weeks · or partner CAC > $150K.',
      pulse: 'warm',
    },
    {
      id: 'disruption', name: 'Disruption', pos: 'tr',
      tagline: 'Own the idea, win the market head-on.',
      hypothesis: 'Direct-to-vet SaaS replaces fragmented Facebook + flyer workflows; vets become the channel to owners.',
      committed: false,
      layers: ['solution', 'distribution', 'product'],
      note: 'Tested and parked. Vets unwilling to be channel without owner-side liability split.',
      pulse: 'parked',
    },
    {
      id: 'value', name: 'Value Chain', pos: 'bl',
      tagline: 'Slot into an established value chain.',
      hypothesis: 'PetFinder operates as the lost-pet layer for shelter database providers (Shelterluv, PetPoint) under white-label.',
      committed: true, kind: 'parallel-B',
      layers: ['businessModel', 'distribution', 'integrations'],
      evidence: [
        { src: '4 calls · shelter operators', tier: 4 },
        { src: 'Shelterluv API access', tier: 3 },
      ],
      killIf: 'Shelter-side activation < 30% within 60 days · or revenue/shelter < $2K/yr.',
      pulse: 'hot',
    },
    {
      id: 'arch', name: 'Architectural', pos: 'br',
      tagline: 'Own customer and product on a known network.',
      hypothesis: 'Direct-to-owner mobile app — own the relationship, become the default during the lost-pet event.',
      committed: false,
      layers: ['customerSegment', 'solution', 'distribution'],
      note: 'Default startup pose. Killed early — CAC unsupportable at owner LTV.',
      pulse: 'killed',
    },
  ];

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <CHead
        kicker={`${v.name} · L03b · Strategy Compass`}
        title="Two quadrants committed. Tested in parallel until one wins."
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: '#0f766e',
              letterSpacing: '0.08em', fontWeight: 700,
              padding: '4px 10px', background: '#dcfce7', borderRadius: 12,
            }}>2 ACTIVE · 1 PARKED · 1 KILLED</span>
          </div>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>
        <div style={{
          padding: '22px 22px', overflow: 'hidden', position: 'relative',
          display: 'grid', gridTemplateColumns: '48px 1fr', gridTemplateRows: '48px 1fr',
          gap: 0,
        }}>
          <div></div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center',
            padding: '0 0 8px',
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
            color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase',
          }}>
            <span style={{ textAlign: 'center' }}>← New value network</span>
            <span style={{ textAlign: 'center' }}>Existing value network →</span>
          </div>

          <div style={{
            display: 'grid', gridTemplateRows: '1fr 1fr',
            justifyItems: 'center', alignItems: 'center',
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
            color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase',
          }}>
            <span style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>↑ Collaborate</span>
            <span style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>Compete ↓</span>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
            gap: 10, position: 'relative',
          }}>
            {quadrants.map((q) => {
              const isCommitted = q.committed;
              const isKilled = q.pulse === 'killed';
              const isParked = q.pulse === 'parked';
              const accent = q.kind === 'parallel-A' ? '#b45309'
                : q.kind === 'parallel-B' ? '#0f766e'
                : isKilled ? '#94a3b8' : '#cbd5e1';
              return (
                <div key={q.id} style={{
                  padding: '14px 16px',
                  background: isCommitted ? '#fff' : isKilled ? '#f8fafc' : '#fbfaf7',
                  border: isCommitted ? `1.5px solid ${accent}` : '1px dashed #cbd5e1',
                  borderRadius: 10,
                  boxShadow: isCommitted ? `0 0 0 4px ${accent}15` : 'none',
                  display: 'flex', flexDirection: 'column', gap: 9,
                  opacity: isKilled ? 0.55 : 1,
                  position: 'relative', minWidth: 0, overflow: 'hidden',
                }}>
                  {isCommitted && (
                    <span style={{
                      position: 'absolute', top: -9, left: 14,
                      fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                      letterSpacing: '0.1em', color: '#fff', background: accent,
                      padding: '3px 8px', borderRadius: 3,
                    }}>{q.kind === 'parallel-A' ? 'PARALLEL · A' : 'PARALLEL · B'}</span>
                  )}
                  {isParked && (
                    <span style={{
                      position: 'absolute', top: -9, left: 14,
                      fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                      letterSpacing: '0.1em', color: '#64748b', background: '#e2e8f0',
                      padding: '3px 8px', borderRadius: 3,
                    }}>PARKED</span>
                  )}
                  {isKilled && (
                    <span style={{
                      position: 'absolute', top: -9, left: 14,
                      fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                      letterSpacing: '0.1em', color: '#fff', background: '#94a3b8',
                      padding: '3px 8px', borderRadius: 3,
                    }}>KILLED · WK 3</span>
                  )}

                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 8,
                      justifyContent: 'space-between',
                    }}>
                      <span style={{
                        fontFamily: FONT_SERIF, fontSize: 18,
                        color: '#0b1220', letterSpacing: '-0.01em',
                        textDecoration: isKilled ? 'line-through' : 'none',
                      }}>{q.name}</span>
                    </div>
                    <div style={{
                      fontSize: 10.5, color: '#94a3b8',
                      fontFamily: FONT_MONO, letterSpacing: '0.04em', marginTop: 2,
                    }}>{q.tagline}</div>
                  </div>

                  {isCommitted ? (
                    <>
                      <div style={{
                        fontSize: 12, color: '#0b1220', lineHeight: 1.4, fontStyle: 'italic',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      }}>&ldquo;{q.hypothesis}&rdquo;</div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {q.layers.map((lid) => {
                          const L = PK_LAYERS.find((x) => x.id === lid);
                          if (!L) return null;
                          return (
                            <span key={lid} style={{
                              fontFamily: FONT_MONO, fontSize: 9.5,
                              color: accent, background: `${accent}14`,
                              padding: '2px 6px', borderRadius: 3, fontWeight: 600,
                              letterSpacing: '0.04em',
                            }}>L{String(L.n).padStart(2, '0')}</span>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {q.evidence?.map((e, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 11, color: '#475569',
                          }}>
                            <CBar tier={e.tier} tone={q.kind === 'parallel-A' ? 'amber' : 'teal'} />
                            <span style={{
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', flex: 1, minWidth: 0,
                            }}>{e.src}</span>
                          </div>
                        ))}
                      </div>

                      {q.killIf && (
                        <div style={{
                          padding: '7px 10px', background: '#fff8eb', borderRadius: 6,
                          border: '1px solid #fde68a',
                          fontSize: 10.5, color: '#92400e', lineHeight: 1.4,
                        }}>
                          <span style={{
                            fontFamily: FONT_MONO, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                          }}>Kill if · </span>
                          {q.killIf}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      fontSize: 11, color: '#64748b', lineHeight: 1.45,
                      fontStyle: 'italic', flex: 1,
                    }}>{q.note}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          background: '#f4f1ea', borderLeft: '1px solid #ece6d6',
          padding: '22px 18px', overflow: 'auto', display: 'flex',
          flexDirection: 'column', gap: 14,
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
              marginBottom: 6,
            }}>The compass rule</div>
            <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>
              Commit to <strong>two</strong> viable quadrants and run them in parallel
              for 6–12 weeks. The ones not chosen are explicitly parked, not deleted —
              they remain visible so you can revisit them when conditions change.
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e8dfc9', paddingTop: 14 }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
              marginBottom: 8,
            }}>Active parallel tests</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { kind: 'A', name: 'IP', metric: 'Partner LOI', target: '1 by wk 12', status: 'wk 5 · 0' },
                { kind: 'B', name: 'Value Chain', metric: 'Shelter activation', target: '30% by wk 8', status: 'wk 5 · 22%' },
              ].map((p) => {
                const accent = p.kind === 'A' ? '#b45309' : '#0f766e';
                return (
                  <div key={p.name} style={{
                    padding: '10px 12px', background: '#fff',
                    border: '1px solid #e8dfc9', borderRadius: 8,
                    borderLeft: `3px solid ${accent}`,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, marginBottom: 4,
                    }}>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                        color: accent, letterSpacing: '0.08em',
                      }}>PARALLEL · {p.kind}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0b1220' }}>{p.name}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.4 }}>{p.metric}</div>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                      marginTop: 4,
                    }}>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
                        letterSpacing: '0.06em',
                      }}>TARGET {p.target}</span>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
                        color: '#0b1220',
                      }}>{p.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #e8dfc9', paddingTop: 14,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
            }}>Why two, not one</div>
            <div style={{
              fontSize: 11, color: '#64748b', lineHeight: 1.5, fontStyle: 'italic',
            }}>&ldquo;A compass with one needle is just an arrow. The whole point is that you learn from the divergence.&rdquo; — Monty</div>
          </div>

          <div style={{
            marginTop: 'auto', padding: '10px 12px', borderRadius: 8,
            background: '#fff', border: '1px dashed #cbd5e1',
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
              letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4,
            }}>QUADRANT ACTIONS</div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
              Park · Kill · Promote to single-track · Revive a parked quadrant.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
