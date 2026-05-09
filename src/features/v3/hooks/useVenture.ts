// React hooks for venture + layer stack lifecycles.
// Owns fetching, mutating, and live recomputation of derived values.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ensureVenture,
  fetchLayerStack,
  fetchVenture,
  updateVenture as svcUpdateVenture,
  upsertLayerState as svcUpsertLayerState,
  type VentureRow,
} from '../lib/storage';
import {
  filledCount, indexStack, PK_LAYERS,
  type LayerStateRow, type SourceId,
} from '../lib/layers';
import { allGates, currentStage, type GateProgress, type StageId } from '../lib/gates';

interface UseVentureResult {
  venture: VentureRow | null;
  loading: boolean;
  error: string | null;
  /** Update venture metadata (industry, evaluator, door choice, etc). */
  updateVenture: (patch: Partial<VentureRow>) => Promise<void>;
  /** Force a refetch (e.g. after creation). */
  refetch: () => Promise<void>;
}

/** Hook for the per-project venture row. Auto-creates if missing. */
export function useVenture(projectId: string | null | undefined): UseVentureResult {
  const [venture, setVenture] = useState<VentureRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    try {
      const v = await ensureVenture(projectId);
      setVenture(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) { setLoading(false); return; }
    setLoading(true); setError(null);
    ensureVenture(projectId)
      .then((v) => { if (!cancelled) setVenture(v); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const updateVenture = useCallback(async (patch: Partial<VentureRow>) => {
    if (!projectId) return;
    // Optimistic
    setVenture((prev) => prev ? { ...prev, ...patch } : prev);
    try {
      const next = await svcUpdateVenture(projectId, patch);
      setVenture(next);
    } catch (e) {
      // Revert on error by refetching
      const v = await fetchVenture(projectId);
      setVenture(v);
      throw e;
    }
  }, [projectId]);

  return { venture, loading, error, updateVenture, refetch };
}

interface LayerStackDerived {
  stack: Record<string, LayerStateRow | undefined>;
  rows: LayerStateRow[];
  filled: number;
  totalLayers: number;
  gates: GateProgress[];
  stage: StageId | null;
  /** stageBefore is the prior `stage` snapshot — useful to surface
   *  downgrade events after an edit. */
  stageBefore: StageId | null;
}

interface UseLayerStackResult extends LayerStackDerived {
  loading: boolean;
  error: string | null;
  saveLayer: (layerId: string, patch: { claim_text?: string | null; source_value?: SourceId | null }) => Promise<void>;
  refetch: () => Promise<void>;
}

/** Hook for the project's full 16-layer stack with derived gates. */
export function useLayerStack(projectId: string | null | undefined): UseLayerStackResult {
  const [rows, setRows] = useState<LayerStateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageBefore, setStageBefore] = useState<StageId | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    try {
      const next = await fetchLayerStack(projectId);
      setRows(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) { setLoading(false); setRows([]); return; }
    setLoading(true); setError(null);
    fetchLayerStack(projectId)
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const derived: LayerStackDerived = useMemo(() => {
    const stack = indexStack(rows);
    const gates = allGates(stack);
    const stage = currentStage(stack);
    return {
      stack,
      rows,
      filled: filledCount(rows),
      totalLayers: PK_LAYERS.length,
      gates,
      stage,
      stageBefore,
    };
  }, [rows, stageBefore]);

  const saveLayer = useCallback(async (
    layerId: string,
    patch: { claim_text?: string | null; source_value?: SourceId | null },
  ) => {
    if (!projectId) return;
    // Snapshot stage before applying so the UI can detect downgrades
    setStageBefore(currentStage(indexStack(rows)));
    // Optimistic update
    const optimistic: LayerStateRow = {
      ...(rows.find((r) => r.layer_id === layerId) ?? { layer_id: layerId }),
      ...patch,
      project_id: projectId,
      last_updated_at: new Date().toISOString(),
    };
    setRows((prev) => {
      const filtered = prev.filter((r) => r.layer_id !== layerId);
      return [...filtered, optimistic];
    });
    try {
      const saved = await svcUpsertLayerState({
        projectId, layerId,
        claim_text: patch.claim_text,
        source_value: patch.source_value,
      });
      setRows((prev) => {
        const filtered = prev.filter((r) => r.layer_id !== layerId);
        return [...filtered, saved];
      });
    } catch (e) {
      await refetch();
      throw e;
    }
  }, [projectId, rows, refetch]);

  return { ...derived, loading, error, saveLayer, refetch };
}
