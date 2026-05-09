// Shared visual atoms — tier ladder, source pill, voice callout, etc.
// Mirrors pk-data-atoms.jsx (the atom subset). Inline styles preserved for
// pixel-fidelity to the design canvas.

import type { CSSProperties, ReactNode } from 'react';
import { PK_GATES, PK_LAYERS, PK_SOURCES, pkTier } from './data';
import type { LayerCategory, Stack } from './data';

const FONT_MONO = 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

export function CategoryBadge({ cat }: { cat: LayerCategory }) {
  const isCrit = cat === 'critical';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 4,
      background: isCrit ? '#0f766e' : 'transparent',
      border: isCrit ? '1px solid #0f766e' : '1px solid #cbd5e1',
      color: isCrit ? '#fff' : '#64748b',
      fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
      textTransform: 'uppercase', fontWeight: 700,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: isCrit ? 0 : '50%',
        background: isCrit ? '#fcd34d' : 'transparent',
        border: isCrit ? 'none' : '1px solid #94a3b8',
      }} />
      {isCrit ? 'Investor-critical' : 'Thoughtfulness'}
    </span>
  );
}

type LadderTone = 'critical' | 'thoughtful';
type LadderSize = 'sm' | 'md';

// 5-rung ladder. Solid filled rungs for critical, outline for thoughtful.
export function TierLadder({
  tier = 0, tone = 'critical', size = 'md',
}: { tier?: number; tone?: LadderTone; size?: LadderSize }) {
  const tot = 5;
  const w = size === 'sm' ? 14 : 18;
  const h = size === 'sm' ? 4 : 5;
  const gap = size === 'sm' ? 3 : 4;
  return (
    <span style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {Array.from({ length: tot }).map((_, i) => {
        const on = i < tier;
        const filled = tone === 'critical';
        return (
          <span key={i} style={{
            width: w, height: h, borderRadius: 1,
            background: on ? (filled ? '#0f766e' : 'transparent') : '#e2e8f0',
            border: on && !filled ? '1px solid #0f766e' : 'none',
          }} />
        );
      })}
    </span>
  );
}

// Glyphic tier — diamond-style for compact mono use
export function TierGlyphs({ tier = 0, tone = 'critical' }: { tier?: number; tone?: LadderTone }) {
  const tot = 5;
  const filled = tone === 'critical';
  return (
    <span style={{
      display: 'inline-flex', gap: 2, fontFamily: FONT_MONO,
      fontSize: 11, color: tier === 0 ? '#cbd5e1' : '#0f766e', letterSpacing: 0,
    }}>
      {Array.from({ length: tot }).map((_, i) => {
        const on = i < tier;
        return (
          <span key={i} style={{
            width: 9, height: 9, display: 'inline-block',
            background: on ? (filled ? '#0f766e' : 'transparent') : 'transparent',
            border: on && !filled ? '1.4px solid #0f766e'
              : on && filled ? 'none' : '1px solid #e2e8f0',
            transform: 'rotate(45deg)',
          }} />
        );
      })}
    </span>
  );
}

// Weight bar — vertical block height encodes tier
export function TierWeight({ tier = 0, tone = 'critical' }: { tier?: number; tone?: LadderTone }) {
  const tot = 5;
  const filled = tone === 'critical';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
      {Array.from({ length: tot }).map((_, i) => {
        const on = i < tier;
        const h = 4 + i * 3;
        return (
          <span key={i} style={{
            width: 5, height: h, borderRadius: 1,
            background: on ? (filled ? '#0f766e' : 'transparent') : '#e2e8f0',
            border: on && !filled ? '1px solid #0f766e' : 'none',
          }} />
        );
      })}
    </span>
  );
}

export function SourcePill({ src, size = 'sm' }: { src?: string; size?: LadderSize }) {
  if (!src) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'md' ? '4px 10px' : '3px 8px',
        borderRadius: 14, background: 'transparent', border: '1px dashed #cbd5e1',
        color: '#cbd5e1', fontFamily: FONT_MONO,
        fontSize: size === 'md' ? 11 : 10, letterSpacing: '0.06em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>— empty</span>
    );
  }
  const map: Record<string, { bg: string; fg: string; dot: string }> = {
    logical:    { bg: '#f4f1ea', fg: '#92400e', dot: '#f59e0b' },
    experience: { bg: '#f4f1ea', fg: '#b45309', dot: '#f59e0b' },
    research:   { bg: '#e6f4f1', fg: '#0f766e', dot: '#0f766e' },
    interviews: { bg: '#dcf2ec', fg: '#065f46', dot: '#0f766e' },
    prototype:  { bg: '#0b1220', fg: '#fff',    dot: '#fcd34d' },
  };
  const m = map[src] || map.logical;
  const label = PK_SOURCES.find((s) => s.id === src)?.short || src;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'md' ? '4px 10px' : '3px 8px',
      borderRadius: 14, background: m.bg, color: m.fg,
      fontFamily: FONT_MONO, fontSize: size === 'md' ? 11 : 10,
      letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />
      {label}
    </span>
  );
}

