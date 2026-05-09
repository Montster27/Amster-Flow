// React hook for the assumption stack: fetch, derived candidates, mutations.
// Couples to useLayerStack for spawn / cross-layer derivation.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteAssumption as svcDelete,
  fetchAssumptions,
  insertAssumption as svcInsert,
  insertAssumptionsIgnoringDuplicates,
  logAuditEvent,
  updateAssumption as svcUpdate,
  type InsertAssumptionInput,
} from '../lib/storage';
import type {
  AssumptionCandidate, AssumptionRow, AssumptionState,
} from '../lib/assumptions';
import {
  candidateToInsert, projectStackForRules,
} from '../lib/assumptions';
import { deriveSpawnCandidates } from '../lib/spawnRules';
import { deriveCrossLayerCandidates } from '../lib/crossLayerRules';
import type { LayerStateRow, SourceId } from '../lib/layers';
import { PK_LAYERS } from '../lib/layers';

interface DerivedCandidates {
  spawned: Record<string, AssumptionCandidate[]>; // by source_layer_id
  crossLayer: AssumptionCandidate[];
}

interface UseAssumptionsResult {
  rows: AssumptionRow[];
  loading: boolean;
  error: string | null;
  candidates: DerivedCandidates;
  /** Add a direct assumption authored by the founder. */
  createDirect: (args: { layerId: string | null; text: string; notes?: string }) => Promise<AssumptionRow>;
  /** Promote a candidate (spawned/cross_layer) to the assumption stack. */
  promote: (c: AssumptionCandidate) => Promise<AssumptionRow | null>;
  /** Move an assumption to a new state (with state-machine validation). */
  setState: (id: string, next: AssumptionState) => Promise<void>;
  /** Attach or change the source on an assumption. */
  setSource: (id: string, src: SourceId | null) => Promise<void>;
  /** Edit text/notes (used for "Reframe" channel-3 action). */
  edit: (id: string, patch: { text?: string; notes?: string | null }) => Promise<void>;
  /** Dismiss a candidate without persisting it. Records an audit event so
   *  it doesn't re-spawn the same rule for a configurable cooldown. */
  dismissCandidate: (c: AssumptionCandidate) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAssumptions(
  projectId: string | null | undefined,
  layerRows: LayerStateRow[],
): UseAssumptionsResult {
  const [rows, setRows] = useState<AssumptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedRuleIds, setDismissedRuleIds] = useState<Set<string>>(() => new Set());

