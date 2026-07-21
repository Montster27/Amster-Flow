// LayerWorkspace — the focused editing panel for the one selected layer in the
// Questions Up & Down workspace. Reuses the persistence, scoring, source, and
// pushback logic verbatim; only the arrangement is new: question → claim →
// evidence → one dominant next move → secondary prev/next, with everything
// advanced tucked behind collapsed disclosures. Pushback is never shown on an
// empty layer by default.
//
// Rendered with key={layer.id} by the page, so useClaimDraft remounts per layer
// and flushes any unsaved text on switch.

import { useRef, useState } from 'react';
import { SourcePicker, SourcePill, TierLadder, MentorCallout, SaveStatus } from './atoms';
import { SectorMapPanel } from './SectorMapPanel';
import { FrameworkDisclosure } from './FrameworkDisclosure';
import { useClaimDraft } from '../hooks/useClaimDraft';
import {
  PK_LAYER_BY_ID, pkHidesSource, pkSourcesFor, pkTier,
  type Evaluator, type LayerStateRow, type PkLayer, type SourceId,
} from '../lib/layers';
import { lookupPushback } from '../lib/voice';
import {
  recommendedNextMove, evidenceStrengthLabel, layerCompletionState, COMPLETION_LABEL,
  type NextMove,
} from '../lib/stackNav';
import { relationsFor } from '../lib/relationships';
import { perspectiveGuidance, PERSPECTIVE_BY_ID, type Perspective } from '../lib/perspectives';
import type { AssumptionCandidate } from '../lib/assumptions';
import {
  FONT_MONO, FONT_SERIF, INK, MUTED, SLATE, SLATE_FG, STONE, TAN, TEAL,
  PAPER, CREAM, AMBER_FG, GOLD,
} from '../lib/tokens';

interface Props {
  layer: PkLayer;
  row: LayerStateRow | undefined;
  projectId: string;
  evaluator: Evaluator;
  perspective: Perspective;
  saveLayer: (layerId: string, patch: { claim_text?: string | null; source_value?: SourceId | null }) => Promise<void>;
  onNavigate: (layerId: string) => void;
  prevLayerId?: string;
  nextLayerId?: string;
  hasHeat: boolean;
  heatTargetLayer?: string;
  cameFromDoorA: boolean;
  foundationIncomplete: boolean;
  onContinueGuided: () => void;
  candidates: AssumptionCandidate[];
  onPromote: (c: AssumptionCandidate) => void | Promise<unknown>;
  onDismissCandidate: (c: AssumptionCandidate) => void;
}

const cardStyle = {
  padding: '16px 18px', background: '#fff',
  border: `1px solid ${TAN}`, borderRadius: 10,
  display: 'flex', flexDirection: 'column', gap: 10,
} as const;

const kickerStyle = {
  fontFamily: FONT_MONO, fontSize: 10, color: INK,
  letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
} as const;

