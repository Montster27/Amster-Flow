// Functional v3 atoms — reusable across Door A, Door B, dashboard, pitch.
// These are the persistence-aware versions of the design-canvas atoms.

import type { CSSProperties } from 'react';
import { PK_LAYER_BY_ID, PK_SOURCES, pkTier } from '../lib/layers';
import type { LayerCategory, SourceId } from '../lib/layers';
import type { GateProgress } from '../lib/gates';

const FONT_MONO = 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

// ── TierLadder ──
export function TierLadder({
  tier = 0, tone = 'critical', size = 'md',
}: { tier?: number; tone?: LayerCategory; size?: 'sm' | 'md' }) {
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

// ── SourcePill (read-only pretty pill) ──
export function SourcePill({ src, size = 'sm' }: { src?: SourceId | null; size?: 'sm' | 'md' }) {
  if (!src) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'md' ? '4px 10px' : '3px 8px',
        borderRadius: 14, background: 'transparent', border: '1px dashed #cbd5e1',
        color: '#94a3b8', fontFamily: FONT_MONO,
        fontSize: size === 'md' ? 11 : 10, letterSpacing: '0.06em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>— empty</span>
    );
  }
  const map: Record<SourceId, { bg: string; fg: string; dot: string }> = {
    logical:    { bg: '#f4f1ea', fg: '#92400e', dot: '#f59e0b' },
    experience: { bg: '#f4f1ea', fg: '#b45309', dot: '#f59e0b' },
    research:   { bg: '#e6f4f1', fg: '#0f766e', dot: '#0f766e' },
    interviews: { bg: '#dcf2ec', fg: '#065f46', dot: '#0f766e' },
    prototype:  { bg: '#0b1220', fg: '#fff',    dot: '#fcd34d' },
  };
  const m = map[src];
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

// ── SourcePicker (interactive — calls onChange) ──
export function SourcePicker({
  value, layerId, onChange, disabled = false,
}: {
  value?: SourceId | null;
  layerId: string;
  onChange: (id: SourceId | null) => void;
  disabled?: boolean;
}) {
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
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(on ? null : s.id)}
              title={on ? 'Click to clear' : `Set as ${s.label}`}
              style={{
                padding: '7px 12px', borderRadius: 18,
                background: on ? '#0b1220' : '#fff',
                border: `1px solid ${on ? '#0b1220' : '#d6cfb8'}`,
                color: on ? '#fff' : '#475569',
                fontSize: 12.5, cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontFamily: 'inherit',
                transition: 'background .12s, border-color .12s, color .12s',
              }}
            >
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

// ── GateBadge ──
export function GateBadge({ gate, compact = false }: { gate: GateProgress; compact?: boolean }) {
  const passed = gate.passed;
  const fg = passed ? '#0f766e' : gate.passedReqs > 0 ? '#b45309' : '#94a3b8';
  const bg = passed ? '#dcfce7' : gate.passedReqs > 0 ? '#fef3c7' : '#f1f5f9';
  return (
    <div
      title={gate.name + ': ' + gate.passedReqs + '/' + gate.totalReqs + ' requirements met'}
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 6,
        padding: compact ? '3px 8px' : '4px 10px',
        borderRadius: compact ? 4 : 6,
        background: bg, color: fg,
        fontFamily: FONT_MONO,
        fontSize: compact ? 10 : 11,
        letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase',
      }}
    >
      <span>{gate.short}</span>
      <span style={{ opacity: 0.7, fontWeight: 500 }}>
        {gate.passedReqs}/{gate.totalReqs}
      </span>
    </div>
  );
}

// ── GateMeter (with per-req breakdown) ──
export function GateMeter({ gate }: { gate: GateProgress }) {
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
          fontFamily: FONT_MONO, fontSize: 10.5, color: '#0f766e',
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
        }}>{gate.short}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#475569' }}>
          {gate.passedReqs}/{gate.totalReqs}
        </span>
      </div>
      <div style={{
        fontFamily: FONT_SERIF, fontSize: 18,
        color: '#0b1220', letterSpacing: '-0.005em', marginBottom: 10, lineHeight: 1.25,
      }}>{gate.name}</div>
      <div style={{
        height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          width: `${gate.pct * 100}%`, height: '100%',
          background: gate.passed ? '#0f766e' : '#fcd34d',
          transition: 'width .25s',
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {gate.reqs.map((r) => {
          const layer = PK_LAYER_BY_ID[r.layerId];
          return (
            <div key={r.layerId} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: r.ok ? '#065f46' : '#475569',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: r.ok ? '#0f766e' : '#cbd5e1',
              }} />
              <span style={{ flex: 1 }}>{layer?.name ?? r.layerId}</span>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 10.5,
                color: r.ok ? '#0f766e' : '#94a3b8', letterSpacing: '0.06em',
              }}>{r.actualTier}/{r.minTier}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CategoryBadge ──
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

// ── PageShell — warm-paper container used by all v3 pages ──
export function PageShell({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#fbfaf7', color: '#0b1220',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      ...style,
    }}>{children}</div>
  );
}

// ── Header bar with breadcrumb + gate badges + venture name ──
export function VentureHeader({
  ventureName, industry, evaluator, gates, right,
}: {
  ventureName: string;
  industry?: string;
  evaluator?: string;
  gates?: GateProgress[];
  right?: React.ReactNode;
}) {
  return (
    <header style={{
      padding: '14px 28px', borderBottom: '1px solid #e8dfc9',
      background: '#fbfaf7',
      display: 'flex', alignItems: 'center', gap: 18,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600,
        }}>
          PivotKit · {industry ?? 'venture'}{evaluator ? ` · ${evaluator}` : ''}
        </div>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 22, color: '#0b1220',
          letterSpacing: '-0.01em', lineHeight: 1.15, marginTop: 2,
        }}>{ventureName}</div>
      </div>
      <div style={{ flex: 1 }} />
      {gates && (
        <div style={{ display: 'flex', gap: 8 }}>
          {gates.map((g) => <GateBadge key={g.id} gate={g} />)}
        </div>
      )}
      {right}
    </header>
  );
}
