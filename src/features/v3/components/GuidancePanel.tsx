// GuidancePanel — the optional, collapsed-by-default right column of the
// Questions Up & Down workspace. Holds role guidance, connected layers, an
// assumptions summary, and the gates this layer contributes to. Nothing here is
// part of the default two-column view; the page reveals it on demand.

import { PerspectiveControl } from './PerspectiveControl';
import { StageGatesPanel } from './StageGatesPanel';
import { relationsFor } from '../lib/relationships';
import { perspectiveGuidance, perspectiveIsActive, PERSPECTIVE_BY_ID, type Perspective } from '../lib/perspectives';
import { PK_LAYER_BY_ID, type PkLayer } from '../lib/layers';
import type { GateProgress, StageId } from '../lib/gates';
import { FONT_MONO, INK, SLATE_FG, TAN, TEAL } from '../lib/tokens';

interface Props {
  layer: PkLayer;
  perspective: Perspective;
  onPerspectiveChange: (p: Perspective) => void;
  gates: GateProgress[];
  stage: StageId | null;
  onNavigate: (layerId: string) => void;
  assumptionCount: number;
  onOpenAssumptions: () => void;
}

const kicker = {
  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: INK, fontWeight: 700,
} as const;

export function GuidancePanel({
  layer, perspective, onPerspectiveChange, gates, stage,
  onNavigate, assumptionCount, onOpenAssumptions,
}: Props) {
  const rel = relationsFor(layer.id);
  const connected = Array.from(new Set([
    ...(rel.up ? [rel.up.layer] : []),
    ...(rel.down ? [rel.down.layer] : []),
    ...(rel.related ?? []),
  ])).map((id) => PK_LAYER_BY_ID[id]).filter(Boolean) as PkLayer[];
  const guidance = perspectiveGuidance(perspective, layer.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PerspectiveControl value={perspective} onChange={onPerspectiveChange} />

      {perspectiveIsActive(perspective) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={kicker}>Why this matters — {PERSPECTIVE_BY_ID[perspective]?.label}</div>
          <p style={{ margin: 0, fontSize: 12.5, color: SLATE_FG, lineHeight: 1.5 }}>
            {guidance ?? `${layer.name} isn’t a focus layer for this perspective, but it still contributes to the whole stack.`}
          </p>
        </div>
      )}

      {connected.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={kicker}>Connected layers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rel.up && <RelationRow dir="up" prompt={rel.up.prompt} onClick={() => onNavigate(rel.up!.layer)} />}
            {rel.down && <RelationRow dir="down" prompt={rel.down.prompt} onClick={() => onNavigate(rel.down!.layer)} />}
          </div>
          {(rel.related ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(rel.related ?? []).map((id) => PK_LAYER_BY_ID[id]).filter(Boolean).map((L) => (
                <button
                  key={L!.id}
                  type="button"
                  onClick={() => onNavigate(L!.id)}
                  style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: 11.5,
                    border: `1px solid ${TAN}`, background: '#fff', color: SLATE_FG,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{L!.name} →</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={kicker}>Assumptions</div>
        <button
          type="button"
          onClick={onOpenAssumptions}
          style={{
            alignSelf: 'flex-start', padding: '5px 11px', borderRadius: 6,
            fontSize: 12, border: `1px solid ${TAN}`, background: '#fff',
            color: SLATE_FG, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >{assumptionCount} on the stack — open Assumptions →</button>
      </div>

      <StageGatesPanel
        gates={gates}
        stage={stage}
        onLayerClick={onNavigate}
        restrictToLayer={layer.id}
        showStageLabel={false}
        title="Contributing to"
      />
    </div>
  );
}

function RelationRow({ dir, prompt, onClick }: { dir: 'up' | 'down'; prompt: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', gap: 8, alignItems: 'flex-start', textAlign: 'left',
        padding: '8px 10px', borderRadius: 8, border: `1px solid ${TAN}`,
        background: '#fff', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
      }}
    >
      <span aria-hidden style={{ color: TEAL, fontWeight: 700, fontFamily: FONT_MONO, fontSize: 13 }}>
        {dir === 'up' ? '↑' : '↓'}
      </span>
      <span style={{ flex: 1, fontSize: 12.5, color: SLATE_FG, lineHeight: 1.4 }}>{prompt}</span>
    </button>
  );
}
