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

const INTENSITIES: { value: Intensity; label: string; tip: string }[] = [
  { value: 'direct', label: 'Direct', tip: "Monty's default voice." },
  { value: 'warmer', label: 'Warmer', tip: 'Same content, more encouragement.' },
  { value: 'sharp',  label: 'Sharp',  tip: 'More challenge, less softening.' },
];

// Sprint 3 T9 — voice-option pill with hover/focus tooltip. Selected state is
// the visually heaviest (dark fill, white text, bold weight). Tooltip is plain
// UX copy, not mentor voice.
function VoiceOption({
  active, label, tip, onClick,
}: {
  active: boolean;
  label: string;
  tip: string;
  onClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', isolation: 'isolate' }}>
      <button
        type="button"
        onClick={onClick}
        title={tip}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-pressed={active}
        style={{
          padding: '4px 10px', borderRadius: 999,
          border: active ? '1px solid #0b1220' : '1px solid #d6cfb8',
          background: active ? '#0b1220' : 'transparent',
          color: active ? '#fff' : '#64748b',
          fontWeight: active ? 700 : 500,
          fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: '0.06em',
          transition: 'background .12s, color .12s, border-color .12s',
        }}
      >{label.toUpperCase()}</button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', left: '50%', top: '100%',
            transform: 'translate(-50%, 8px)',
            zIndex: 200, width: 220,
            padding: '8px 10px', borderRadius: 6,
            background: '#0b1220', color: '#f8fafc',
            fontSize: 11.5, lineHeight: 1.4, textAlign: 'left',
            boxShadow: '0 6px 16px rgba(11,18,32,0.18)',
            pointerEvents: 'none', textTransform: 'none',
            letterSpacing: 0,
          }}
        >{tip}</span>
      )}
    </span>
  );
}

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
  const [pickError, setPickError] = useState<string | null>(null);

  if (!projectId) {
    return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  }
  if (loading) return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;

  const intensity = venture?.intensity ?? 'sharp';
  const v = OPENING[intensity];

  const pickDoor = async (door: DoorChoice) => {
    setChosen(door);
    setPickError(null);
    try {
      await updateVenture({ door_choice: door });
      // Navigate only after the choice persists. Previously this lived in a
      // `finally`, so a failed write still forwarded the founder into a door
      // whose choice never saved.
      navigate(door === 'A' ? `/v3/door-a/${projectId}` : `/v3/door-b/${projectId}`);
    } catch (e) {
      // Re-enable the doors and surface the error so the founder can retry.
      setChosen(null);
      setPickError(e instanceof Error ? e.message : String(e));
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
              <VoiceOption
                key={it.value}
                active={it.value === intensity}
                label={it.label}
                tip={it.tip}
                onClick={() => { void updateVenture({ intensity: it.value }); }}
              />
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64,
          alignItems: 'flex-start',
        }}>
          <div>
            {v.kicker && (
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10.5,
                letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0f766e',
                fontWeight: 700, marginBottom: 14,
              }}>{v.kicker}</div>
            )}
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
            {pickError && (
              <div role="alert" style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#be123c', fontSize: 12.5, lineHeight: 1.45,
              }}>
                Couldn&apos;t save your choice: {pickError}. Try again.
              </div>
            )}
            <DoorButton
              letter="A"
              title="Walk me through it"
              desc="Step-by-step. Starts at Customer Segment — that's where investors press first. Six foundation questions over ~20 minutes. You finish with: your full 16-layer stack, a heat map of where your evidence is thinnest, and an investor pressure test of your weakest claims."
              tag="DOOR A · GUIDED"
              minutes="≈ 20 min"
              onClick={() => { void pickDoor('A'); }}
            />
            <DoorButton
              letter="B"
              title="Explore the full stack"
              desc="Open Questions Up & Down: the whole 16-layer stack as a map, editing one layer at a time. Fill in what you know, leave blanks where you don't, pick a source — that's how I score you. Move up and down between connected layers as your understanding changes."
              tag="DOOR B · QUESTIONS UP & DOWN"
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
