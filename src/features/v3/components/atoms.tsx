// Functional v3 atoms — reusable across Door A, Door B, dashboard, pitch.
// These are the persistence-aware versions of the design-canvas atoms.

import {
  useEffect, useId, useRef, useState,
  type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode,
} from 'react';
import { PK_LAYER_BY_ID, PK_SOURCES, pkHidesSource, pkSourcesFor, pkTier } from '../lib/layers';
import type { LayerCategory, SourceId } from '../lib/layers';
import type { GateProgress } from '../lib/gates';
import {
  AMBER_FG, AMBER_LINE, AMBER_SOFT, GOLD, HAIR, INK, MUTED,
  SLATE_FG, STONE, TAN, TEAL,
} from '../lib/tokens';

const FONT_MONO = 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

// ── useTooltip ──
//
// Shared hover/focus tooltip behavior. Three atoms (GateBadge, EvaluatorChip,
// PillOption) had near-identical copies of the open-state + four event
// handlers, none of which were dismissible by keyboard. This consolidates them
// and adds Escape-to-dismiss (WCAG 1.4.13 "Content on Hover or Focus"). The
// returned `tooltipId` lets a caller wire `aria-describedby` so the tooltip
// content is announced when the trigger is focused.
function useTooltip() {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const triggerProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onKeyDown: (e: ReactKeyboardEvent) => { if (e.key === 'Escape') setOpen(false); },
  };
  return { open, setOpen, tooltipId, triggerProps };
}

// ── ModalShell ──
//
// Accessible dialog wrapper: renders the dimmed backdrop + centered panel with
// role="dialog"/aria-modal, moves focus into the dialog on open and restores it
// to the trigger on close, traps Tab within the panel, and closes on Escape or
// backdrop click. Callers pass an `onClose` that owns any guard (e.g. ignore
// close while a delete is in flight) and a `labelledById` matching the id of
// their title element.
const FOCUSABLE_SEL =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ModalShell({
  onClose, labelledById, panelStyle, children,
}: {
  onClose: () => void;
  labelledById?: string;
  panelStyle?: CSSProperties;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the first focusable element on open; restore focus to the previously
  // focused element (the trigger) on close.
  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SEL);
    (focusables && focusables.length ? focusables[0] : panel)?.focus();
    return () => { prevActive?.focus?.(); };
  }, []);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const f = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SEL));
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(11,18,32,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          background: '#fff', borderRadius: 12, padding: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: 14,
          boxShadow: '0 12px 60px rgba(11,18,32,0.25)', outline: 'none',
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
  // Aspirational strategy layers (World Impact, Exit) cite no evidence, so the
  // "How do you know?" picker is suppressed entirely for them.
  if (pkHidesSource(layerId)) return null;
  return (
    <div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
        letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
        marginBottom: 8,
      }}>How do you know?</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pkSourcesFor(layerId).map((s) => {
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
//
// Sprint 3 T10 — rich hover/focus tooltip that expands the CPF/PSF/BMV
// abbreviation, names every contributing layer with actual/required tier,
// and states the threshold. Replaces the bare native `title` attribute.
export function GateBadge({ gate, compact = false }: { gate: GateProgress; compact?: boolean }) {
  const passed = gate.passed;
  const fg = passed ? '#0f766e' : gate.passedReqs > 0 ? '#b45309' : '#94a3b8';
  const bg = passed ? '#dcfce7' : gate.passedReqs > 0 ? '#fef3c7' : '#f1f5f9';
  const { open, tooltipId, triggerProps } = useTooltip();
  return (
    <span style={{ position: 'relative', display: 'inline-block', isolation: 'isolate' }}>
      {/* Status indicator, not an action — focusable so keyboard users can
          reveal the breakdown tooltip, which is announced via aria-describedby.
          (No role="button": activating it does nothing.) */}
      <div
        tabIndex={0}
        aria-label={`${gate.name}: ${gate.passedReqs} of ${gate.totalReqs} requirements met`}
        aria-describedby={open ? tooltipId : undefined}
        {...triggerProps}
        style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 6,
          padding: compact ? '3px 8px' : '4px 10px',
          borderRadius: compact ? 4 : 6,
          background: bg, color: fg,
          fontFamily: FONT_MONO,
          fontSize: compact ? 10 : 11,
          letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase',
          outline: 'none',
        }}
      >
        <span>{gate.short}</span>
        <span style={{ opacity: 0.7, fontWeight: 500 }}>
          {gate.passedReqs}/{gate.totalReqs}
        </span>
      </div>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute', right: 0, top: '100%',
            marginTop: 6, zIndex: 200, width: 280,
            padding: '10px 12px', borderRadius: 6,
            background: '#0b1220', color: '#f8fafc',
            fontSize: 11.5, lineHeight: 1.45, textAlign: 'left',
            boxShadow: '0 6px 16px rgba(11,18,32,0.18)',
            pointerEvents: 'none', textTransform: 'none', letterSpacing: 0,
            fontWeight: 400,
          }}
        >
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
            color: '#fcd34d', fontWeight: 700, textTransform: 'uppercase',
            marginBottom: 4,
          }}>{gate.short} · {passed ? 'cleared' : `${gate.passedReqs}/${gate.totalReqs}`}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{gate.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 4 }}>
            {gate.reqs.map((r) => {
              const layer = PK_LAYER_BY_ID[r.layerId];
              return (
                <div key={r.layerId} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 10,
                }}>
                  <span style={{ color: r.ok ? '#86efac' : '#cbd5e1' }}>
                    {r.ok ? '✓' : '·'} {layer?.name ?? r.layerId}
                  </span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10.5,
                    color: r.ok ? '#86efac' : '#94a3b8',
                  }}>{r.actualTier}/{r.minTier}★</span>
                </div>
              );
            })}
          </div>
          <div style={{
            paddingTop: 6, borderTop: '1px solid #334155',
            color: '#cbd5e1', fontSize: 11,
          }}>Each layer needs the minimum stars shown. Stars come from source quality.</div>
        </span>
      )}
    </span>
  );
}

