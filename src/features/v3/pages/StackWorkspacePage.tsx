// StackWorkspacePage — "Questions Up & Down".
//
// Replaces the old Door B "snapshot dump". Keeps the full 16-layer stack visible
// as a persistent navigator while focusing editing on one layer at a time. All
// persistence, scoring, gates, autosave, pushback, and assumptions are reused
// unchanged (useVenture / useLayerStack / useAssumptions); this page is layout,
// selection, and role-lens emphasis only.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVenture, useLayerStack } from '../hooks/useVenture';
import { useAssumptions } from '../hooks/useAssumptions';
import { StackNavigator } from '../components/StackNavigator';
import { LayerWorkspace } from '../components/LayerWorkspace';
import { GuidancePanel } from '../components/GuidancePanel';
import { PerspectiveControl } from '../components/PerspectiveControl';
import { PageShell, VentureHeader } from '../components/atoms';
import { STACK_GROUPS } from '../lib/stackNav';
import { PK_LAYER_BY_ID, FOUNDATION_QUEUE, rowTier } from '../lib/layers';
import type { Perspective } from '../lib/perspectives';
import {
  FONT_MONO, INK, MUTED, SLATE, SLATE_FG, TAN, CREAM, ERROR_FG,
} from '../lib/tokens';
import './stackWorkspace.css';

const FLAT_LAYERS = STACK_GROUPS.flatMap((g) => g.layers);
const DEFAULT_LAYER = 'customerSegment';

// ── tiny per-project localStorage helpers (value persistence) ──
function lsGet(key: string): string | null {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; }
  catch { return null; }
}
function lsSet(key: string, val: string) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, val); } catch { /* ignore */ }
}

const VALID_PERSPECTIVES = new Set<Perspective>(['all', 'investor', 'designer', 'product-delivery']);

