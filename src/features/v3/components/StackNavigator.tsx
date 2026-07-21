// StackNavigator — the persistent 16-layer map for the Questions Up & Down
// workspace. Low-density by design: each row shows only the layer name, its
// completion state, its evidence strength, and one contextual slot (a risk
// flag, or a perspective marker once a perspective is chosen). Everything else
// lives in the selected-layer workspace.
//
// Structure is a semantic navigation list of buttons grouped strategy →
// critical → execution. The canonical order never changes; filters dim rows
// (never reorder or permanently hide) and "Show all" always restores the full
// stack. Keyboard: roving tab stop with Arrow/Home/End to move focus,
// Enter/Space (native button) to select.

import { useMemo, useRef, useState } from 'react';
import { pkHidesSource, rowTier, type LayerStateRow } from '../lib/layers';
import {
  STACK_GROUPS, COMPLETION_LABEL, layerCompletionState, evidenceStrengthLabel,
  layerWarnings, layerMatchesFilters, STACK_FILTERS,
  type StackFilterId, type FilterInput,
} from '../lib/stackNav';
import {
  perspectiveHighlights, perspectiveIsActive, PERSPECTIVE_BY_ID, type Perspective,
} from '../lib/perspectives';
import { TierLadder } from './atoms';
import {
  FONT_MONO, INK, MUTED, SLATE, SLATE_FG, STONE, TAN, TEAL, TEAL_LITE,
  AMBER_FG, AMBER_SOFT, AMBER_LINE, CREAM,
} from '../lib/tokens';

interface Props {
  stack: Record<string, LayerStateRow | undefined>;
  selectedLayerId: string;
  onSelect: (layerId: string) => void;
  perspective: Perspective;
  /** Layers in an active cross-layer contradiction (from useAssumptions). */
  heatLayerIds: ReadonlySet<string>;
  /** Layers that have promoted assumptions on the stack. */
  assumptionLayerIds: ReadonlySet<string>;
}

const FLAT_LAYERS = STACK_GROUPS.flatMap((g) => g.layers);

