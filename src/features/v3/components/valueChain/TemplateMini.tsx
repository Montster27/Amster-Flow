// TemplateMini — hoverable starter-template card for L10.1.
//
// Each template renders as a row of compact chips so the founder can preview
// the chain shape before loading. Click to load.

import {
  CORAL, CORAL_LITE, FONT_MONO, HAIR, INK, MUTED, SLATE_FG, TAN, TEAL, TEAL_LITE,
} from '../../lib/tokens';
import type { ChainRole } from '../../lib/doorAState';

export interface ChainTemplate {
  id: string;
  steps: number;
  title: string;
  subtitle: string;
  chain: { label: string; role: ChainRole }[];
}

export const CHAIN_TEMPLATES: ChainTemplate[] = [
  {
    id: 't-b2c', steps: 0,
    title: 'B2C', subtitle: 'Direct to consumer',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'End user', role: 'end-user' },
    ],
  },
  {
    id: 't-b2b1', steps: 1,
    title: 'B2B → end-customer biz',
    subtitle: 'You sell to companies that sell to people',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'Retailer / SaaS co.', role: 'retailer' },
      { label: 'End user', role: 'end-user' },
    ],
  },
  {
    id: 't-b2b2b2c', steps: 2,
    title: 'B2B2B2C',
    subtitle: 'Component → assembler → retailer',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'Manufacturer', role: 'maker' },
      { label: 'Retailer', role: 'retailer' },
      { label: 'End user', role: 'end-user' },
    ],
  },
  {
    id: 't-deepb2b', steps: 3,
    title: 'Deep B2B',
    subtitle: '3+ links between you and the end user',
    chain: [
      { label: 'You', role: 'maker' },
      { label: 'Industrial process', role: 'aggregator' },
      { label: 'Manufacturer', role: 'maker' },
      { label: 'Distributor', role: 'distributor' },
      { label: 'Retailer', role: 'retailer' },
      { label: 'End user', role: 'end-user' },
    ],
  },
];

export function TemplateMini({
  tmpl, hovered, onHover, onLoad,
}: {
  tmpl: ChainTemplate;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onLoad: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(tmpl.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(tmpl.id)}
      onBlur={() => onHover(null)}
      onClick={onLoad}
      style={{
        width: '100%', textAlign: 'left',
        padding: 12, borderRadius: 6,
        border: `1px solid ${hovered ? TEAL : TAN}`,
        background: hovered ? TEAL_LITE : '#fff',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background .12s, border-color .12s',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{tmpl.title}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED }}>
          {tmpl.steps === 0 ? '0 steps' : `${tmpl.steps} step${tmpl.steps > 1 ? 's' : ''}`}
        </span>
      </div>
      <div style={{ fontSize: 11, color: SLATE_FG, marginBottom: 8 }}>{tmpl.subtitle}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        {tmpl.chain.map((c, i) => {
          const isEnd = c.role === 'end-user';
          const isYou = i === 0;
          return (
            <span key={`${tmpl.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                padding: '2px 6px', borderRadius: 4,
                background: isEnd ? CORAL_LITE : isYou ? TEAL_LITE : HAIR,
                color: isEnd ? CORAL : isYou ? TEAL : SLATE_FG,
                fontFamily: FONT_MONO, fontSize: 9.5,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontWeight: 600,
              }}>{c.label}</span>
              {i < tmpl.chain.length - 1 && (
                <span style={{ color: MUTED, fontSize: 10 }}>→</span>
              )}
            </span>
          );
        })}
      </div>
    </button>
  );
}