export default function StackWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const {
    rows, stack, loading, error, gates, stage, stageBefore, filled, totalLayers, saveLayer,
  } = useLayerStack(projectId);
  const { rows: assumptionRows, candidates, promote, dismissCandidate } = useAssumptions(projectId, rows);

  const layerKey = `pk.v3.qud.layer.${projectId}`;
  const perspKey = `pk.v3.qud.perspective.${projectId}`;

  const [selectedLayerId, setSelectedLayerId] = useState<string>(() => {
    const stored = lsGet(layerKey);
    return stored && PK_LAYER_BY_ID[stored] ? stored : DEFAULT_LAYER;
  });
  const [perspective, setPerspective] = useState<Perspective>(() => {
    const stored = lsGet(perspKey) as Perspective | null;
    return stored && VALID_PERSPECTIVES.has(stored) ? stored : 'all';
  });
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const didMountFocus = useRef(false);

  // Persist selection + perspective per project.
  useEffect(() => { lsSet(layerKey, selectedLayerId); }, [layerKey, selectedLayerId]);
  useEffect(() => { lsSet(perspKey, perspective); }, [perspKey, perspective]);

  // Move focus to the layer heading only for workspace-driven navigation
  // (prev/next, relationship prompts) — not for navigator clicks, which keep
  // the user's place in the list.
  useEffect(() => {
    if (!didMountFocus.current) { didMountFocus.current = true; return; }
    if (pendingFocus.current) {
      pendingFocus.current = false;
      mainRef.current?.querySelector<HTMLHeadingElement>('h2')?.focus();
    }
  }, [selectedLayerId]);

  const selectFromNav = useCallback((id: string) => {
    setSelectedLayerId(id);
    setDrawerOpen(false);
  }, []);

  const navigateToLayer = useCallback((id: string) => {
    pendingFocus.current = true;
    setSelectedLayerId(id);
    setDrawerOpen(false);
  }, []);

  // Mark door choice on first edit if unset (parity with old Door B). Never
  // overwrites an existing choice (a Door A founder keeps door_choice='A').
  const doorChoiceWriteRef = useRef(false);
  useEffect(() => {
    if (
      !doorChoiceWriteRef.current
      && venture && !venture.door_choice
      && rows.some((r) => r.claim_text || r.source_value)
    ) {
      doorChoiceWriteRef.current = true;
      void updateVenture({ door_choice: 'B' }).catch(() => { doorChoiceWriteRef.current = false; });
    }
  }, [venture, rows, updateVenture]);

  // Cross-layer contradictions → heat flags (from existing product logic).
  const heatLayerIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of candidates.crossLayer) {
      s.add(c.source_layer_id);
      if (c.cross_source_layer_id) s.add(c.cross_source_layer_id);
    }
    return s;
  }, [candidates.crossLayer]);

  const assumptionLayerIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of assumptionRows) {
      if (r.state === 'dismissed') continue;
      if (r.source_layer_id) s.add(r.source_layer_id);
      if (r.cross_source_layer_id) s.add(r.cross_source_layer_id);
    }
    return s;
  }, [assumptionRows]);

  const foundationIncomplete = useMemo(
    () => FOUNDATION_QUEUE.some((id) => rowTier(stack[id]) < 2),
    [stack],
  );

  const heatTargetLayer = useMemo(() => {
    for (const c of candidates.crossLayer) {
      if (c.source_layer_id === selectedLayerId) return c.cross_source_layer_id;
      if (c.cross_source_layer_id === selectedLayerId) return c.source_layer_id;
    }
    return undefined;
  }, [candidates.crossLayer, selectedLayerId]);

  const onContinueGuided = useCallback(() => {
    const step = lsGet(`pk.v3.lastStep.${projectId}`);
    navigate(`/v3/door-a/${projectId}${step ? `#${step}` : ''}`);
  }, [navigate, projectId]);

  if (!projectId) {
    return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  }
  if (loading || vLoading) {
    return <PageShell><div style={{ padding: 40 }}>Loading your 16-layer stack…</div></PageShell>;
  }
  if (error) {
    return <PageShell><div role="alert" style={{ padding: 40, color: ERROR_FG }}>Failed to load: {error}</div></PageShell>;
  }

  const layer = PK_LAYER_BY_ID[selectedLayerId] ?? PK_LAYER_BY_ID[DEFAULT_LAYER];
  const flatIndex = FLAT_LAYERS.findIndex((L) => L.id === layer.id);
  const prevLayerId = flatIndex > 0 ? FLAT_LAYERS[flatIndex - 1].id : undefined;
  const nextLayerId = flatIndex < FLAT_LAYERS.length - 1 ? FLAT_LAYERS[flatIndex + 1].id : undefined;
  const cameFromDoorA = venture?.door_choice === 'A';

  const downgraded = stageBefore && (
    stage === null
    || (stageBefore === 'bmv' && stage !== 'bmv')
    || (stageBefore === 'psf' && stage !== 'psf' && stage !== 'bmv')
    || (stageBefore === 'cpf' && stage === null)
  );

  return (
    <PageShell>
      <VentureHeader
        ventureName="Questions Up & Down"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: SLATE, letterSpacing: '0.08em',
            }}>{filled}/{totalLayers} FILLED</span>
            {cameFromDoorA ? (
              <button
                type="button"
                onClick={onContinueGuided}
                style={primaryBtn}
              >Continue guided flow</button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/v3/dashboard/${projectId}`)}
                style={primaryBtn}
              >Dashboard →</button>
            )}
            <button
              type="button"
              aria-pressed={guidanceOpen}
              onClick={() => setGuidanceOpen((g) => !g)}
              style={ghostBtn}
            >{guidanceOpen ? 'Hide guidance' : 'Guidance'}</button>
          </div>
        }
      />

      {/* Sub-bar: subtitle, helper, you-are-here, perspective, autosave */}
      <div style={{
        padding: '12px 28px', borderBottom: '1px solid #ece6d6', background: CREAM,
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: SLATE, fontWeight: 700,
          }}>Explore your 16-layer stack</div>
          <div style={{ fontSize: 12.5, color: SLATE_FG, fontStyle: 'italic', marginTop: 2 }}>
            Move between connected layers as your understanding changes.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span aria-live="polite" style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em' }}>
            Changes save automatically
          </span>
          <button
            type="button"
            className="qud-mobile-only"
            onClick={() => setDrawerOpen(true)}
            style={{ ...ghostBtn, alignItems: 'center' }}
          >☰ Open full stack</button>
          <PerspectiveControl value={perspective} onChange={setPerspective} compact />
        </div>
      </div>

      {/* You-are-here */}
      <div style={{
        padding: '8px 28px', borderBottom: '1px solid #f1efe7', background: '#fff',
        fontFamily: FONT_MONO, fontSize: 10.5, color: SLATE, letterSpacing: '0.06em',
      }}>
        You are here: <span style={{ color: INK, fontWeight: 700 }}>L{String(layer.n).padStart(2, '0')} · {layer.name}</span>
      </div>

      {downgraded && (
        <div role="alert" style={{
          padding: '10px 28px', background: '#fff8eb', borderBottom: '1px solid #fde68a',
          color: '#92400e', fontSize: 13,
        }}>
          ⚠ Stage downgraded — {stageBefore?.toUpperCase()} requirements no longer met. That’s the right
          behavior; the alternative is locking you into a stage you don’t have evidence for.
        </div>
      )}

      <div className={`qud-layout${guidanceOpen ? ' qud-has-guidance' : ''}${drawerOpen ? ' qud-drawer-open' : ''}`}>
        <div
          className="qud-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
        <aside className="qud-nav-col" aria-label="Stack navigator">
          <StackNavigator
            stack={stack}
            selectedLayerId={selectedLayerId}
            onSelect={selectFromNav}
            perspective={perspective}
            heatLayerIds={heatLayerIds}
            assumptionLayerIds={assumptionLayerIds}
          />
        </aside>

        <main className="qud-main-col" ref={mainRef}>
          <LayerWorkspace
            key={layer.id}
            layer={layer}
            row={stack[layer.id]}
            projectId={projectId}
            evaluator={venture?.evaluator ?? 'investor'}
            perspective={perspective}
            saveLayer={saveLayer}
            onNavigate={navigateToLayer}
            prevLayerId={prevLayerId}
            nextLayerId={nextLayerId}
            hasHeat={heatLayerIds.has(layer.id)}
            heatTargetLayer={heatTargetLayer ?? undefined}
            cameFromDoorA={cameFromDoorA}
            foundationIncomplete={foundationIncomplete}
            onContinueGuided={onContinueGuided}
            candidates={candidates.spawned[layer.id] ?? []}
            onPromote={promote}
            onDismissCandidate={dismissCandidate}
          />
        </main>

        {guidanceOpen && (
          <aside className="qud-guidance-col" aria-label="Layer guidance">
            <GuidancePanel
              layer={layer}
              perspective={perspective}
              onPerspectiveChange={setPerspective}
              gates={gates}
              stage={stage}
              onNavigate={navigateToLayer}
              assumptionCount={assumptionRows.length}
              onOpenAssumptions={() => navigate(`/v3/assumptions/${projectId}`)}
            />
          </aside>
        )}
      </div>
    </PageShell>
  );
}

const primaryBtn = {
  padding: '8px 14px', background: INK, color: '#fff', border: 'none',
  borderRadius: 6, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
} as const;

const ghostBtn = {
  padding: '7px 12px', background: 'transparent', color: SLATE_FG,
  border: `1px solid ${TAN}`, borderRadius: 6, fontSize: 12,
  cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex',
} as const;
