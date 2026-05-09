// Surface 7 · Sector map (L03 Sector Mapping — two-degree player landscape).

import type { ReactNode } from 'react';
import { VENTURE } from '../data';
import type { Industry } from '../data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

function SHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
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

interface Player {
  name: string;
  q: 'direct' | 'adjacent' | 'donothing' | 'substitute';
  ring: 1 | 2;
  angle: number;
}

const PLAYERS: Player[] = [
  { name: 'Petco Find',         q: 'direct', ring: 1, angle:  75 },
  { name: 'PawBoost',           q: 'direct', ring: 1, angle: 105 },
  { name: 'Local rescue listings', q: 'direct', ring: 2, angle: 90 },
  { name: 'Nextdoor',           q: 'adjacent', ring: 1, angle:  25 },
  { name: 'Ring neighborhood',  q: 'adjacent', ring: 2, angle:  10 },
  { name: 'Vet practice CRM',   q: 'adjacent', ring: 2, angle:  50 },
  { name: 'Facebook posts',     q: 'donothing', ring: 1, angle: 285 },
  { name: 'Paper flyers',       q: 'donothing', ring: 1, angle: 255 },
  { name: 'Word of mouth',      q: 'donothing', ring: 2, angle: 270 },
  { name: 'AirTag / GPS collar', q: 'substitute', ring: 1, angle: 200 },
  { name: 'Shelter databases',   q: 'substitute', ring: 2, angle: 165 },
  { name: 'Microchip registries', q: 'substitute', ring: 2, angle: 215 },
];

const TONE: Record<Player['q'], string> = {
  direct: '#b45309',
  adjacent: '#0f766e',
  donothing: '#94a3b8',
  substitute: '#7c3aed',
};

export function SectorMap({ industry = 'software' }: { industry?: Industry }) {
  const v = VENTURE[industry];

  const cx = 380;
  const cy = 320;
  const r1 = 110;
  const r2 = 200;
  const toXY = (angle: number, r: number) => {
    const a = (angle * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };

  return (
    <div style={{ height: '100%', background: '#fbfaf7', display: 'flex', flexDirection: 'column' }}>
      <SHead
        kicker={`${v.name} · L03 Sector Mapping`}
        title="Players two degrees from where you expect to be."
        right={
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
            letterSpacing: '0.08em',
          }}>{PLAYERS.length} ACTORS · 2° HORIZON</span>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 760 640" width="100%" height="100%" style={{ display: 'block' }}>
            <line x1={cx - r2 - 30} y1={cy} x2={cx + r2 + 30} y2={cy}
              stroke="#ece6d6" strokeWidth="1" strokeDasharray="3 4" />
            <line x1={cx} y1={cy - r2 - 30} x2={cx} y2={cy + r2 + 30}
              stroke="#ece6d6" strokeWidth="1" strokeDasharray="3 4" />

            <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 6" />

            <text x={cx + r1 + 4} y={cy - 4} fontSize="10" fontFamily="JetBrains Mono"
              fill="#94a3b8" letterSpacing="1">1°</text>
            <text x={cx + r2 + 4} y={cy - 4} fontSize="10" fontFamily="JetBrains Mono"
              fill="#94a3b8" letterSpacing="1">2°</text>

            {[
              { label: 'DIRECT',     x: cx,            y: cy - r2 - 40, fill: TONE.direct },
              { label: 'ADJACENT',   x: cx + r2 + 40,  y: cy - 4,       fill: TONE.adjacent, anchor: 'end' as const },
              { label: 'DO-NOTHING', x: cx,            y: cy + r2 + 50, fill: TONE.donothing },
              { label: 'SUBSTITUTE', x: cx - r2 - 40,  y: cy - 4,       fill: TONE.substitute, anchor: 'start' as const },
            ].map((q) => (
              <text key={q.label} x={q.x} y={q.y} fontSize="11" fontFamily="JetBrains Mono"
                fill={q.fill} fontWeight="700" letterSpacing="2"
                textAnchor={q.anchor || 'middle'}>{q.label}</text>
            ))}

            {PLAYERS.map((p, i) => {
              const r = p.ring === 1 ? r1 : r2;
              const [x, y] = toXY(p.angle, r);
              return (
                <line key={`c${i}`} x1={cx} y1={cy} x2={x} y2={y}
                  stroke={TONE[p.q]} strokeOpacity="0.18" strokeWidth="1" />
              );
            })}

            {PLAYERS.map((p, i) => {
              const r = p.ring === 1 ? r1 : r2;
              const [x, y] = toXY(p.angle, r);
              const size = p.ring === 1 ? 9 : 6;
              return (
                <g key={`n${i}`}>
                  <circle cx={x} cy={y} r={size} fill={TONE[p.q]}
                    stroke="#fff" strokeWidth="2" />
                  <text x={x} y={y + size + 14} fontSize="11.5"
                    fontFamily="Inter, sans-serif"
                    fill="#0b1220" textAnchor="middle"
                    fontWeight={p.ring === 1 ? 600 : 400}>{p.name}</text>
                </g>
              );
            })}

            <circle cx={cx} cy={cy} r="22" fill="#0b1220" />
            <text x={cx} y={cy + 4} fontSize="11" fontFamily="JetBrains Mono"
              fill="#fff" textAnchor="middle" fontWeight="700" letterSpacing="1">YOU</text>
          </svg>
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
            }}>How to read it</div>
            <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>
              Inner ring is one degree out — direct competitors and the closest
              substitutes. Outer ring is two degrees — actors who shape behavior
              without selling against you.
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #e8dfc9', paddingTop: 14,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              { k: 'direct' as const,     name: 'Direct',     hint: 'Same job, paid product.' },
              { k: 'adjacent' as const,   name: 'Adjacent',   hint: 'Reaches the same buyer for a related job.' },
              { k: 'donothing' as const,  name: 'Do-nothing', hint: 'What people do today for free.' },
              { k: 'substitute' as const, name: 'Substitute', hint: 'Different mechanism, same outcome.' },
            ].map((q) => (
              <div key={q.k} style={{
                display: 'grid', gridTemplateColumns: '14px 1fr', gap: 10,
                alignItems: 'flex-start',
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: TONE[q.k], marginTop: 5,
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0b1220' }}>{q.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{q.hint}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 'auto', padding: '12px 14px', borderRadius: 8,
            background: '#fff', border: '1px dashed #cbd5e1',
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9.5, color: '#94a3b8',
              letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4,
            }}>+ ADD ACTOR</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
              Drop a name; pick a quadrant; pick a ring. Stars come from how you
              know they exist.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
