// Surface 6 · Assumption ingestion. Channel 2 (spawn cards) + Channel 3 (cross-layer flag).

import type { ReactNode } from 'react';
import { VENTURE } from '../data';
import type { Industry } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

function AsmHead({ sub, title, right }: { sub: string; title: string; right?: ReactNode }) {
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
        }}>{sub}</div>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 20, color: '#0b1220',
          marginTop: 2, letterSpacing: '-0.01em',
        }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function Tier({ n = 0 }: { n?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i <= n ? '#0f766e' : '#e2e8f0',
        }} />
      ))}
    </span>
  );
}

function SrcChip({ label, active = false, tone = 'teal' }: {
  label: string; active?: boolean; tone?: 'teal' | 'amber';
}) {
  const accent = tone === 'amber' ? '#b45309' : '#0f766e';
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 12, fontSize: 10,
      fontFamily: FONT_MONO, letterSpacing: '0.04em', fontWeight: 600,
      background: active ? accent : '#fff',
      color: active ? '#fff' : '#64748b',
      border: `1px solid ${active ? accent : '#e2e8f0'}`,
    }}>{label}</span>
  );
}

// ────────────────────────────────────────────────────────────
// CHANNEL 2 — Candidate assumption tray (spawned from a filled layer)
// ────────────────────────────────────────────────────────────
export function AssumptionTray({ industry = 'software' }: { industry?: Industry }) {
  const v = VENTURE[industry];

  const filledLayer = {
    n: 7, name: 'Business Model',
    text: '$80 / month SaaS, paid per-user, monthly billing',
    src: 'Seems logical', tier: 1,
  };

  const candidates = [
    {
      from: 'L07 Business Model × L08 Customer Segment',
      claim: 'Veterinarians have $80/mo discretionary tooling budget.',
      note: 'Implied by your price + buyer.',
    },
    {
      from: 'L07 Business Model × L13 Requirements',
      claim: 'Buyers will procure a SaaS tool without legal/IT review.',
      note: 'Per-user monthly billing assumes self-serve checkout.',
    },
    {
      from: 'L07 Business Model × L11 Pain Scale',
      claim: 'The pain is rated Moderate or higher — enough to justify a recurring spend.',
      note: 'Sub-Moderate pain rarely sustains subscription pricing.',
      preferred: true,
    },
    {
      from: 'L07 Business Model × L04 Competitive Market',
      claim: 'Customers will switch from existing free workflows (spreadsheets, email).',
      note: 'Free incumbents charge a switching cost in attention, not money.',
    },
  ];

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <AsmHead
        sub={`${v.name} · ${v.industry} · channel 2`}
        title="When you fill a layer, the system spawns its implied assumptions."
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
              letterSpacing: '0.08em',
            }}>4 CANDIDATES SPAWNED</span>
          </div>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>
        <div style={{ padding: '22px 28px', overflow: 'auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '48px 1fr auto auto', gap: 14,
            alignItems: 'center', padding: '14px 16px', background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: 10,
            boxShadow: '0 1px 0 rgba(15,23,42,0.04)',
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
              color: '#0f766e', letterSpacing: '0.06em',
            }}>L0{filledLayer.n}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0b1220' }}>{filledLayer.name}</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{filledLayer.text}</div>
            </div>
            <SrcChip label={filledLayer.src} />
            <Tier n={filledLayer.tier} />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '18px 0 14px', color: '#64748b',
          }}>
            <div style={{
              flex: '0 0 28px', borderTop: '1px dashed #cbd5e1',
              height: 0, marginLeft: 18,
            }} />
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0f766e', fontWeight: 700,
              padding: '4px 10px', background: '#dcfce7', borderRadius: 12,
            }}>spawned candidates</span>
            <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1', height: 0 }} />
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
              letterSpacing: '0.08em',
            }}>drag, dismiss, or source</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {candidates.map((c, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: '#fff',
                border: c.preferred ? '1.5px solid #0f766e' : '1px solid #e8dfc9',
                borderRadius: 10,
                display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: c.preferred ? '0 0 0 4px rgba(15,118,110,0.08)' : 'none',
                position: 'relative',
              }}>
                {c.preferred && (
                  <span style={{
                    position: 'absolute', top: -9, left: 14,
                    fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                    letterSpacing: '0.1em', color: '#fff', background: '#0f766e',
                    padding: '3px 8px', borderRadius: 3,
                  }}>★ PREFERRED EXAMPLE</span>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9.5,
                    letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>{c.from}</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, color: '#0f766e',
                    background: '#dcfce7', padding: '2px 6px', borderRadius: 3,
                    fontWeight: 700, letterSpacing: '0.08em',
                  }}>NEW</span>
                </div>
                <div style={{
                  fontSize: 14, color: '#0b1220', lineHeight: 1.4,
                  fontWeight: 500, letterSpacing: '-0.005em',
                }}>{c.claim}</div>
                <div style={{
                  fontSize: 11.5, color: '#64748b', fontStyle: 'italic',
                  lineHeight: 1.4,
                }}>{c.note}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, color: '#94a3b8',
                    fontFamily: FONT_MONO, letterSpacing: '0.06em', marginRight: 2,
                  }}>SOURCE</span>
                  <SrcChip label="Logical" />
                  <SrcChip label="Experience" />
                  <SrcChip label="Research" />
                  <SrcChip label="Interview" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <button type="button" style={{
                    flex: 1, padding: '8px 12px', background: '#0b1220', color: '#fff',
                    border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer',
                  }}>Add to stack</button>
                  <button type="button" style={{
                    padding: '8px 12px', background: 'transparent', color: '#64748b',
                    border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
                    cursor: 'pointer',
                  }}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: '#f4f1ea', borderLeft: '1px solid #ece6d6',
          padding: '22px 18px', overflow: 'auto',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
              marginBottom: 6,
            }}>Assumption stack</div>
            <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.45 }}>
              Promoted candidates land here at <strong>0 stars</strong> until you source them.
            </div>
          </div>

          {[
            { t: 'Vets need lightweight scheduling tools.', tier: 2, src: 'Experience' },
            { t: 'Solo-practice vets are the sharpest beachhead.', tier: 1, src: 'Logical' },
            { t: 'Spreadsheet workflows are the do-nothing baseline.', tier: 0, src: '—' },
          ].map((a, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: '#fff',
              border: '1px solid #e8dfc9', borderRadius: 8,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 12, color: '#0b1220', lineHeight: 1.4 }}>{a.t}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tier n={a.tier} />
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
                  letterSpacing: '0.06em',
                }}>{a.src}</span>
              </div>
            </div>
          ))}

          <div style={{
            padding: '10px 12px', borderRadius: 8,
            border: '1.5px dashed #0f766e', background: 'rgba(15,118,110,0.05)',
            fontSize: 11.5, color: '#0f766e', lineHeight: 1.45, fontStyle: 'italic',
          }}>▸ Drop zone — drag a spawned candidate in to promote it.</div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CHANNEL 3 — Cross-layer flag (Monty derives an unstated assumption)