export function StackNavigator({
  stack, selectedLayerId, onSelect, perspective, heatLayerIds, assumptionLayerIds,
}: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<StackFilterId>>(() => new Set());
  const [showMore, setShowMore] = useState(false);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const perspActive = perspectiveIsActive(perspective);
  const perspLabel = PERSPECTIVE_BY_ID[perspective]?.label ?? '';

  const toggleFilter = (id: StackFilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearFilters = () => setActiveFilters(new Set());

  // Per-layer derived data (computed once per render for all 16).
  const derived = useMemo(() => {
    const out: Record<string, {
      state: ReturnType<typeof layerCompletionState>;
      tier: number;
      warnings: ReturnType<typeof layerWarnings>;
      isRelevant: boolean;
      matched: boolean;
    }> = {};
    for (const L of FLAT_LAYERS) {
      const row = stack[L.id];
      const state = layerCompletionState(L.id, row);
      const warnings = layerWarnings(L.id, row, heatLayerIds);
      const isRelevant = perspectiveHighlights(perspective, L.id);
      const fi: FilterInput = {
        state, warnings, isRelevant, hasAssumptions: assumptionLayerIds.has(L.id),
      };
      out[L.id] = {
        state, tier: rowTier(row), warnings, isRelevant,
        matched: layerMatchesFilters(activeFilters, fi),
      };
    }
    return out;
  }, [stack, heatLayerIds, assumptionLayerIds, perspective, activeFilters]);

  const focusByIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(FLAT_LAYERS.length - 1, idx));
    const id = FLAT_LAYERS[clamped].id;
    btnRefs.current[id]?.focus();
  };

  const onListKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); focusByIndex(index + 1); break;
      case 'ArrowUp':   e.preventDefault(); focusByIndex(index - 1); break;
      case 'Home':      e.preventDefault(); focusByIndex(0); break;
      case 'End':       e.preventDefault(); focusByIndex(FLAT_LAYERS.length - 1); break;
      default: break;
    }
  };

  const selectedIndex = Math.max(0, FLAT_LAYERS.findIndex((L) => L.id === selectedLayerId));
  const anyFilters = activeFilters.size > 0;

  const visibleFilters = STACK_FILTERS.filter((f) => (showMore || !f.advanced)
    && (!f.needsPerspective || perspActive));

  return (
    <nav aria-label="16-layer stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: MUTED, fontWeight: 700,
        }}>Filter</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Stack filters">
          {visibleFilters.map((f) => {
            const on = activeFilters.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFilter(f.id)}
                style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 11,
                  fontFamily: 'inherit', cursor: 'pointer',
                  border: `1px solid ${on ? INK : TAN}`,
                  background: on ? INK : '#fff',
                  color: on ? '#fff' : SLATE_FG, fontWeight: on ? 600 : 500,
                }}
              >{f.label}</button>
            );
          })}
          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => setShowMore((s) => !s)}
            style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 11,
              fontFamily: 'inherit', cursor: 'pointer',
              border: `1px dashed ${STONE}`, background: 'transparent', color: SLATE,
            }}
          >{showMore ? 'Fewer filters' : 'More filters'}</button>
        </div>
        {anyFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              alignSelf: 'flex-start', padding: '3px 8px', fontSize: 11,
              fontFamily: FONT_MONO, letterSpacing: '0.06em',
              color: TEAL, background: 'transparent', border: 'none',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >Show all layers</button>
        )}
      </div>

      {/* Grouped layer list */}
      {STACK_GROUPS.map((group) => (
        <div key={group.band} role="group" aria-labelledby={`stackgroup-${group.band}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            id={`stackgroup-${group.band}`}
            style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: SLATE, fontWeight: 700,
              marginTop: 4, marginBottom: 2,
            }}
          >{group.label}</div>

          {group.layers.map((L) => {
            const d = derived[L.id];
            const selected = L.id === selectedLayerId;
            const index = FLAT_LAYERS.findIndex((x) => x.id === L.id);
            const hidesSource = pkHidesSource(L.id);
            const dimmed = anyFilters && !d.matched;
            const showRoleMarker = perspActive && d.isRelevant;

            // Accessible name — never relies on colour.
            const nameParts = [
              L.name,
              `L${String(L.n).padStart(2, '0')}`,
              COMPLETION_LABEL[d.state],
            ];
            if (!hidesSource) nameParts.push(`Evidence ${evidenceStrengthLabel(d.tier)}`);
            if (d.warnings.heat) nameParts.push('Has a risk flag');
            if (showRoleMarker) nameParts.push(`In focus for ${perspLabel}`);

            return (
              <button
                key={L.id}
                type="button"
                ref={(el) => { btnRefs.current[L.id] = el; }}
                aria-current={selected ? 'true' : undefined}
                aria-label={nameParts.join('. ')}
                tabIndex={selected || (selectedIndex < 0 && index === 0) ? 0 : -1}
                onClick={() => onSelect(L.id)}
                onKeyDown={(e) => onListKeyDown(e, index)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  textAlign: 'left', width: '100%', cursor: 'pointer',
                  padding: '8px 10px', borderRadius: 8,
                  border: `1px solid ${selected ? TEAL : 'transparent'}`,
                  borderLeft: `3px solid ${selected ? TEAL : 'transparent'}`,
                  background: selected ? TEAL_LITE : 'transparent',
                  opacity: dimmed ? 0.4 : 1,
                  fontFamily: 'inherit',
                  transition: 'background .12s, opacity .12s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{
                    flex: 1, fontSize: 13.5, color: INK,
                    fontWeight: selected ? 700 : 500, letterSpacing: '-0.005em',
                  }}>{L.name}</span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9.5, color: MUTED,
                    letterSpacing: '0.06em', fontWeight: 600,
                  }}>L{String(L.n).padStart(2, '0')}</span>
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StateTag state={d.state} />
                  {!hidesSource && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <TierLadder tier={d.tier} tone={L.cat} size="sm" />
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9.5, color: SLATE,
                        letterSpacing: '0.04em',
                      }}>{evidenceStrengthLabel(d.tier)}</span>
                    </span>
                  )}
                  <span style={{ flex: 1 }} />
                  {/* One contextual slot: risk first, else perspective marker. */}
                  {d.warnings.heat ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '1px 6px', borderRadius: 4,
                      background: AMBER_SOFT, border: `1px solid ${AMBER_LINE}`,
                      color: AMBER_FG, fontFamily: FONT_MONO, fontSize: 9,
                      letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                    }}>
                      <span aria-hidden>⚑</span> Risk
                    </span>
                  ) : showRoleMarker ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '1px 6px', borderRadius: 4,
                      background: CREAM, border: `1px solid ${TAN}`,
                      color: SLATE_FG, fontFamily: FONT_MONO, fontSize: 9,
                      letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
                    }}>
                      <span aria-hidden>◆</span> In focus
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function StateTag({ state }: { state: ReturnType<typeof layerCompletionState> }) {
  const map = {
    empty:     { bg: 'transparent', border: STONE, fg: MUTED, dot: '○' },
    draft:     { bg: AMBER_SOFT, border: AMBER_LINE, fg: AMBER_FG, dot: '◐' },
    supported: { bg: TEAL_LITE, border: TEAL, fg: TEAL, dot: '●' },
  } as const;
  const m = map[state];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '1px 7px', borderRadius: 4,
      background: m.bg, border: `1px solid ${m.border}`, color: m.fg,
      fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.08em',
      textTransform: 'uppercase', fontWeight: 700,
    }}>
      <span aria-hidden>{m.dot}</span> {COMPLETION_LABEL[state]}
    </span>
  );
}