export function LayerWorkspace({
  layer, row, projectId, evaluator, perspective, saveLayer,
  onNavigate, prevLayerId, nextLayerId,
  hasHeat, heatTargetLayer, cameFromDoorA, foundationIncomplete, onContinueGuided,
  candidates, onPromote, onDismissCandidate,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const isSector = layer.customView === 'sectorMap';
  const hidesSource = pkHidesSource(layer.id);
  const tier = pkTier(layer.id, row?.source_value);
  const state = layerCompletionState(layer.id, row);
  const hasClaim = Boolean((row?.claim_text ?? '').trim());
  const pushback = lookupPushback(layer.id, tier, evaluator);
  const roleGuidance = perspectiveGuidance(perspective, layer.id);
  const rel = relationsFor(layer.id);

  const { claim, setClaim, status: saveStatus, retry: retrySave } = useClaimDraft({
    externalClaim: row?.claim_text ?? '',
    saveClaim: (c) => saveLayer(layer.id, { claim_text: c }),
  });

  const onSourceChange = async (next: SourceId | null) => {
    await saveLayer(layer.id, { source_value: next });
  };

  const move: NextMove = recommendedNextMove(layer, row, {
    hasHeat, heatTargetLayer, cameFromDoorA, foundationIncomplete,
  });

  const runMove = () => {
    switch (move.kind) {
      case 'add-claim': textareaRef.current?.focus(); break;
      case 'add-evidence':
        sourceRef.current?.scrollIntoView({ block: 'nearest' });
        sourceRef.current?.querySelector('button')?.focus();
        break;
      case 'move':
      case 'resolve-risk':
        if (move.targetLayer) onNavigate(move.targetLayer);
        break;
      case 'continue-guided': onContinueGuided(); break;
      default: break;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* 1–2. Name, purpose, question, evidence strength */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{
            margin: 0, fontFamily: FONT_SERIF, fontSize: 26, color: INK,
            letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>{layer.name}</h2>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED,
            letterSpacing: '0.08em', fontWeight: 600,
          }}>L{String(layer.n).padStart(2, '0')} · {COMPLETION_LABEL[state]}</span>
        </div>
        <p style={{
          margin: 0, fontFamily: FONT_SERIF, fontSize: 17, color: SLATE_FG,
          fontStyle: 'italic', lineHeight: 1.4,
        }}>{layer.q}</p>
      </div>

      {roleGuidance && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, background: CREAM,
          border: `1px solid ${TAN}`, borderLeft: `3px solid ${GOLD}`,
          fontSize: 13, color: SLATE_FG, lineHeight: 1.45,
        }}>
          <span style={{ ...kickerStyle, color: AMBER_FG, marginRight: 8 }}>
            {PERSPECTIVE_BY_ID[perspective]?.label}
          </span>
          {roleGuidance}
        </div>
      )}

      {isSector ? (
        <SectorMapPanel projectId={projectId} layer={layer} saveLayer={saveLayer} />
      ) : (
        <>
          {/* 3. Claim editor */}
          <section style={cardStyle} aria-label="Your claim">
            <div style={kickerStyle}>Your claim</div>
            <textarea
              ref={textareaRef}
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder={`Your claim about ${layer.name.toLowerCase()}…`}
              aria-label={`Claim for ${layer.name}`}
              style={{
                width: '100%', minHeight: 90, padding: '10px 12px',
                border: `1px solid ${TAN}`, borderRadius: 6,
                fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit',
                background: PAPER, color: INK, resize: 'vertical', outline: 'none',
              }}
            />
            <SaveStatus state={saveStatus} onRetry={() => { void retrySave(); }} />
          </section>

          {/* 4. Evidence source */}
          {!hidesSource && (
            <section style={cardStyle} ref={sourceRef}>
              <SourcePicker
                value={row?.source_value ?? null}
                layerId={layer.id}
                onChange={(next) => { void onSourceChange(next); }}
              />
              {row?.source_value && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: MUTED, letterSpacing: '0.06em' }}>CURRENT</span>
                  <SourcePill src={row.source_value} />
                </div>
              )}
            </section>
          )}

          {/* 5. Evidence-strength result + explanation */}
          <section style={{ ...cardStyle, background: PAPER }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={kickerStyle}>Evidence strength</span>
              <TierLadder tier={tier} tone={layer.cat} />
              <span style={{
                fontFamily: FONT_MONO, fontSize: 12, color: tier >= 3 ? TEAL : SLATE,
                fontWeight: 700, letterSpacing: '0.04em',
              }}>{evidenceStrengthLabel(tier)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: SLATE_FG, lineHeight: 1.5 }}>
              {hidesSource
                ? 'This is an aspirational layer — it cites no evidence, so a filled claim is as strong as it gets.'
                : 'Supported means a claim backed by evidence that meets this layer’s threshold. Sources are ranked per layer, so the same star can come from a different source elsewhere.'}
            </p>
          </section>

          {/* 6. One dominant recommended next move */}
          <section style={{
            padding: '16px 18px', borderRadius: 10,
            background: '#0b1220', color: '#f8fafc',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: GOLD,
              letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
            }}>Recommended next move</div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{move.label}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{move.detail}</div>
            {move.kind !== 'none' && (
              <button
                type="button"
                onClick={runMove}
                style={{
                  alignSelf: 'flex-start', marginTop: 4,
                  padding: '8px 14px', background: TEAL, color: '#fff',
                  border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{ctaLabel(move)}</button>
            )}
          </section>

          {/* Pushback — only inline once a claim exists (never on empty layers). */}
          {hasClaim && pushback && (
            <MentorCallout
              kicker={`Investor pushback · tier ${tier}`}
              tone="amber"
              italic
              body={pushback}
            />
          )}

          {/* 7. Secondary prev / next */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <button
              type="button"
              disabled={!prevLayerId}
              onClick={() => prevLayerId && onNavigate(prevLayerId)}
              aria-label={prevLayerId ? `Previous layer: ${PK_LAYER_BY_ID[prevLayerId]?.name}` : 'No previous layer'}
              style={navBtnStyle(!prevLayerId)}
            >⟵ Previous{prevLayerId ? `: ${PK_LAYER_BY_ID[prevLayerId]?.name}` : ''}</button>
            <button
              type="button"
              disabled={!nextLayerId}
              onClick={() => nextLayerId && onNavigate(nextLayerId)}
              aria-label={nextLayerId ? `Next layer: ${PK_LAYER_BY_ID[nextLayerId]?.name}` : 'No next layer'}
              style={{ ...navBtnStyle(!nextLayerId), textAlign: 'right' }}
            >{nextLayerId ? `${PK_LAYER_BY_ID[nextLayerId]?.name}: ` : ''}Next ⟶</button>
          </div>

          {/* 8. Progressive disclosures */}
          <InvestorPerspectiveDisclosure
            pushback={pushback} tier={tier} evaluator={evaluator} hasClaim={hasClaim}
          />
          <ScoringDetailsDisclosure layerId={layer.id} currentSource={row?.source_value ?? null} />
          <AssumptionsRelatedDisclosure
            candidates={candidates}
            related={[
              ...(rel.up ? [rel.up.layer] : []),
              ...(rel.down ? [rel.down.layer] : []),
              ...(rel.related ?? []),
            ]}
            onNavigate={onNavigate}
            onPromote={onPromote}
            onDismiss={onDismissCandidate}
            promoteError={promoteError}
            setPromoteError={setPromoteError}
          />
        </>
      )}
    </div>
  );
}