// ── GateMeter (with per-req breakdown) ──
//
// When `onLayerClick` is provided, each contributing-layer row becomes a
// clickable button (used by the dashboard + layer-detail Stage Gates panel
// to deep-link into a layer). When undefined, rows are static divs (Door B
// already lists the editable layer rows on the same page, so no link).
export function GateMeter({
  gate, onLayerClick,
}: {
  gate: GateProgress;
  onLayerClick?: (layerId: string) => void;
}) {
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
          const rowText = layer?.name ?? r.layerId;
          const tierStr = `${r.actualTier}/${r.minTier}`;
          const dot = (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: r.ok ? '#0f766e' : '#cbd5e1',
              flexShrink: 0,
            }} />
          );
          const nameSpan = (
            <span style={{ flex: 1, textAlign: 'left' }}>{rowText}</span>
          );
          const tierSpan = (
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5,
              color: r.ok ? '#0f766e' : '#94a3b8', letterSpacing: '0.06em',
            }}>{tierStr}</span>
          );
          if (onLayerClick) {
            return (
              <button
                key={r.layerId}
                type="button"
                onClick={() => onLayerClick(r.layerId)}
                aria-label={`${rowText}, ${r.actualTier} of ${r.minTier} required tiers${r.ok ? ' (met)' : ''} — open layer`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '3px 6px', margin: '-3px -6px',
                  background: 'transparent', border: '1px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', borderRadius: 4,
                  textAlign: 'left',
                  fontSize: 12, color: r.ok ? '#065f46' : '#475569',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {dot}{nameSpan}{tierSpan}
              </button>
            );
          }
          return (
            <div key={r.layerId} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: r.ok ? '#065f46' : '#475569',
            }}>
              {dot}{nameSpan}{tierSpan}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GateMeterSummary ──
