// Onboarding · Mentor-voice opening + door picker.
// Lives at /v3/onboarding/:projectId. Sets door_choice on click and routes
// to the chosen door. Intensity is configurable from the Tweaks panel
// (later) — for now defaults to the venture's stored intensity.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVenture } from '../hooks/useVenture';
import { PageShell } from '../components/atoms';
import { OPENING } from '../lib/voice';
import type { DoorChoice, Intensity } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'warmer', label: 'Warmer' },
  { value: 'sharp',  label: 'Sharp' },
];

interface DoorButtonProps {
  letter: 'A' | 'B';
  title: string;
  desc: string;
  tag: string;
  minutes: string;
  dark?: boolean;
  onClick: () => void;
}

function DoorButton({ letter, title, desc, tag, minutes, dark, onClick }: DoorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left', padding: '24px 26px', borderRadius: 14,
        border: dark ? '1px solid #0b1220' : '1px solid #d6cfb8',
        background: dark ? '#0b1220' : '#fff',
        color: dark ? '#fff' : '#0b1220',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'transform .15s, box-shadow .15s',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontFamily: FONT_SERIF, fontSize: 50, lineHeight: 0.85,
            color: dark ? '#fcd34d' : '#0f766e', letterSpacing: '-0.03em',
          }}>{letter}</span>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
              fontWeight: 700, color: dark ? '#fcd34d' : '#0f766e',
            }}>{tag}</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 24,
              letterSpacing: '-0.012em', lineHeight: 1.18, marginTop: 4,
            }}>{title}</div>
          </div>
        </div>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10.5,
          color: dark ? '#64748b' : '#94a3b8',
        }}>{minutes}</span>
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.55,
        color: dark ? '#cbd5e1' : '#475569', maxWidth: 460,
      }}>{desc}</div>
    </button>
  );
}

export default function OnboardingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading, updateVenture } = useVenture(projectId);
  const [chosen, setChosen] = useState<DoorChoice | null>(null);

  if (!projectId) {
    return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  }
  if (loading) return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;

  const intensity = venture?.intensity ?? 'sharp';
  const v = OPENING[intensity];

  const pickDoor = async (door: DoorChoice) => {
    setChosen(door);
    try {
      await updateVenture({ door_choice: door });
    } finally {
      navigate(door === 'A' ? `/v3/door-a/${projectId}` : `/v3/door-b/${projectId}`);
    }
  };

  return (
    <PageShell>
      <div style={{ padding: '40px 56px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7, background: '#0b1220',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13,
          }}>PK</div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
            letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
          }}>PivotKit · Questions Up &amp; Down</div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
            letterSpacing: '0.12em',
          }}>
            <span>VOICE</span>
            {INTENSITIES.map((it) => (
              <button
                key={it.value}
                type="button"
                onClick={() => { void updateVenture({ intensity: it.value }); }}
                style={{
                  padding: '4px 10px', borderRadius: 999,
                  border: it.value === intensity ? '1px solid #0b1220' : '1px solid #d6cfb8',
                  background: it.value === intensity ? '#0b1220' : 'transparent',
                  color: it.value === intensity ? '#fff' : '#64748b',
                  fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.06em',
                }}
              >{it.label.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64,
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10.5,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f766e',
              fontWeight: 700, marginBottom: 14,
            }}>{v.kicker}</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 110,
              lineHeight: 0.95, color: '#0b1220',
              letterSpacing: '-0.04em', marginBottom: 28, fontWeight: 400,
            }}>{v.title}</div>
            <div style={{
              fontFamily: FONT_SERIF, fontSize: 28,
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
            display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 100,
            opacity: chosen ? 0.6 : 1, pointerEvents: chosen ? 'none' : 'auto',
          }}>
            <DoorButton
              letter="A"
              title="Walk me through it"
              desc="Step-by-step. Starts at Customer Segment — that's where investors press first. Six foundation questions, then the full stack."
              tag="DOOR A · GUIDED"
              minutes="≈ 20 min"
              onClick={() => { void pickDoor('A'); }}
            />
            <DoorButton
              letter="B"
              title="I'll dump what I have"
              desc="All 16 layers visible at once. Fill in what you know. Leave blanks where you don't. Pick a source — that's how I score you."
              tag="DOOR B · SNAPSHOT"
              minutes="≈ 15 min"
              dark
              onClick={() => { void pickDoor('B'); }}
            />
            <div style={{
              fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
              letterSpacing: '0.06em', marginTop: 6, lineHeight: 1.6,
            }}>
              You can switch any time. The stack is the same.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