  const refetch = useCallback(async () => {
    if (!projectId) return;
    try {
      const next = await fetchAssumptions(projectId);
      setRows(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) { setLoading(false); setRows([]); return; }
    setLoading(true); setError(null);
    fetchAssumptions(projectId)
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  // Existing rule_ids — used to dedupe candidates against already-promoted
  // assumptions (matches the partial unique index on the DB side).
  const existingRuleIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.rule_id) s.add(r.rule_id);
    }
    for (const r of dismissedRuleIds) s.add(r);
    return s;
  }, [rows, dismissedRuleIds]);

  const stackSnapshot = useMemo(() => projectStackForRules(layerRows), [layerRows]);

  const candidates: DerivedCandidates = useMemo(() => {
    const spawned: Record<string, AssumptionCandidate[]> = {};
    for (const L of PK_LAYERS) {
      const cs = deriveSpawnCandidates({
        layerId: L.id,
        stack: stackSnapshot,
        existingRuleIds,
      });
      if (cs.length > 0) spawned[L.id] = cs;
    }
    const crossLayer = deriveCrossLayerCandidates({
      stack: stackSnapshot,
      existingRuleIds,
    });
    return { spawned, crossLayer };
  }, [stackSnapshot, existingRuleIds]);

  const createDirect = useCallback(async (args: {
    layerId: string | null; text: string; notes?: string;
  }) => {
    if (!projectId) throw new Error('No projectId');
    const input: InsertAssumptionInput = {
      project_id: projectId,
      source_layer_id: args.layerId,
      assumption_text: args.text,
      notes: args.notes ?? null,
      channel: 'direct',
      state: 'queued',
    };
    const row = await svcInsert(input);
    setRows((prev) => [row, ...prev]);
    void logAuditEvent({
      projectId, action: 'assumption_created',
      payload: { assumption_id: row.id, channel: 'direct', source_layer_id: args.layerId },
    });
    return row;
  }, [projectId]);

  const promote = useCallback(async (c: AssumptionCandidate) => {
    if (!projectId) throw new Error('No projectId');
    const insert = candidateToInsert(c, projectId);
    const inserted = await insertAssumptionsIgnoringDuplicates([insert]);
    if (inserted.length === 0) {
      // Already promoted in another tab — refetch to surface the existing one.
      await refetch();
      return null;
    }
    const row = inserted[0];
    setRows((prev) => [row, ...prev]);
    void logAuditEvent({
      projectId, action: 'assumption_promoted',
      payload: { assumption_id: row.id, channel: c.channel, rule_id: c.rule_id },
    });
    return row;
  }, [projectId, refetch]);

  const setState = useCallback(async (id: string, next: AssumptionState) => {
    if (!projectId) return;
    const prev = rows.find((r) => r.id === id);
    if (!prev) return;
    const patch: Parameters<typeof svcUpdate>[1] = { state: next };
    if (next === 'killed' || next === 'dismissed' || next === 'validated') {
      patch.resolved_at = new Date().toISOString();
    }
    const updated = await svcUpdate(id, patch);
    setRows((rs) => rs.map((r) => r.id === id ? updated : r));
    void logAuditEvent({
      projectId, action: 'assumption_state_changed',
      payload: { assumption_id: id, before: prev.state, after: next },
    });
  }, [rows, projectId]);

  const setSource = useCallback(async (id: string, src: SourceId | null) => {
    if (!projectId) return;
    const prev = rows.find((r) => r.id === id);
    if (!prev) return;
    const patch: Parameters<typeof svcUpdate>[1] = { source_value: src };
    // Auto-advance from queued → active when source is attached.
    let next: AssumptionState = prev.state;
    if (prev.state === 'queued' && src != null) {
      next = 'active';
      patch.state = next;
    }
    const updated = await svcUpdate(id, patch);
    setRows((rs) => rs.map((r) => r.id === id ? updated : r));
    void logAuditEvent({
      projectId, action: 'assumption_source_changed',
      payload: { assumption_id: id, before: prev.source_value, after: src,
        state_before: prev.state, state_after: next },
    });
  }, [rows, projectId]);

  const edit = useCallback(async (id: string, patch: { text?: string; notes?: string | null }) => {
    if (!projectId) return;
    const prev = rows.find((r) => r.id === id);
    if (!prev) return;
    const dbPatch: Parameters<typeof svcUpdate>[1] = {};
    if (patch.text !== undefined) dbPatch.assumption_text = patch.text;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    const updated = await svcUpdate(id, dbPatch);
    setRows((rs) => rs.map((r) => r.id === id ? updated : r));
    void logAuditEvent({
      projectId, action: 'assumption_edited',
      payload: { assumption_id: id, before: { text: prev.assumption_text, notes: prev.notes }, after: patch },
    });
  }, [rows, projectId]);

  const dismissCandidate = useCallback(async (c: AssumptionCandidate) => {
    setDismissedRuleIds((prev) => new Set(prev).add(c.rule_id));
    if (projectId) {
      void logAuditEvent({
        projectId, action: 'candidate_dismissed',
        payload: { rule_id: c.rule_id, channel: c.channel, source_layer_id: c.source_layer_id },
      });
    }
  }, [projectId]);

  return {
    rows, loading, error, candidates,
    createDirect, promote, setState, setSource, edit, dismissCandidate,
    refetch,
  };
}

// Tiny re-export to keep imports tidy in pages.
export { svcDelete as deleteAssumption };
