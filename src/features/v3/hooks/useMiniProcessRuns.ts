// Mini-process run lifecycle: start, advance, complete, abandon.
// On completion, the linked layer's source_value is auto-upgraded.

import { useCallback, useEffect, useRef, useState } from 'react';
import { sb } from '../lib/pivotkitDb';
import {
  findMiniProcess, isMiniProcessDone, type MiniProcessDefinition,
} from '../lib/miniProcesses';
import { logAuditEvent, upsertLayerState } from '../lib/storage';
import type { SourceId } from '../lib/layers';

export interface MiniProcessRunRow {
  id: string;
  project_id: string;
  kind: string;
  layer_id: string;
  state: 'in_progress' | 'completed' | 'abandoned';
  progress: { completedSteps?: number[]; capturedN?: number; lastStep?: number };
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export async function fetchMiniProcessRuns(projectId: string): Promise<MiniProcessRunRow[]> {
  const { data, error } = await sb
    .from('pivotkit_mini_process_runs')
    .select('*')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MiniProcessRunRow[];
}

export async function startMiniProcessRun(
  projectId: string, def: MiniProcessDefinition,
): Promise<MiniProcessRunRow> {
  const { data, error } = await sb
    .from('pivotkit_mini_process_runs')
    .insert({
      project_id: projectId,
      kind: def.kind,
      layer_id: def.layerId,
      state: 'in_progress',
      progress: { completedSteps: [], capturedN: 0, lastStep: 0 },
    })
    .select('*')
    .single();
  if (error) throw error;
  void logAuditEvent({
    projectId, action: 'mini_process_started',
    payload: { run_id: data.id, kind: def.kind, layer_id: def.layerId },
  });
  return data as MiniProcessRunRow;
}

export async function patchMiniProcessRun(
  id: string,
  patch: Partial<Pick<MiniProcessRunRow, 'state' | 'progress' | 'notes'>>,
): Promise<MiniProcessRunRow> {
  const dbPatch: Partial<Pick<MiniProcessRunRow, 'state' | 'progress' | 'notes'>> & {
    completed_at?: string;
  } = { ...patch };
  if (patch.state === 'completed' || patch.state === 'abandoned') {
    dbPatch.completed_at = new Date().toISOString();
  }
  const { data, error } = await sb
    .from('pivotkit_mini_process_runs')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as MiniProcessRunRow;
}

interface UseMiniProcessRunsResult {
  runs: MiniProcessRunRow[];
  loading: boolean;
  error: string | null;
  start: (def: MiniProcessDefinition) => Promise<MiniProcessRunRow>;
  toggleStepDone: (runId: string, stepIdx: number) => Promise<void>;
  setCapturedN: (runId: string, n: number) => Promise<void>;
  setNotes: (runId: string, notes: string) => Promise<void>;
  complete: (runId: string) => Promise<void>;
  abandon: (runId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMiniProcessRuns(projectId: string | null | undefined): UseMiniProcessRunsResult {
  const [runs, setRuns] = useState<MiniProcessRunRow[]>([]);
  // Mirror of `runs` so async mutations read the latest committed list rather
  // than a stale render snapshot (which could silently no-op a complete/abandon).
  const runsRef = useRef<MiniProcessRunRow[]>(runs);
  runsRef.current = runs;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    try {
      setRuns(await fetchMiniProcessRuns(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) { setLoading(false); setRuns([]); return; }
    setLoading(true); setError(null);
    fetchMiniProcessRuns(projectId)
      .then((d) => { if (!cancelled) setRuns(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const start = useCallback(async (def: MiniProcessDefinition) => {
    if (!projectId) throw new Error('No projectId');
    const row = await startMiniProcessRun(projectId, def);
    setRuns((rs) => [row, ...rs]);
    return row;
  }, [projectId]);

  const updateRun = useCallback(async (
    runId: string,
    fn: (run: MiniProcessRunRow) => Partial<Pick<MiniProcessRunRow, 'state' | 'progress' | 'notes'>>,
  ) => {
    const run = runsRef.current.find((r) => r.id === runId);
    if (!run) return;
    const patch = fn(run);
    const next = await patchMiniProcessRun(runId, patch);
    setRuns((rs) => rs.map((r) => r.id === runId ? next : r));
  }, []);

  const toggleStepDone = useCallback(async (runId: string, stepIdx: number) => {
    await updateRun(runId, (run) => {
      const set = new Set(run.progress.completedSteps ?? []);
      if (set.has(stepIdx)) set.delete(stepIdx);
      else set.add(stepIdx);
      return { progress: { ...run.progress, completedSteps: [...set].sort() } };
    });
  }, [updateRun]);

  const setCapturedN = useCallback(async (runId: string, n: number) => {
    await updateRun(runId, (run) => ({ progress: { ...run.progress, capturedN: n } }));
  }, [updateRun]);

  const setNotes = useCallback(async (runId: string, notes: string) => {
    await updateRun(runId, () => ({ notes }));
  }, [updateRun]);

  const complete = useCallback(async (runId: string) => {
    if (!projectId) return;
    const run = runsRef.current.find((r) => r.id === runId);
    if (!run) return;
    const def = findMiniProcess(run.kind);
    if (!def) return;
    if (!isMiniProcessDone(def, run.progress)) {
      // Still mark complete on user request, but warn in audit
      void logAuditEvent({
        projectId, action: 'mini_process_completed_before_dod',
        payload: { run_id: runId, kind: run.kind },
      });
    }
    await updateRun(runId, () => ({ state: 'completed' }));

    // Upgrade the linked layer's source if the new tier beats what's there
    const upgrade = def.upgradeLayerSourceTo;
    try {
      await upsertLayerState({
        projectId, layerId: def.layerId, source_value: upgrade,
      });
      void logAuditEvent({
        projectId, action: 'mini_process_completed',
        payload: { run_id: runId, kind: run.kind, upgraded_layer: def.layerId, new_source: upgrade },
      });
    } catch (e) {
      // Source upgrade is best-effort; the run is still marked completed.
      // eslint-disable-next-line no-console
      console.warn('[v3 mini-process] source upgrade failed:', e);
    }
  }, [projectId, updateRun]);

  const abandon = useCallback(async (runId: string) => {
    if (!projectId) return;
    const run = runsRef.current.find((r) => r.id === runId);
    if (!run) return;
    await updateRun(runId, () => ({ state: 'abandoned' }));
    void logAuditEvent({
      projectId, action: 'mini_process_abandoned',
      payload: { run_id: runId, kind: run.kind },
    });
  }, [projectId, updateRun]);

  return { runs, loading, error, start, toggleStepDone, setCapturedN, setNotes, complete, abandon, refetch };
}

// Re-export the source-upgrade tier hint for tests / UI.
export type { SourceId };
