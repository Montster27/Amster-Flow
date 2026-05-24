// WireframeReview.tsx
// Door A · L8.3 + L10.1 wireframe review wrapper.
// Self-contained tab switcher for designer/dev review.

import { useState } from 'react';
import L8_3_TripleFilter from './L8_3_TripleFilter';
import L10_1_ValueChain from './L10_1_ValueChain';

type WireframeKey = 'l8.3' | 'l10.1';

const TABS: { key: WireframeKey; label: string; sub: string }[] = [
  { key: 'l8.3',  label: 'L8.3 — Triple Filter',  sub: 'Sub-group scoring grid' },
  { key: 'l10.1', label: 'L10.1 — Value Chain',   sub: 'Chain builder' },
];

const PAPER = '#fbfaf7';
const INK   = '#0b1220';
const TAN   = '#e8dfc9';
const MUTED = '#94a3b8';
const TEAL  = '#0f766e';
const GOLD  = '#fcd34d';

export default function WireframeReview() {
  const [active, setActive] = useState<WireframeKey>('l8.3');

  return (
    <div className="min-h-screen w-full" style={{ background: PAPER, color: INK }}>
      {/* Tab strip */}
      <nav
        className="px-6 py-3 border-b flex items-center gap-3 sticky top-0 z-40"
        style={{ borderColor: TAN, background: PAPER }}
      >
        <span className="font-mono text-[10.5px] tracking-widest uppercase font-semibold mr-2" style={{ color: MUTED }}>
          Door A wireframes ·
        </span>
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className="px-3.5 py-1.5 rounded-md text-[12.5px] font-medium border transition-colors flex flex-col items-start gap-0.5"
              style={{
                background: on ? INK : '#fff',
                color: on ? '#fff' : INK,
                borderColor: on ? INK : TAN,
              }}
            >
              <span>{t.label}</span>
              <span
                className="font-mono text-[9.5px] uppercase tracking-widest"
                style={{ color: on ? GOLD : MUTED }}
              >
                {t.sub}
              </span>
            </button>
          );
        })}
        <span className="flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TEAL }}>
          Companion to door_a_l8_l10_spec.md
        </span>
      </nav>

      <div>
        {active === 'l8.3' ? <L8_3_TripleFilter /> : <L10_1_ValueChain />}
      </div>
    </div>
  );
}
