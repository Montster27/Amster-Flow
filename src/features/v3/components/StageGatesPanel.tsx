// StageGatesPanel — shared CPF/PSF/BMV panel reused by Door B, the dashboard,
// and the layer-detail view (Sprint 2 T5 + T7).
//
// The panel itself is unstyled chrome — callers wrap it in their own aside
// or card. That lets Door B keep its sticky right-rail aside, the dashboard
// embed it inside a content section, and the layer-detail view drop it into
// a side column.

import { GateMeter, GateMeterSummary } from './atoms';
import type { GateProgress, StageId } from '../lib/gates';
import { FONT_MONO, INK, MUTED } from '../lib/tokens';

interface Props {
  gates: GateProgress[];
  stage: StageId | null;
  /** When provided, contributing-layer rows inside each GateMeter become
   *  buttons that call this with the layer id. */
  onLayerClick?: (layerId: string) => void;
  /** When set, hide gates whose `reqs` don't include this layer. Used by
   *  the layer-detail view to narrow the panel to "gates this layer
   *  contributes to". */
  restrictToLayer?: string;
  /** When true, render passed gates as a one-line summary so attention
   *  collapses onto the next un-cleared gate. Default false. */
  collapseCleared?: boolean;
  /** Show the "Current stage / Pre-CPF" footer line. Default true. Layer
   *  detail passes false because the per-layer slice doesn't need a
   *  whole-stack stage label. */
  showStageLabel?: boolean;
  /** Optional title override. Default "Stage gates". */
  title?: string;
}

export function StageGatesPanel({
  gates, stage, onLayerClick, restrictToLayer, collapseCleared = false,
  showStageLabel = true, title = 'Stage gates',
}: Props) {
  const shown = restrictToLayer
    ? gates.filter((g) => g.reqs.some((r) => r.layerId === restrictToLayer))
    : gates;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: INK, fontWeight: 700,
      }}>{title}</div>
      {shown.length === 0 ? (
        <div style={{
          fontSize: 12, color: MUTED, fontStyle: 'italic', lineHeight: 1.45,
        }}>
          {restrictToLayer === 'sectorMapping'
            ? "This layer doesn't gate a stage directly — it shapes how coherent your story looks to an investor. How you'll know: a logical placement earns 1 tier, a named contact earns more."
            : "This layer doesn't contribute to a stage gate directly — it shapes how you tell the story."}
        </div>
      ) : (
        shown.map((g) => (collapseCleared && g.passed)
          ? <GateMeterSummary key={g.id} gate={g} />
          : <GateMeter key={g.id} gate={g} onLayerClick={onLayerClick} />)
      )}
      {showStageLabel && (
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: MUTED,
          letterSpacing: '0.08em',
        }}>
          {stage ? `Current stage: ${stage.toUpperCase()}` : 'Pre-CPF · keep filling'}
        </div>
      )}
    </div>
  );
}