function ctaLabel(move: NextMove): string {
  switch (move.kind) {
    case 'add-claim': return 'Write a claim';
    case 'add-evidence': return 'Pick a source';
    case 'move': return move.label;
    case 'resolve-risk': return move.targetLayer ? `Go to ${PK_LAYER_BY_ID[move.targetLayer]?.name ?? 'the risk'}` : 'Review the risk';
    case 'continue-guided': return 'Continue guided flow';
    default: return '';
  }
}

function navBtnStyle(disabled: boolean) {
  return {
    flex: 1, padding: '8px 12px', fontSize: 12, fontFamily: 'inherit',
    background: 'transparent', color: disabled ? STONE : SLATE_FG,
    border: `1px solid ${disabled ? '#eee6d3' : TAN}`, borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
  } as const;
}

// ── Disclosures ──

function InvestorPerspectiveDisclosure({
  pushback, tier, evaluator, hasClaim,
}: { pushback: string | null; tier: number; evaluator: Evaluator; hasClaim: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <FrameworkDisclosure
      open={open}
      onToggle={() => setOpen((o) => !o)}
      summary="Investor perspective"
      hint="How this reads under pressure — shown on demand, not by default"
    >
      <div style={{ padding: 16 }}>
        {pushback ? (
          <MentorCallout kicker={`Pushback · tier ${tier} · ${evaluator}`} tone="amber" italic body={pushback} />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: SLATE_FG, lineHeight: 1.5 }}>
            {hasClaim
              ? 'No pushback at this evidence strength — an investor would accept this as-is.'
              : 'Add a claim to see how an investor would press on it.'}
          </p>
        )}
      </div>
    </FrameworkDisclosure>
  );
}

