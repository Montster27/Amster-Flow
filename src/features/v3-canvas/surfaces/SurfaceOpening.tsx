// Surface 1 · Mentor-voice opening — Editorial (preferred) + Strata (alt).

import { PK_VOICE } from '../data';
import type { Intensity } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

interface DoorCardProps {
  title: string;
  desc: string;
  tag: string;
  minutes: string;
  dark?: boolean;
}

function DoorCard({ title, desc, tag, minutes, dark }: DoorCardProps) {
  return (
    <button type="button" style={{
      textAlign: 'left', padding: '22px 24px', borderRadius: 14,
      border: dark ? '1px solid #0b1220' : '1px solid #d6cfb8',
      background: dark ? '#0b1220' : '#fff',
      color: dark ? '#fff' : '#0b1220',
      cursor: 'pointer', fontFamily: 'inherit',
      transition: 'transform .15s, box-shadow .15s',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10,
          letterSpacing: '0.14em', fontWeight: 700,
          color: dark ? '#fcd34d' : '#0f766e',
        }}>{tag}</span>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10.5,
          color: dark ? '#64748b' : '#94a3b8',
        }}>{minutes}</span>
      </div>
      <div style={{
        fontFamily: FONT_SERIF, fontSize: 24,
        letterSpacing: '-0.012em', lineHeight: 1.18, marginBottom: 8,
      }}>{title}</div>
      <div style={{
        fontSize: 13, lineHeight: 1.55,
        color: dark ? '#cbd5e1' : '#475569',
      }}>{desc}</div>
    </button>
  );
}

// O1 · Editorial — paper, oversize serif lede, two doors as cards
export function OpeningEditorial({ intensity = 'direct' }: { intensity?: Intensity }) {
  const v = PK_VOICE.opening[intensity] || PK_VOICE.opening.direct;
  return (
    <div style={{
      height: '100%', background: '#fbfaf7',
      display: 'flex', flexDirection: 'column', padding: '72px 80px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7, background: '#0b1220',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13,
          letterSpacing: '-0.02em',
        }}>PK</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
          letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
        }}>PivotKit · Questions Up &amp; Down</div>
      </div>
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr',
        gap: 64, alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10.5,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f766e',
            fontWeight: 700, marginBottom: 14,
          }}>{v.kicker}</div>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 120,
            lineHeight: 0.95, color: '#0b1220',
            letterSpacing: '-0.04em', marginBottom: 32, fontWeight: 400,
          }}>{v.title}</div>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 30,
            lineHeight: 1.28, color: '#0b1220',
            letterSpacing: '-0.012em', marginBottom: 22, maxWidth: 620,
          }}>{v.lede}</div>
          {v.body.map((p, i) => (
            <p key={i} style={{
              fontSize: 15, lineHeight: 1.65, color: '#475569',
              maxWidth: 560, margin: '0 0 12px',
            }}>{p}</p>
          ))}
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 18,
            color: '#0b1220', marginTop: 22, fontStyle: 'italic',
            letterSpacing: '-0.005em',
          }}>— {v.closer}</div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 120,
        }}>
          <DoorCard
            title="Walk me through it"
            desc="Step-by-step. Starts at Customer Segment because that's where investors press first. Six foundation questions, then the full stack."
            tag="DOOR A · GUIDED"
            minutes="≈ 20 min"
          />
          <DoorCard
            title="I'll dump what I have"
            desc="All 16 layers visible at once. Fill in what you know. Leave blanks where you don't. Pick a source — that's how I score you."
            tag="DOOR B · SNAPSHOT"
            minutes="≈ 15 min"
            dark
          />
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
            letterSpacing: '0.06em', marginTop: 6, lineHeight: 1.6,
          }}>You can switch any time. The stack is the same.</div>
        </div>
      </div>
    </div>
  );
}

interface DoorBandProps {
  letter: string;
  title: string;
  sub: string;
  body: string;
  tone: 'paper' | 'dark';
}

function DoorBand({ letter, title, sub, body, tone }: DoorBandProps) {
  const isPaper = tone === 'paper';
  return (
    <button type="button" style={{
      flex: 1, textAlign: 'left',
      padding: '48px 56px',
      background: isPaper ? '#fbfaf7' : '#020617',
      color: isPaper ? '#0b1220' : '#fff',
      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      borderBottom: isPaper ? '1px solid #1e293b' : 'none',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 84, lineHeight: 0.85,
          color: isPaper ? '#0f766e' : '#fcd34d',
          letterSpacing: '-0.03em', fontWeight: 400,
        }}>{letter}</div>
        <div style={{ flex: 1, paddingTop: 8 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10.5,
            letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
            color: isPaper ? '#0f766e' : '#fcd34d', marginBottom: 8,
          }}>{sub}</div>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 30,
            letterSpacing: '-0.014em', lineHeight: 1.15, marginBottom: 10,
          }}>{title}</div>
          <div style={{
            fontSize: 13.5, lineHeight: 1.55,
            color: isPaper ? '#475569' : '#94a3b8', maxWidth: 420,
          }}>{body}</div>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 24,
        fontFamily: FONT_MONO, fontSize: 11,
        color: isPaper ? '#94a3b8' : '#475569', letterSpacing: '0.08em',
      }}>ENTER →</div>
    </button>
  );
}

// O2 · Strata — dark backdrop, single sheet of voice, two doors as full-bleed bands
export function OpeningStrata({ intensity = 'direct' }: { intensity?: Intensity }) {
  const v = PK_VOICE.opening[intensity] || PK_VOICE.opening.direct;
  return (
    <div style={{
      height: '100%', background: '#0b1220', color: '#fff',
      display: 'grid', gridTemplateColumns: '1.3fr 1fr', overflow: 'hidden',
    }}>
      <div style={{
        padding: '72px 64px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', borderRight: '1px solid #1e293b',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 5, background: '#0f766e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11,
            }}>PK</div>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>PivotKit + Questions Up &amp; Down</span>
          </div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fcd34d',
            fontWeight: 700, marginBottom: 20,
          }}>{v.kicker}</div>
          <div style={{
            fontFamily: FONT_SERIF, fontSize: 88, lineHeight: 1, color: '#fff',
            letterSpacing: '-0.035em', marginBottom: 36, fontWeight: 400,
          }}>{v.lede}</div>
          {v.body.map((p, i) => (
            <p key={i} style={{
              fontFamily: FONT_SERIF,
              fontSize: i === 0 ? 22 : 18, lineHeight: 1.4,
              color: i === 0 ? '#fff' : '#cbd5e1', maxWidth: 580,
              margin: '0 0 12px', letterSpacing: '-0.005em',
            }}>{p}</p>
          ))}
        </div>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 24,
          color: '#fcd34d', letterSpacing: '-0.005em',
          fontStyle: 'italic', marginTop: 32,
        }}>— {v.closer}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <DoorBand
          letter="A" title="Walk me through it" sub="Guided · ≈ 20 min"
          body="Step-by-step. Starts where investors press first. Six foundation questions, then the full stack."
          tone="paper"
        />
        <DoorBand
          letter="B" title="I'll dump what I have" sub="Snapshot · ≈ 15 min"
          body="All 16 layers at once. Fill what you know. Pick a source. That's how I score you."
          tone="dark"
        />
      </div>
    </div>
  );
}