//
// Collapsed one-line variant for cleared gates (Sprint 2 T7 — used on the
// dashboard so cleared gates step out of focus and the next gate foregrounds).
export function GateMeterSummary({ gate }: { gate: GateProgress }) {
  return (
    <div style={{
      padding: '8px 14px', border: '1px solid #bbf7d0', borderRadius: 8,
      background: '#f0fdf4',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 10.5, color: '#065f46',
        letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
      }}>{gate.short}</span>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 10.5, color: '#065f46', fontWeight: 600,
        letterSpacing: '0.06em',
      }}>{gate.name}</span>
      <span aria-hidden style={{
        fontFamily: FONT_MONO, fontSize: 12, color: '#065f46', fontWeight: 700,
      }}>✓</span>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 10, color: '#065f46',
        letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
      }}>Cleared</span>
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

// Sprint 3 T10 — evaluator label is interactive with a hover/focus tooltip
// that explains the lens. v1 ships with a single evaluator (Investor) so the
// tooltip framing is mostly explanatory; swap to a richer picker if v1.5
// surfaces the evaluator switcher.
function EvaluatorChip({ name }: { name: string }) {
  const { open, tooltipId, triggerProps } = useTooltip();
  return (
    <span style={{ position: 'relative', display: 'inline-block', isolation: 'isolate' }}>
      <span
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        {...triggerProps}
        style={{
          color: '#475569', cursor: 'help',
          borderBottom: '1px dotted #94a3b8',
          outline: 'none',
        }}
      >{name}</span>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute', left: 0, top: '100%',
            marginTop: 6, zIndex: 200, width: 260,
            padding: '8px 10px', borderRadius: 6,
            background: '#0b1220', color: '#f8fafc',
            fontSize: 11.5, lineHeight: 1.45, textAlign: 'left',
            boxShadow: '0 6px 16px rgba(11,18,32,0.18)',
            pointerEvents: 'none', textTransform: 'none', letterSpacing: 0,
            fontWeight: 400,
          }}
        >Evaluator: the lens we&apos;re using to pressure-test your stack. Pushback content is keyed to this lens.</span>
      )}
    </span>
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
          PivotKit · {industry ?? 'venture'}
          {evaluator && (<>{' · '}<EvaluatorChip name={evaluator} /></>)}
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

// ── MentorCallout — coral/amber-accented "Monty voice" block ──
//
// Replaces the inline pushback styling that's been copy-pasted into DoorAPage
// and DashboardPage. Keep tone direct, not corporate.

export function MentorCallout({
  kicker = 'Monty · mentor voice',
  body,
  italic = false,
  tone = 'gold',
}: {
  kicker?: string;
  body: ReactNode;
  italic?: boolean;
  tone?: 'gold' | 'amber';
}) {
  const isAmber = tone === 'amber';
  return (
    <div style={{
      padding: '14px 16px',
      background: isAmber ? AMBER_SOFT : '#fff',
      border: `1px solid ${isAmber ? AMBER_LINE : TAN}`,
      borderLeft: `3px solid ${isAmber ? AMBER_FG : GOLD}`,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: FONT_MONO, fontSize: 9.5,
        color: isAmber ? '#92400e' : AMBER_FG,
        letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isAmber ? AMBER_FG : GOLD,
        }} />
        {kicker}
      </div>
      <div style={{
        fontFamily: italic ? FONT_SERIF : 'inherit',
        fontSize: italic ? 15.5 : 13.5,
        lineHeight: 1.45, color: INK,
        fontStyle: italic ? 'italic' : 'normal',
      }}>{italic && typeof body === 'string' ? <>&ldquo;{body}&rdquo;</> : body}</div>
    </div>
  );
}

