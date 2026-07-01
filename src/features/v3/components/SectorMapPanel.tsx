// SectorMapPanel — L03 (Sector Mapping) custom view.
//
// Replaces the generic claim/source form with the real Visual Sector Map
// wizard (scope → actors → connections → annotations → insights), restyled
// to match v3's ink-on-paper look. Reuses the existing wizard step
// components and persistence (project_visual_sector_map) unchanged — this
// is a differently-styled shell around the same data/context, not a fork.

import { useEffect, useRef, useState } from 'react';
import { VisualSectorMapProvider, useVisualSectorMap } from '../../../contexts/VisualSectorMapContext';
import { useVisualSectorMapData } from '../../../hooks/useVisualSectorMapData';
import { ScopeDefinition } from '../../../components/visual-sector-map/ScopeDefinition';
import { ActorManagement } from '../../../components/visual-sector-map/ActorManagement';
import { ConnectionManagement } from '../../../components/visual-sector-map/ConnectionManagement';
import { AnnotationManagement } from '../../../components/visual-sector-map/AnnotationManagement';
import { InsightsSummary } from '../../../components/visual-sector-map/InsightsSummary';
import type { PkLayer, SourceId } from '../lib/layers';
import {
  FONT_MONO, HAIR, INK, MUTED, PAPER, STONE, TAN, TEAL, TEAL_LITE,
} from '../lib/tokens';

type Step = 'scope' | 'actors' | 'connections' | 'annotations' | 'insights';

const STEPS: { id: Step; label: string; number: number }[] = [
  { id: 'scope', label: 'Scope', number: 1 },
  { id: 'actors', label: 'Actors', number: 2 },
  { id: 'connections', label: 'Connections', number: 3 },
  { id: 'annotations', label: 'Annotate', number: 4 },
  { id: 'insights', label: 'Insights', number: 5 },
];

interface SectorMapPanelProps {
  projectId: string;
  layer: PkLayer;
  saveLayer: (layerId: string, patch: { claim_text?: string | null; source_value?: SourceId | null }) => Promise<void>;
}

function summarize(actorCount: number, connectionCount: number): string | null {
  if (actorCount === 0) return null;
  const actorWord = actorCount === 1 ? 'actor' : 'actors';
  if (connectionCount === 0) return `${actorCount} ${actorWord} mapped.`;
  const connWord = connectionCount === 1 ? 'connection' : 'connections';
  return `${actorCount} ${actorWord} mapped across ${connectionCount} ${connWord}.`;
}

// Inner — lives inside the provider, loads/saves persistence and wires the
// claim-summary sync back to the layer stack.
function SectorMapPanelContent({ projectId, layer, saveLayer }: SectorMapPanelProps) {
  const { loading, error } = useVisualSectorMapData(projectId);
  const { actors, connections } = useVisualSectorMap();
  const [step, setStep] = useState<Step>('scope');
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const summaryRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the layer's claim_text in sync with a short auto-derived summary so
  // dashboard progress / filledCount keep working without a dedicated field.
  useEffect(() => {
    if (loading) return;
    const summary = summarize(actors.length, connections.length);
    if (summary === summaryRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      summaryRef.current = summary;
      void saveLayer(layer.id, { claim_text: summary });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loading, actors.length, connections.length, layer.id, saveLayer]);

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>
        Loading sector map…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 20, fontSize: 13, color: '#be123c' }}>
        Error loading sector map: {error}
      </div>
    );
  }

  const goto = (next: Step) => setStep(next);

  const renderStep = () => {
    switch (step) {
      case 'scope':
        return <ScopeDefinition onContinue={() => goto('actors')} />;
      case 'actors':
        return <ActorManagement onContinue={() => goto('connections')} onBack={() => goto('scope')} />;
      case 'connections':
        return <ConnectionManagement onContinue={() => goto('annotations')} onBack={() => goto('actors')} />;
      case 'annotations':
        return <AnnotationManagement onContinue={() => goto('insights')} onBack={() => goto('connections')} />;
      case 'insights':
        return <InsightsSummary onBack={() => goto('annotations')} />;
      default:
        return null;
    }
  };

  return (
    <section style={{
      background: '#fff', border: `1px solid ${TAN}`, borderRadius: 10,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Step indicator — v3-styled, mirrors TierLadder's step/tier language */}
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${HAIR}`,
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
      }}>
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isDone = i < stepIndex;
          const isAccessible = i <= stepIndex;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => isAccessible && goto(s.id)}
                disabled={!isAccessible}
                aria-current={isActive ? 'step' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 6,
                  border: `1px solid ${isActive ? TEAL : 'transparent'}`,
                  background: isActive ? TEAL_LITE : 'transparent',
                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                  fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.04em',
                  color: isActive ? TEAL : isDone ? INK : MUTED,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  background: isDone ? TEAL : isActive ? TEAL : STONE,
                  color: isDone || isActive ? '#fff' : INK,
                }}>{isDone ? '✓' : s.number}</span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <span style={{ width: 16, height: 1, background: isDone ? TEAL : HAIR }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content — reused wizard components */}
      <div style={{ background: PAPER, minHeight: 480 }}>
        {renderStep()}
      </div>
    </section>
  );
}

// Outer — provides the visual-sector-map context, mirroring VisualSectorMapTool.
export function SectorMapPanel(props: SectorMapPanelProps) {
  return (
    <VisualSectorMapProvider>
      <SectorMapPanelContent {...props} />
    </VisualSectorMapProvider>
  );
}
