// useDoorAState — fetches + mutates the JSONB Door A blob for a project.
//
// Mirrors the shape of useVenture/useLayerStack: optimistic update on save,
// refetch on error. Debounced autosave handled inside the hook so step
// components can `update(patch)` without worrying about request flooding.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchDoorAState,
  upsertDoorAState,
} from '../lib/storage';
import {
  emptyDoorAState,
  type DoorAState,
} from '../lib/doorAState';

const AUTOSAVE_DEBOUNCE_MS = 800;

interface UseDoorAStateResult {
  state: DoorAState;
  loading: boolean;
  error: string | null;
  /** Pending autosave flush in flight. UI can render a "saving…" hint. */
  saving: boolean;
  /** True once the initial fetch has resolved. */
  hydrated: boolean;
  /** Timestamp of the most-recent successful persist (Sprint 3 T14). Null
   *  before the first save completes. UI renders "saved · {time} ago". */
  lastSavedAt: Date | null;
  /** Update part of the state — autosaves on the debounce timer. */
  update: (patch: Partial<DoorAState> | ((prev: DoorAState) => DoorAState)) => void;
  /** Force-flush any pending autosave (call before navigation). */
  flush: () => Promise<void>;
  /** Force a refetch from the server. */
  refetch: () => Promise<void>;
}

export function useDoorAState(projectId: string | null | undefined): UseDoorAStateResult {
  const [state, setState] = useState<DoorAState>(() => emptyDoorAState());
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs that need to stay current across renders without retriggering effects:
  // - pending: the most-recent state to write (drives debounced flush)
  // - dirty: did the user touch the state since last persist?
  // - timer: in-flight autosave timeout
  const pendingRef = useRef<DoorAState | null>(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>('');
  // Tracks mount status so async persist() calls don't setState after the
  // component unmounts (React warns + the work is wasted). Set true at the
  // top of the effect body so StrictMode's mount→unmount→remount cycle leaves
  // it `true`, not stuck `false` after the simulated cleanup.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    try {
      const fetched = await fetchDoorAState(projectId);
      const next = fetched ?? emptyDoorAState();
      setState(next);
      lastSavedRef.current = JSON.stringify(next);
      dirtyRef.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    if (!projectId) { setLoading(false); return; }
    setLoading(true); setError(null);
    fetchDoorAState(projectId)
      .then((row) => {
        if (cancelled) return;
        const next = row ?? emptyDoorAState();
        setState(next);
        lastSavedRef.current = JSON.stringify(next);
        setHydrated(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const persist = useCallback(async (snapshot: DoorAState) => {
    if (!projectId) return;
    if (mountedRef.current) setSaving(true);
    try {
      const saved = await upsertDoorAState(projectId, snapshot);
      lastSavedRef.current = JSON.stringify(saved);
      dirtyRef.current = false;
      // Bail before any setState if the component unmounted mid-flight.
      if (!mountedRef.current) return;
      setLastSavedAt(new Date());
      // Reconcile state only if no further edits were made in the meantime.
      if (pendingRef.current && JSON.stringify(pendingRef.current) === lastSavedRef.current) {
        setState(saved);
      }
    } catch (e) {
      // On failure, refetch to drop the optimistic write.
      if (mountedRef.current) await refetch();
      throw e;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [projectId, refetch]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const snapshot = pendingRef.current;
      if (!snapshot) return;
      void persist(snapshot);
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [persist]);

  const update = useCallback((
    patch: Partial<DoorAState> | ((prev: DoorAState) => DoorAState),
  ) => {
    setState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      const nextSerialized = JSON.stringify(next);
      if (nextSerialized === lastSavedRef.current) {
        // No-op write — skip the autosave.
        dirtyRef.current = false;
        return next;
      }
      pendingRef.current = next;
      dirtyRef.current = true;
      scheduleSave();
      return next;
    });
  }, [scheduleSave]);

  const flush = useCallback(async () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current || !pendingRef.current) return;
    await persist(pendingRef.current);
  }, [persist]);

  // Flush on unmount so navigating away doesn't lose the last debounced write.
  // Use a raw upsert (not persist()) so the cleanup never touches React state
  // post-unmount, and depend only on [projectId] so it fires on real unmount /
  // project switch — not every time persist()'s identity changes.
  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (dirtyRef.current && pendingRef.current && projectId) {
        dirtyRef.current = false;
        // Fire-and-forget — can't await in cleanup, so bypass persist() (which
        // would setState on an unmounting component) and write directly.
        void upsertDoorAState(projectId, pendingRef.current).catch(() => {});
      }
    };
  }, [projectId]);

  return useMemo(() => ({
    state, loading, error, saving, hydrated, lastSavedAt, update, flush, refetch,
  }), [state, loading, error, saving, hydrated, lastSavedAt, update, flush, refetch]);
}