function ScoringDetailsDisclosure({ layerId, currentSource }: { layerId: string; currentSource: SourceId | null }) {
  const [open, setOpen] = useState(false);
  const sources = pkSourcesFor(layerId);
  return (
    <FrameworkDisclosure
      open={open}
      onToggle={() => setOpen((o) => !o)}
      summary="Scoring details"
      hint="How each source ranks for this specific layer"
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sources.map((s) => {
          const t = pkTier(layerId, s.id);
          const isCurrent = s.id === currentSource;
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
              color: isCurrent ? INK : SLATE_FG, fontWeight: isCurrent ? 700 : 400,
            }}>
              <span style={{ flex: 1 }}>{s.label}{isCurrent ? ' (current)' : ''}</span>
              <TierLadder tier={t} tone="critical" size="sm" />
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: SLATE, minWidth: 70, textAlign: 'right' }}>
                {evidenceStrengthLabel(t)}
              </span>
            </div>
          );
        })}
      </div>
    </FrameworkDisclosure>
  );
}

function AssumptionsRelatedDisclosure({
  candidates, related, onNavigate, onPromote, onDismiss, promoteError, setPromoteError,
}: {
  candidates: AssumptionCandidate[];
  related: string[];
  onNavigate: (layerId: string) => void;
  onPromote: (c: AssumptionCandidate) => void | Promise<unknown>;
  onDismiss: (c: AssumptionCandidate) => void;
  promoteError: string | null;
  setPromoteError: (s: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const relatedLayers = Array.from(new Set(related)).map((id) => PK_LAYER_BY_ID[id]).filter(Boolean);
  return (
    <FrameworkDisclosure
      open={open}
      onToggle={() => setOpen((o) => !o)}
      summary="Assumptions & related layers"
      hint={`${candidates.length} candidate${candidates.length === 1 ? '' : 's'} · ${relatedLayers.length} connected`}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={kickerStyle}>Assumption candidates from this layer</div>
          {candidates.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12.5, color: MUTED, fontStyle: 'italic' }}>
              No outstanding candidates from this layer right now.
            </p>
          ) : candidates.map((c) => (
            <div key={c.rule_id} style={{
              padding: '10px 12px', borderRadius: 8, background: '#fff',
              border: `1.5px solid ${TEAL}`, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.4, fontWeight: 500 }}>{c.assumption_text}</div>
              {c.notes && <div style={{ fontSize: 11.5, color: SLATE_FG, fontStyle: 'italic', lineHeight: 1.4 }}>{c.notes}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setPromoteError(null);
                    void Promise.resolve(onPromote(c)).catch((e) => setPromoteError(e instanceof Error ? e.message : 'Could not add'));
                  }}
                  aria-label={`Add to stack: ${c.assumption_text}`}
                  style={{
                    padding: '6px 12px', background: INK, color: '#fff', border: 'none',
                    borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >Add to stack</button>
                <button
                  type="button"
                  onClick={() => onDismiss(c)}
                  aria-label={`Dismiss candidate: ${c.assumption_text}`}
                  style={{
                    padding: '6px 12px', background: 'transparent', color: SLATE_FG,
                    border: `1px solid ${STONE}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >Dismiss</button>
              </div>
            </div>
          ))}
          {promoteError && <div role="alert" style={{ fontSize: 12, color: '#be123c', fontFamily: FONT_MONO }}>{promoteError}</div>}
        </div>

        {relatedLayers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={kickerStyle}>Connected layers</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {relatedLayers.map((L) => (
                <button
                  key={L!.id}
                  type="button"
                  onClick={() => onNavigate(L!.id)}
                  style={{
                    padding: '5px 11px', borderRadius: 999, fontSize: 12,
                    border: `1px solid ${TAN}`, background: '#fff', color: SLATE_FG,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{L!.name} →</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FrameworkDisclosure>
  );
}
