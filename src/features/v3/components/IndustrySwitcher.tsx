// Industry switcher — small select with a diff preview before applying.
// Shows the names of layers that would change between variants.

import { useState } from 'react';
import {
  diffIndustries, INDUSTRIES, industryLabel,
} from '../lib/industryVariants';
import type { Industry } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';

export function IndustrySwitcher({
  current, onChange,
}: {
  current: Industry;
  onChange: (next: Industry) => void;
}) {
  const [pendingTarget, setPendingTarget] = useState<Industry | null>(null);

  const target = pendingTarget ?? current;
  const diff = pendingTarget ? diffIndustries(current, pendingTarget) : [];
  const changedRows = diff.filter((d) => d.changed);

  return (
    <>
      <select
        value={target}
        onChange={(e) => {
          const next = e.target.value as Industry;
          if (next === current) { setPendingTarget(null); return; }
          setPendingTarget(next);
        }}
        style={{
          padding: '5px 8px', border: '1px solid #d6cfb8', borderRadius: 6,
          background: '#fff', fontSize: 12, fontFamily: 'inherit',
        }}
      >
        {INDUSTRIES.map((i) => (
          <option key={i} value={i}>{industryLabel(i)}</option>
        ))}
      </select>

      {pendingTarget && (
        <div
          onClick={() => setPendingTarget(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(11,18,32,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 540, maxWidth: '92vw', maxHeight: '80vh',
              background: '#fff', borderRadius: 12, padding: '20px 22px',
              display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: '0 12px 60px rgba(11,18,32,0.25)', overflow: 'auto',
            }}
          >
            <div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600,
              }}>Switch industry variant</div>
              <div style={{
                fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 24,
                color: '#0b1220', letterSpacing: '-0.01em', marginTop: 4,
              }}>{industryLabel(current)} → {industryLabel(pendingTarget)}</div>
            </div>

            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
              These {changedRows.length} layer{changedRows.length === 1 ? '' : 's'} will be renamed
              and their core questions reworded. Your existing claim_text and source for each
              layer is preserved — only the labels change.
            </div>

            {changedRows.length === 0 ? (
              <div style={{
                padding: '14px 16px', background: '#f1f5f9', borderRadius: 8,
                fontSize: 13, color: '#64748b',
              }}>No layer renames between these variants.</div>
            ) : (
              <div style={{
                display: 'grid', gap: 4, fontSize: 13,
                maxHeight: '40vh', overflow: 'auto',
              }}>
                {changedRows.map((d) => (
                  <div
                    key={d.layerId}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 24px 1fr',
                      gap: 8, alignItems: 'center',
                      padding: '6px 10px', background: '#f4f1ea', borderRadius: 4,
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>{d.fromName}</span>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 11, color: '#94a3b8',
                      textAlign: 'center',
                    }}>→</span>
                    <span style={{ color: '#0b1220', fontWeight: 600 }}>{d.toName}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { onChange(pendingTarget); setPendingTarget(null); }}
                style={{
                  padding: '9px 16px', background: '#0b1220', color: '#fff',
                  border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Apply switch</button>
              <button
                type="button"
                onClick={() => setPendingTarget(null)}
                style={{
                  padding: '9px 14px', background: 'transparent', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12.5,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
