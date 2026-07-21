// useClaimDraft — debounced claim autosave shared by the Door B LayerRow and the
// Questions Up & Down layer workspace.
//
// Behavior (extracted from the original LayerRow so the two surfaces can't
// diverge):
//   • local draft state, debounced save on idle (default 1s)
//   • flush() to save immediately (call on blur, before a source change, or
//     before navigating to another layer)
//   • flush on unmount, so switching layers never loses unsaved text
//   • syncs from an external value (initial load / refetch) only when the
//     incoming value differs from what we last saved AND the user has no
//     unsaved local edits — so a refetch can't clobber active typing.

import { useCallback, useEffect, useRef, useState } from 'react';

export const CLAIM_SAVE_DEBOUNCE_MS = 1000;

interface Options {
  /** The persisted claim from the store (row?.claim_text ?? ''). */
  externalClaim: string;
  /** Persist the trimmed claim. `null` clears it. */
  saveClaim: (claim: string | null) => Promise<void>;
  debounceMs?: number;
}

interface Result {
  claim: string;
  /** Update the draft and schedule a debounced save. */
  setClaim: (value: string) => void;
  /** Save now if the draft differs from what was last saved. */
  flush: () => Promise<void>;
  saving: boolean;
  error: string | null;
}

export function useClaimDraft({
  externalClaim, saveClaim, debounceMs = CLAIM_SAVE_DEBOUNCE_MS,
}: Options): Result {
  const [claim, setClaimState] = useState(externalClaim);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<number | null>(null);
  const lastSaved = useRef<string>(externalClaim);
  const claimRef = useRef(claim);
  claimRef.current = claim;

  // Sync from the outside (initial load, refetch) — but never over unsaved edits.
  useEffect(() => {
    const hasUnsavedEdits = claimRef.current !== lastSaved.current;
    if (externalClaim !== lastSaved.current && !hasUnsavedEdits) {
      setClaimState(externalClaim);
      lastSaved.current = externalClaim;
    }
  }, [externalClaim]);

  const flush = useCallback(async () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const trimmed = claimRef.current.trim();
    if (trimmed === lastSaved.current) return;
    setSaving(true);
    setError(null);
    try {
      await saveClaim(trimmed.length === 0 ? null : trimmed);
      lastSaved.current = trimmed;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [saveClaim]);

  const setClaim = useCallback((value: string) => {
    setClaimState(value);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void flush(); }, debounceMs);
  }, [flush, debounceMs]);

  // Flush any pending text on unmount (layer switch / navigation). Keep the
  // latest flush in a ref so the cleanup closure isn't stale.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => { void flushRef.current(); }, []);

  return { claim, setClaim, flush, saving, error };
}
