// LayerRow — interactive row used by Door B (and the layer detail).
// Renders the layer name + question, an editable claim textarea (debounced
// auto-save on blur or 1s idle), and a SourcePicker (instant save).

import { useEffect, useRef, useState } from 'react';
import { CategoryBadge, SourcePicker, TierLadder } from './atoms';
import { lookupPushback } from '../lib/voice';
import { pkTier } from '../lib/layers';
import type { Evaluator, LayerStateRow, PkLayer, SourceId } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

const SAVE_DEBOUNCE_MS = 1000;

interface Props {
  layer: PkLayer;
  row: LayerStateRow | undefined;
  evaluator: Evaluator;
  saving?: boolean;
  onSave: (patch: { claim_text?: string | null; source_value?: SourceId | null }) => Promise<void>;
}

export function LayerRow({ layer, row, evaluator, onSave }: Props) {
  const [claim, setClaim] = useState(row?.claim_text ?? '');
  const [pendingSave, setPendingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimTimer = useRef<number | null>(null);
  const lastSavedClaim = useRef<string>(row?.claim_text ?? '');
  // Mirror of `claim` so the sync effect can read the latest local value
  // without listing `claim` as a dependency (which would re-run it per keystroke).
  const claimRef = useRef(claim);
  claimRef.current = claim;

  // If the row changes from the outside (initial load, refetch), sync local
  // state — but only when (a) the incoming value differs from what we last
  // saved AND (b) the user has no unsaved local edits in flight. Without the
  // second guard, a stack refetch triggered by editing another row could
  // clobber text the founder is actively typing here.
  useEffect(() => {
    const incoming = row?.claim_text ?? '';
    const hasUnsavedEdits = claimRef.current !== lastSavedClaim.current;
    if (incoming !== lastSavedClaim.current && !hasUnsavedEdits) {
      setClaim(incoming);
      lastSavedClaim.current = incoming;
    }
  }, [row?.claim_text]);

  const tier = pkTier(layer.id, row?.source_value);
  const isCrit = layer.cat === 'critical';
  const pushback = lookupPushback(layer.id, tier, evaluator);

  const flushClaim = async () => {
    if (claimTimer.current) {
      window.clearTimeout(claimTimer.current);
      claimTimer.current = null;
    }
    const trimmed = claim.trim();
    if (trimmed === lastSavedClaim.current) return;
    setPendingSave(true); setError(null);
    try {
      await onSave({ claim_text: trimmed.length === 0 ? null : trimmed });
      lastSavedClaim.current = trimmed;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setPendingSave(false);
    }
  };

  const onClaimChange = (v: string) => {
    setClaim(v);
    if (claimTimer.current) window.clearTimeout(claimTimer.current);
    claimTimer.current = window.setTimeout(() => { void flushClaim(); }, SAVE_DEBOUNCE_MS);
  };

  const onSourceChange = async (next: SourceId | null) => {
    setPendingSave(true); setError(null);
    try {
      // Save pending claim first if dirty
      const trimmed = claim.trim();
      const claimPatch = trimmed !== lastSavedClaim.current
        ? { claim_text: trimmed.length === 0 ? null : trimmed } : {};
      await onSave({ ...claimPatch, source_value: next });
      if (claimPatch.claim_text !== undefined) lastSavedClaim.current = trimmed;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setPendingSave(false);
    }
  };

  return (
    <div style={{
      borderLeft: `3px solid ${isCrit ? '#0f766e' : 'transparent'}`,
      borderBottom: '1px dashed #e2e8f0',
      padding: '14px 20px',
      background: '#fff',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 16,
        alignItems: 'flex-start',
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 11,
          color: isCrit ? '#0f766e' : '#cbd5e1',
          letterSpacing: '0.06em', fontWeight: 700, paddingTop: 4,
        }}>L{String(layer.n).padStart(2, '0')}</span>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              fontSize: 14.5, color: '#0b1220',
              fontWeight: isCrit ? 600 : 500, letterSpacing: '-0.005em',
            }}>{layer.name}</span>
            <CategoryBadge cat={layer.cat} />
          </div>
          <div style={{
            fontSize: 12, color: '#64748b', lineHeight: 1.5,
            fontStyle: 'italic', marginBottom: 8,
          }}>{layer.q}</div>

          <textarea
            value={claim}
            onChange={(e) => onClaimChange(e.target.value)}
            onBlur={() => { void flushClaim(); }}
            placeholder={`Your claim about ${layer.name.toLowerCase()}…`}
            style={{
              width: '100%', minHeight: 56, padding: '8px 10px',
              border: '1px solid #e8dfc9', borderRadius: 6,
              fontSize: 13.5, lineHeight: 1.5, fontFamily: 'inherit',
              background: '#fbfaf7', color: '#0b1220', resize: 'vertical',
              outline: 'none',
            }}
          />

          {!layer.hideSource && (
            <div style={{ marginTop: 10 }}>
              <SourcePicker
                value={row?.source_value ?? null}
                layerId={layer.id}
                onChange={(next) => { void onSourceChange(next); }}
              />
            </div>
          )}

          {pushback && (
            <div style={{
              marginTop: 10, padding: '10px 12px',
              background: '#fff8eb', border: '1px solid #fde68a',
              borderLeft: '3px solid #b45309', borderRadius: 6,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 9.5, color: '#92400e',
                letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
                marginBottom: 4,
              }}>Pushback at tier {tier} · {evaluator}</div>
              <div style={{
                fontFamily: FONT_SERIF, fontSize: 14, lineHeight: 1.4,
                color: '#0b1220', fontStyle: 'italic',
              }}>&ldquo;{pushback}&rdquo;</div>
            </div>
          )}

          {error && (
            <div role="alert" style={{
              marginTop: 8, fontSize: 12, color: '#be123c',
              fontFamily: FONT_MONO,
            }}>Save failed: {error}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, paddingTop: 4 }}>
          <TierLadder tier={tier} tone={isCrit ? 'critical' : 'thoughtful'} />
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
            letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums',
          }}>{tier}/5{pendingSave ? ' · saving' : ''}</span>
        </div>
      </div>
    </div>
  );
}
