// PerspectiveControl — "View through a perspective" role-lens selector.
//
// A perspective changes emphasis and guidance only; it never touches stored
// answers or scores. Rendered as an accessible radiogroup (roving tab stop,
// Arrow keys move the choice). Defaults to "All perspectives".

import { useRef } from 'react';
import { PERSPECTIVES, type Perspective } from '../lib/perspectives';
import { FONT_MONO, INK, MUTED, SLATE_FG, TAN } from '../lib/tokens';

interface Props {
  value: Perspective;
  onChange: (p: Perspective) => void;
  /** Compact = header pill row; full = labelled block with the explainer. */
  compact?: boolean;
}

export function PerspectiveControl({ value, onChange, compact = false }: Props) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, delta: number) => {
    const next = (from + delta + PERSPECTIVES.length) % PERSPECTIVES.length;
    onChange(PERSPECTIVES[next].id);
    btnRefs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(index, 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(index, -1); }
  };

  const group = (
    <div role="radiogroup" aria-label="View through a perspective"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {PERSPECTIVES.map((p, i) => {
        const on = p.id === value;
        return (
          <button
            key={p.id}
            ref={(el) => { btnRefs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(p.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            style={{
              padding: compact ? '5px 11px' : '6px 12px', borderRadius: 999,
              fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              border: `1px solid ${on ? INK : TAN}`,
              background: on ? INK : '#fff',
              color: on ? '#fff' : SLATE_FG, fontWeight: on ? 600 : 500,
            }}
          >{p.label}</button>
        );
      })}
    </div>
  );

  if (compact) return group;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: INK, fontWeight: 700,
      }}>View through a perspective</div>
      {group}
      <p style={{ margin: 0, fontSize: 11.5, color: MUTED, lineHeight: 1.45 }}>
        A perspective changes which layers are emphasized and the guidance you see.
        It never changes your answers or evidence scores.
      </p>
    </div>
  );
}