// ── PillOption — selectable pill with hover/focus tooltip ──
//
// Used by L8.3 (triple-filter scoring) and L10.3 (business model picker).
// The visible tooltip is supplemented by a native `title` so screen readers
// get the same content.

export function PillOption({
  selected, label, tip, onClick, disabled,
}: {
  selected: boolean;
  label: string;
  tip: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  // `title` carries the tip for screen readers; the hook adds the visual
  // tooltip's open-state plus Escape-to-dismiss. (No aria-describedby here —
  // it would double-announce with the native title.)
  const { open, triggerProps } = useTooltip();
  // Sprint 3 T4 — float tooltip *above* the pill, not below. L8.3's triple-
  // filter grid is row-dense; a tooltip hanging down was covering the row the
  // founder needed to read next. Isolated stacking context keeps it above
  // adjacent row backgrounds.
  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      isolation: 'isolate',
    }}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        title={tip}
        {...triggerProps}
        style={{
          padding: '5px 11px', borderRadius: 999,
          fontSize: 11.5, fontWeight: 500,
          border: `1px solid ${selected ? INK : TAN}`,
          background: selected ? INK : '#fff',
          color: selected ? '#fff' : SLATE_FG,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          fontFamily: 'inherit',
          transition: 'background .12s, color .12s, border-color .12s',
        }}
      >{label}</button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', left: '50%', bottom: '100%',
            transform: 'translate(-50%, -8px)',
            zIndex: 200, width: 240,
            padding: '8px 10px', borderRadius: 6,
            background: INK, color: '#f8fafc',
            fontSize: 11.5, lineHeight: 1.4,
            boxShadow: '0 6px 16px rgba(11,18,32,0.18)',
            pointerEvents: 'none',
          }}
        >{tip}</span>
      )}
    </span>
  );
}

// ── ScoreBar — normalized horizontal bar with numeric readout ──
//
// Used by L8.3 to visualize the per-sub-group beachhead score (range 6-18,
// normalized 0-1 for the bar). Null raw → empty bar + em dash.

export function ScoreBar({
  raw, normalized,
}: {
  /** Raw score (6–18) or null when unscored. */
  raw: number | null;
  /** Pre-normalized 0–1 fill. */
  normalized: number;
}) {
  const isHigh = normalized >= 0.7;
  const isLow = normalized > 0 && normalized < 0.4;
  const barColor = raw == null ? 'transparent' : isHigh ? TEAL : isLow ? MUTED : '#94a3b8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3, background: HAIR, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(0, Math.min(1, normalized)) * 100}%`,
          height: '100%', background: barColor,
          transition: 'width .25s ease',
        }} />
      </div>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 11.5,
        color: raw == null ? MUTED : isHigh ? TEAL : INK,
        fontWeight: isHigh ? 700 : 500,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 22, textAlign: 'right',
      }}>{raw == null ? '—' : raw}</span>
    </div>
  );
}

// ── BeachheadRadio — single-select toggle visualized as a radio dot ──
//
// A button under the hood; aria-pressed conveys state. Only one is selected
// at a time across the grid (parent owns the selection).

export function BeachheadRadio({
  selected, label, onToggle,
}: {
  selected: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Select ${label} as beachhead`}
      aria-pressed={selected}
      onClick={onToggle}
      style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${selected ? TEAL : STONE}`,
        background: selected ? TEAL : '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
        transition: 'border-color .12s, background .12s',
      }}
    >
      {selected && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: GOLD,
        }} />
      )}
    </button>
  );
}

// ── ParentChip — small chip used for parent-group listings ──

export function ParentChip({ name, count }: { name: string; count: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      border: `1px solid ${TAN}`, background: '#fff',
      fontFamily: FONT_MONO, fontSize: 10.5,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: SLATE_FG, fontWeight: 600,
    }}>
      <span style={{ color: INK, fontWeight: 700 }}>{name}</span>
      <span style={{ color: MUTED }}>· {count}</span>
    </span>
  );
}