export function SourcePicker({
  value, layerId, onChange,
}: { value?: string; layerId: string; onChange?: (id: string) => void }) {
  return (
    <div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
        letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
        marginBottom: 8,
      }}>How do you know?</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PK_SOURCES.map((s) => {
          const on = s.id === value;
          const t = pkTier(layerId, s.id);
          return (
            <button key={s.id} type="button" onClick={() => onChange?.(s.id)} style={{
              padding: '7px 12px', borderRadius: 18,
              background: on ? '#0b1220' : '#fff',
              border: `1px solid ${on ? '#0b1220' : '#d6cfb8'}`,
              color: on ? '#fff' : '#475569',
              fontSize: 12.5, cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', gap: 7, fontFamily: 'inherit',
            }}>
              {s.label}
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10,
                color: on ? '#fcd34d' : '#0f766e', fontWeight: 700,
              }}>★{t}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VoiceCallout({
  kicker, quote, tail, attribution = 'Monty', tone = 'teal',
}: {
  kicker: string;
  quote: string;
  tail?: string;
  attribution?: string;
  tone?: 'teal' | 'amber';
}) {
  const accent = tone === 'amber' ? '#b45309' : '#0f766e';
  const kickerColor = tone === 'amber' ? '#92400e' : '#0f766e';
  return (
    <div style={{ position: 'relative', paddingLeft: 14 }}>
      <div style={{
        position: 'absolute', left: 0, top: 4, bottom: 4, width: 3,
        background: accent, borderRadius: 2,
      }} />
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10.5,
        color: kickerColor, letterSpacing: '0.14em', textTransform: 'uppercase',
        fontWeight: 700, marginBottom: 8,
      }}>{kicker}</div>
      <div style={{
        fontFamily: FONT_SERIF,
        fontSize: 22, lineHeight: 1.34, color: '#0b1220', letterSpacing: '-0.005em',
      }}>&ldquo;{quote}&rdquo;</div>
      {tail && (
        <div style={{
          fontSize: 13, color: '#475569', lineHeight: 1.55, marginTop: 10,
        }}>{tail}</div>
      )}
      <div style={{
        marginTop: 10, fontFamily: FONT_MONO, fontSize: 10.5,
        color: '#94a3b8', letterSpacing: '0.12em',
      }}>— {attribution.toUpperCase()}</div>
    </div>
  );
}

export function WinHead({
  sub, title, right,
}: { sub: string; title: string; right?: ReactNode }) {
  return (
    <div style={{
      padding: '18px 24px', borderBottom: '1px solid #e8dfc9',
      background: '#fbfaf7', display: 'flex', alignItems: 'flex-end', gap: 14,
    }}>
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5,
          color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase',
          fontWeight: 600, marginBottom: 6,
        }}>{sub}</div>
        <div style={{
          fontFamily: FONT_SERIF,
          fontSize: 24, color: '#0b1220', letterSpacing: '-0.012em',
          lineHeight: 1.18, maxWidth: 560,
        } as CSSProperties}>{title}</div>
      </div>
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

export function GateMeter({ stack, gate }: { stack: Stack; gate: keyof typeof PK_GATES }) {
  const G = PK_GATES[gate];
  const passed = G.reqs.filter((r) => (stack[r.layer]?.tier || 0) >= r.tier).length;
  const pct = passed / G.reqs.length;
  return (
    <div style={{
      padding: '14px 16px', border: '1px solid #e8dfc9', borderRadius: 10,
      background: '#fff',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10.5,
          color: '#0f766e', letterSpacing: '0.14em', textTransform: 'uppercase',
          fontWeight: 700,
        }}>{G.short}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#475569' }}>
          {passed}/{G.reqs.length}
        </span>
      </div>
      <div style={{
        fontFamily: FONT_SERIF, fontSize: 18,
        color: '#0b1220', letterSpacing: '-0.005em', marginBottom: 10, lineHeight: 1.25,
      }}>{G.name}</div>
      <div style={{
        height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: pct === 1 ? '#0f766e' : '#fcd34d',
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {G.reqs.map((r) => {
          const t = stack[r.layer]?.tier || 0;
          const ok = t >= r.tier;
          const layer = PK_LAYERS.find((L) => L.id === r.layer)!;
          return (
            <div key={r.layer} style={{
              display: 'flex', alignItems: 'center',
              gap: 8, fontSize: 12, color: ok ? '#065f46' : '#475569',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: ok ? '#0f766e' : '#cbd5e1',
              }} />
              <span style={{ flex: 1 }}>{layer.name}</span>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5,
                color: ok ? '#0f766e' : '#94a3b8', letterSpacing: '0.06em',
              }}>{t}/{r.tier}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