// ────────────────────────────────────────────────────────────
export function CrossLayerFlag({ industry = 'software' }: { industry?: Industry }) {
  const v = VENTURE[industry];

  const layerA = {
    n: 8, name: 'Customer Segment',
    text: 'Solo-practice rural veterinarians (US, < 3 employees)',
    src: 'Experience', tier: 2,
  };
  const layerB = {
    n: 7, name: 'Business Model',
    text: '$80 / month SaaS, paid per-user, monthly billing',
    src: 'Seems logical', tier: 1,
  };

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <AsmHead
        sub={`${v.name} · ${v.industry} · channel 3`}
        title="Two layers contradict. A derived assumption is sitting in the seam."
        right={
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10.5, color: '#b45309',
            letterSpacing: '0.08em', background: '#fef3c7',
            padding: '4px 10px', borderRadius: 12, fontWeight: 700,
          }}>⚠ INTERSECTION FLAG</span>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        <div style={{
          padding: '24px 28px', overflow: 'auto', display: 'flex',
          flexDirection: 'column', gap: 18,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 56px 1fr', gap: 0, alignItems: 'center',
          }}>
            {[layerA, layerB].map((layer, i) => i === 0 ? (
              <div key={i} style={{
                padding: '14px 16px', background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 10,
                borderLeft: '3px solid #0f766e',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700,
                    color: '#0f766e', letterSpacing: '0.06em',
                  }}>L0{layer.n} · {layer.name}</span>
                  <Tier n={layer.tier} />
                </div>
                <div style={{ fontSize: 13, color: '#0b1220', lineHeight: 1.4 }}>{layer.text}</div>
                <div style={{ marginTop: 8 }}><SrcChip label={layer.src} /></div>
              </div>
            ) : null)}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#fef3c7', color: '#b45309',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700,
                border: '1.5px solid #fcd34d',
              }}>×</span>
            </div>

            <div style={{
              padding: '14px 16px', background: '#fff',
              border: '1px solid #e2e8f0', borderRadius: 10,
              borderLeft: '3px solid #0f766e',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700,
                  color: '#0f766e', letterSpacing: '0.06em',
                }}>L0{layerB.n} · {layerB.name}</span>
                <Tier n={layerB.tier} />
              </div>
              <div style={{ fontSize: 13, color: '#0b1220', lineHeight: 1.4 }}>{layerB.text}</div>
              <div style={{ marginTop: 8 }}><SrcChip label={layerB.src} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 1, height: 24, background: '#cbd5e1' }} />
          </div>

          <div style={{
            padding: '20px 22px', background: '#fff8eb',
            border: '1px solid #fde68a', borderLeft: '3px solid #b45309',
            borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', background: '#b45309',
                color: '#fff', fontFamily: FONT_SERIF, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontStyle: 'italic',
              }}>M</span>
              <div>
                <div style={{
                  fontSize: 11, color: '#92400e', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontFamily: FONT_MONO,
                }}>Monty · derived assumption</div>
                <div style={{ fontSize: 10.5, color: '#92400e', marginTop: 1 }}>
                  Inferred from L08 × L07. You haven&apos;t stated this anywhere.
                </div>
              </div>
            </div>

            <div style={{
              fontFamily: FONT_SERIF, fontSize: 22, color: '#0b1220',
              lineHeight: 1.3, fontStyle: 'italic', letterSpacing: '-0.01em',
            }}>&ldquo;Solo-practice rural vets carry $80/mo of discretionary SaaS budget — and renew it through year two.&rdquo;</div>

            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
              Your segment is the most price-sensitive cohort in the trade. Your model
              assumes a recurring B2B SaaS spend at urban-startup levels. One of these
              has to give before you write Pricing in interview-grade ink.
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4,
            }}>
              <button type="button" style={{
                padding: '10px 12px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                gap: 2, alignItems: 'flex-start',
              }}>
                <span>Accept</span>
                <span style={{
                  fontSize: 10, color: '#94a3b8', fontFamily: FONT_MONO,
                  letterSpacing: '0.04em', fontWeight: 400,
                }}>joins stack at 0 ★</span>
              </button>
              <button type="button" style={{
                padding: '10px 12px', background: '#fff', color: '#0b1220',
                border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                gap: 2, alignItems: 'flex-start',
              }}>
                <span>Reframe</span>
                <span style={{
                  fontSize: 10, color: '#94a3b8', fontFamily: FONT_MONO,
                  letterSpacing: '0.04em', fontWeight: 400,
                }}>edit before adding</span>
              </button>
              <button type="button" style={{
                padding: '10px 12px', background: 'transparent', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                gap: 2, alignItems: 'flex-start',
              }}>
                <span>Dismiss</span>
                <span style={{
                  fontSize: 10, color: '#94a3b8', fontFamily: FONT_MONO,
                  letterSpacing: '0.04em', fontWeight: 400,
                }}>logged, not stacked</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{
          background: '#f4f1ea', borderLeft: '1px solid #ece6d6',
          padding: '22px 18px', overflow: 'auto',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
          }}>If you accept</div>
          <div style={{
            padding: '12px 14px', background: '#fff',
            border: '1.5px solid #b45309', borderRadius: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10, color: '#b45309',
                letterSpacing: '0.08em', fontWeight: 700,
              }}>NEW · DERIVED</span>
              <Tier n={0} />
            </div>
            <div style={{ fontSize: 12.5, color: '#0b1220', lineHeight: 1.4 }}>
              Solo-practice rural vets carry $80/mo of discretionary SaaS budget
              and renew through year two.
            </div>
            <div style={{
              marginTop: 10, fontSize: 10.5, color: '#64748b',
              lineHeight: 1.4, fontStyle: 'italic',
            }}>
              Will surface as <strong>top-priority pushback</strong> until sourced from
              real interviews.
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e8dfc9', paddingTop: 14 }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#64748b', fontWeight: 700,
              marginBottom: 8,
            }}>How Monty finds these</div>
            <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>
              Pairwise scan across the 16 layers. Triggers when a layer&apos;s tier rises
              and the implied claim has no entry of its own.
            </div>
          </div>

          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
            letterSpacing: '0.06em',
          }}>Last scan: 12s ago · 2 candidates active</div>
        </div>
      </div>
    </div>
  );
}
