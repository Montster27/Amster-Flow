// FrameworkDisclosure — the collapsible "See progress and framework" section.
//
// v3 usability step 1 (progressive disclosure): the guided flow shows only the
// current task above the fold. Everything framework-shaped — stage gates
// (CPF/PSF/BMV), the layer evidence-strength totals, the full step navigator,
// and the graduation requirements — lives behind this one collapsed control so
// a first-run founder isn't asked to parse the whole framework to take the
// next step.
//
// The open/closed choice persists in localStorage so it survives navigation
// between guided steps (and reloads). The component itself is presentational;
// the page composes the framework content as children.

import { useCallback, useId, useState, type ReactNode } from 'react';
import { FONT_MONO, INK, MUTED, SLATE_FG, TAN, TEAL } from '../lib/tokens';

/**
 * Persisted open/closed state for a disclosure, keyed by `storageKey`.
 * Reads the initial value synchronously so the first paint matches the
 * founder's last choice (no open→closed flicker). Falls back to `defaultOpen`
 * when storage is empty or unavailable (SSR, privacy mode).
 */
export function useFrameworkDisclosure(storageKey: string, defaultOpen = false) {
  const [open, setOpenState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw == null ? defaultOpen : raw === '1';
    } catch {
      return defaultOpen;
    }
  });

  const write = (next: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next ? '1' : '0');
      }
    } catch {
      /* storage unavailable — keep in-memory state only */
    }
  };

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    write(next);
  }, [storageKey]);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      write(next);
      return next;
    });
  }, [storageKey]);

  return { open, setOpen, toggle };
}

export function FrameworkDisclosure({
  open,
  onToggle,
  children,
  summary = 'See progress and framework',
  hint = 'Stage gates, evidence strength, and the full step list',
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  summary?: string;
  hint?: string;
}) {
  const contentId = useId();
  return (
    <section style={{ marginTop: 28 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
          background: '#fff', border: `1px solid ${TAN}`, borderRadius: 8,
          fontFamily: 'inherit', color: INK,
        }}
      >
        <span aria-hidden style={{
          display: 'inline-flex', width: 18, justifyContent: 'center',
          color: TEAL, fontSize: 12, transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform .15s ease',
        }}>▸</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.04em', color: INK,
          }}>{summary}</span>
          <span style={{ fontSize: 12, color: SLATE_FG, lineHeight: 1.4 }}>{hint}</span>
        </span>
        <span aria-hidden style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED,
          letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div
          id={contentId}
          role="region"
          aria-label={summary}
          style={{
            marginTop: 12, border: `1px solid ${TAN}`, borderRadius: 8,
            background: '#fbfaf7', overflow: 'hidden',
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
