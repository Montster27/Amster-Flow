// Active-prompts panel — sits at the top of the dashboard.
// Surfaces gap/assumption/stagnation prompts from lib/prompts.ts.

import type { ActivePrompt, PromptIntensity } from '../lib/prompts';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

const TONES: Record<PromptIntensity, { bg: string; border: string; rule: string; fg: string; kicker: string }> = {
  sharp:  { bg: '#fef2f2', border: '#fda4af', rule: '#9f1239', fg: '#0b1220', kicker: '#9f1239' },
  firm:   { bg: '#fff8eb', border: '#fde68a', rule: '#b45309', fg: '#0b1220', kicker: '#92400e' },
  subtle: { bg: '#f0f9ff', border: '#bae6fd', rule: '#0369a1', fg: '#0b1220', kicker: '#0369a1' },
};

export function PromptsPanel({
  prompts, onOpenLayer,
}: {
  prompts: ActivePrompt[];
  onOpenLayer?: (layerId: string) => void;
}) {
  if (prompts.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {prompts.slice(0, 4).map((p) => {
        const t = TONES[p.intensity];
        return (
          <div
            key={p.id}
            style={{
              padding: '12px 16px', borderRadius: 10,
              background: t.bg, border: `1px solid ${t.border}`,
              borderLeft: `3px solid ${t.rule}`,
              display: 'grid', gridTemplateColumns: 'auto 1fr auto',
              gap: 14, alignItems: 'center',
            }}
          >
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9.5, color: t.kicker,
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
              padding: '2px 7px', background: '#fff', borderRadius: 3,
              border: `1px solid ${t.border}`,
            }}>{p.intensity} · {p.kind}</span>
            <div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 16, color: t.fg,
                lineHeight: 1.3, letterSpacing: '-0.005em',
              }}>{p.headline}</div>
              <div style={{
                fontSize: 12.5, color: '#475569', marginTop: 2, lineHeight: 1.45,
              }}>{p.body}</div>
            </div>
            {p.layerId && onOpenLayer && (
              <button
                type="button"
                onClick={() => onOpenLayer(p.layerId!)}
                style={{
                  padding: '7px 12px', background: '#0b1220', color: '#fff',
                  border: 'none', borderRadius: 6, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Open layer →</button>
            )}
          </div>
        );
      })}
      {prompts.length > 4 && (
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: '#94a3b8',
          letterSpacing: '0.06em',
        }}>+ {prompts.length - 4} more prompt{prompts.length - 4 === 1 ? '' : 's'}</div>
      )}
    </div>
  );
}
