// DoorAPage.steps.tsx
// The 12 step components for the Door A step graph (L8.1 → L10.4).
//
// Each step receives the same StepProps so it can read state, update state,
// navigate between steps, write into pivotkit_layer_states via saveLayer,
// and promote extracted assumptions via createDirectAssumption.
//
// Source convention: when a founder fills a layer through this flow we
// default source_value to 'experience' (most first-fill claims rest on
// the founder's lived sense of the problem). They can upgrade the source
// on the dashboard later.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BeachheadRadio, CategoryBadge, MentorCallout,
  ParentChip, PillOption, ScoreBar, SourcePicker,
} from '../components/atoms';
import {
  RouteLane, TemplateMini, CHAIN_TEMPLATES,
  type ChainTemplate,
} from '../components/valueChain';
import {
  addPain, beachheadSegmentLabel, computeBeachheadScore, deletePain, editPain, emptyRoute,
  getPains, getPrimaryPain, getSolutionRow, isCloseCall, MAX_PAINS,
  nodesOrdered as nodesOrderedFn, normalizedScore, painLabel,
  painLayerEvidenceStar, promotePrimary, setSolutionRow, solutionLayerClaim, topRankedSubgroup,
  type AdoptionVerdict, type BusinessModelId, type ChainNode as ChainNodeT,
  type ChainRole, type Competitor, type CompetitorTag,
  type DoorAState, type DoorASourceId, type EvidenceStar, type Pain,
  type PainSeverity, type PainValue,
  type ParentGroup, type ReachValue, type SizeValue, type SolutionRow, type SubGroup,
  type ValueChain, type ValueRoute,
} from '../lib/doorAState';
import { deriveAssumption, rebuildDerivedAssumptions } from '../lib/deriveAssumption';
import { pkTier, PK_LAYER_BY_ID } from '../lib/layers';
import type { SourceId } from '../lib/layers';
import {
  fewGroupsWarning, fiveGroupsAck,
  lookupStepVoice, lookupStepWarning, type StepId,
} from '../lib/voice';
import {
  AMBER_FG, AMBER_SOFT, FONT_MONO, FONT_SERIF, HAIR, INK, MUTED,
  PAPER, SLATE_FG, STONE, TAN, TEAL, TEAL_LITE,
} from '../lib/tokens';

// ── Shared props for every step component ──

export interface StepProps {
  state: DoorAState;
  update: (patch: Partial<DoorAState> | ((prev: DoorAState) => DoorAState)) => void;
  goTo: (step: StepId) => void;
  saveLayer: (
    layerId: string,
    patch: { claim_text?: string | null; source_value?: SourceId | null },
  ) => Promise<void>;
  createDirectAssumption: (args: {
    layerId: string | null; text: string; notes?: string;
  }) => Promise<unknown>;
  /** Called by the terminal step (L10.4). Owns final-save + navigate-to-dashboard. */
  onGraduate: () => Promise<void>;
}

// ── ID helper (local, deterministic-looking but doesn't need to be) ──

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Option labels ──

const PAIN_OPTIONS: { value: PainValue; label: string; tip: string }[] = [
  { value: 'critical',     label: 'Critical',     tip: "They're actively trying to solve this right now. They've tried alternatives. They're losing money / time / sleep over it." },
  { value: 'useful',       label: 'Useful',       tip: 'Meaningful improvement — saves real time or money — but they live with it. They will not switch on their own.' },
  { value: 'nice-to-have', label: 'Nice-to-have', tip: "Convenience or polish. They'd take it if free. Nobody is paying for this." },
];
const REACH_OPTIONS: { value: ReachValue; label: string; tip: string }[] = [
  { value: 'know-personally',  label: 'I know them',         tip: 'You can talk to 5 of them by Friday without any introductions. Genuine personal access.' },
  { value: 'specific-channel', label: 'Specific channel',    tip: 'You know exactly where they hang out — a subreddit, a Slack, a conference, a job title to search.' },
  { value: 'no-idea',          label: 'No idea',             tip: "You'd be cold-emailing strangers. Don't pretend otherwise." },
];
const SIZE_OPTIONS: { value: SizeValue; label: string; tip: string }[] = [
  { value: 'tiny-niche',   label: 'Tiny niche',   tip: 'Hundreds to low thousands. Fine for a beachhead. Bad for a Series A pitch.' },
  { value: 'real-market',  label: 'Real market',  tip: 'Tens of thousands to a few hundred thousand. Most beachheads land here.' },
  { value: 'large-market', label: 'Large market', tip: 'Millions. Almost never the right starting place.' },
];

// ── L11 pain-scale option labels + evidence mapping ──

const SEVERITY_OPTIONS: { value: PainSeverity; label: string; tip: string }[] = [
  { value: 'high', label: 'High', tip: "They're losing real money / time / sleep over it and actively hunting for a fix." },
  { value: 'med',  label: 'Med',  tip: 'A meaningful drag — saves real time or money — but they live with it today.' },
  { value: 'low',  label: 'Low',  tip: "Convenience or polish. They'd take a fix if it were free." },
];

// Per-pain evidence reuses the "How do you know?" SourcePicker. painScale's
// per-layer source→tier map (lib/layers) is a clean bijection over ★1–★5, so a
// pain's evidenceStar and the picked source are two views of one value. These
// convert between them via pkTier so the picker, the per-pain star, and the
// layer roll-up all stay in lockstep with the canonical tier config.
const EVIDENCE_SOURCES: SourceId[] = ['logical', 'experience', 'research', 'interviews', 'prototype'];
function sourceForStar(star: EvidenceStar): SourceId {
  return EVIDENCE_SOURCES.find((s) => pkTier('painScale', s) === star) ?? 'logical';
}
function starForSource(src: SourceId): EvidenceStar {
  const t = pkTier('painScale', src);
  return (t >= 1 && t <= 5 ? t : 1) as EvidenceStar;
}

// ── Layout helpers ──

function StepFrame({
  stepId, title, children, suppressVoice = false, voicePosition = 'aside',
}: {
  stepId: StepId; title: string; children: React.ReactNode;
  /** When true, hide the static voice callout — a reactive card is showing
   *  in the main column and we render at most one card at a time. */
  suppressVoice?: boolean;
  /** 'aside' (default): StepFrame renders the mentor tip, subordinate, at the
   *  bottom of the column (v3 usability step 1 — the task owns the space above
   *  the fold; the mentor voice is kept but visually secondary).
   *  'inline': the step renders the voice itself in-flow (e.g. a reactive
   *  card), so StepFrame renders none. */
  voicePosition?: 'aside' | 'inline';
}) {
  const voice = lookupStepVoice(stepId);
  const renderVoice = voicePosition === 'aside' && !suppressVoice;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <CategoryBadge cat="critical" />
      </div>
      <h2 style={{
        fontFamily: FONT_SERIF, fontSize: 28, lineHeight: 1.15,
        color: INK, letterSpacing: '-0.012em', margin: 0, marginBottom: 18,
      }}>{title}</h2>
      {children}
      {renderVoice && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: MUTED, fontWeight: 700,
            marginBottom: 8,
          }}>Mentor tip</div>
          <MentorCallout body={voice} italic />
        </div>
      )}
    </div>
  );
}

// Source picker for the contributing Door A steps. Pre-selects 'experience'
// visually; the underlying state lives in `state.draftSources[layerId]` and
// is flushed to pivotkit_layer_states.source_value when the founder clicks
// Continue past the step.
function StepSourcePicker({
  layerId, state, update,
}: {
  layerId: string;
  state: DoorAState;
  update: StepProps['update'];
}) {
  const current: SourceId = (state.draftSources[layerId] as SourceId | undefined) ?? 'experience';
  // First time the founder lands on this contributing step, stamp the
  // pre-selected default into draftSources so the picker, the right-rail
  // star count, and saveLayer's source_value all agree without the user
  // having to click. Later visits keep whatever the user picked.
  const draft = state.draftSources[layerId];
  useEffect(() => {
    if (draft === undefined) {
      update((prev) => ({
        ...prev,
        draftSources: { ...prev.draftSources, [layerId]: 'experience' },
      }));
    }
  }, [layerId, draft, update]);

  return (
    <div style={{
      marginBottom: 20, paddingTop: 14,
      borderTop: `1px dashed ${TAN}`,
    }}>
      <SourcePicker
        value={current}
        layerId={layerId}
        onChange={(id) => {
          update((prev) => ({
            ...prev,
            draftSources: {
              ...prev.draftSources,
              [layerId]: (id ?? 'experience') as DoorASourceId,
            },
          }));
        }}
      />
    </div>
  );
}

function BeachheadFixedHeader({ state }: { state: DoorAState }) {
  const sg = state.subgroups.find((s) => s.id === state.beachheadId);
  if (!sg) return null;
  const parent = state.optionSpace.find((p) => p.id === sg.parentGroupId);
  return (
    <div style={{
      padding: '10px 14px', marginBottom: 20,
      borderRadius: 6, background: TEAL_LITE,
      border: `1px solid ${TEAL}`,
      display: 'flex', alignItems: 'baseline', gap: 10,
    }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 10, color: TEAL,
        letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
      }}>Beachhead</span>
      <span style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{sg.name}</span>
      {parent && (
        <span style={{ fontSize: 12, color: SLATE_FG }}>
          · {parent.name}
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// L8.1 — Generate option space
// ──────────────────────────────────────────────────────────────────

export function Step8_1({ state, update, goTo }: StepProps) {
  const [draft, setDraft] = useState('');
  const groups = state.optionSpace;

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const group: ParentGroup = { id: uid('p'), name };
    update((prev) => ({ ...prev, optionSpace: [...prev.optionSpace, group] }));
    setDraft('');
  };

  const remove = (id: string) => {
    update((prev) => ({
      ...prev,
      optionSpace: prev.optionSpace.filter((g) => g.id !== id),
      subgroups: prev.subgroups.filter((s) => s.parentGroupId !== id),
      beachheadId: prev.subgroups.find((s) => s.id === prev.beachheadId)?.parentGroupId === id
        ? null : prev.beachheadId,
    }));
  };

  const tooFew = groups.length < 3;

  // Sprint 3 T2 — fire a one-shot acknowledgment card the moment the founder
  // crosses 5 groups. Yields back to the static voice after a short interval
  // so we stay within the one-card-at-a-time rule from Sprint 1 T4.
  const [showAck, setShowAck] = useState(false);
  const prevCountRef = useRef(groups.length);
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = groups.length;
    if (prev < 5 && groups.length >= 5) {
      setShowAck(true);
      const t = setTimeout(() => setShowAck(false), 6000);
      return () => clearTimeout(t);
    }
  }, [groups.length]);

  const reactiveShowing = (tooFew && groups.length > 0) || showAck;

  return (
    <StepFrame stepId="l8.1" title="List all the groups who might need this product." suppressVoice={reactiveShowing}>
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Cast wide — we'll narrow later. Three or more is the minimum that's worth scoring;
        five or more usually surfaces a beachhead you wouldn't have guessed.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="e.g. Solo consultants"
          style={{
            flex: 1, padding: '10px 12px',
            border: `1px solid ${TAN}`, borderRadius: 6,
            fontSize: 14, fontFamily: 'inherit', color: INK,
            background: '#fff', outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          style={{
            padding: '10px 16px', background: INK, color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            opacity: draft.trim() ? 1 : 0.5, fontFamily: 'inherit',
          }}
        >Add group</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
        {groups.map((g) => (
          <li key={g.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 6,
            border: `1px solid ${TAN}`, background: '#fff',
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 14, color: INK }}>{g.name}</span>
            <button
              type="button"
              onClick={() => remove(g.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 16, color: SLATE_FG, opacity: 0.6,
              }}
              aria-label={`Remove ${g.name}`}
            >×</button>
          </li>
        ))}
        {groups.length === 0 && (
          <li style={{
            padding: '14px', textAlign: 'center', color: MUTED,
            border: `1px dashed ${STONE}`, borderRadius: 6,
            fontSize: 13, fontStyle: 'italic',
          }}>No groups yet — start typing above.</li>
        )}
      </ul>

      {showAck && (
        <div style={{ marginBottom: 20 }} aria-live="polite">
          <MentorCallout body={fiveGroupsAck()} italic />
        </div>
      )}

      {!showAck && tooFew && groups.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <MentorCallout
            tone="amber"
            body={fewGroupsWarning(groups.length)}
          />
        </div>
      )}

      <NavRow
        onBack={null}
        onNext={() => goTo('l8.2')}
        nextLabel={tooFew && groups.length > 0 ? "I'm good — continue anyway →" : 'Continue → sub-divide'}
        disabled={groups.length === 0}
      />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L8.2 — Sub-divide each group
// ──────────────────────────────────────────────────────────────────

export function Step8_2({ state, update, goTo }: StepProps) {
  const groups = state.optionSpace;
  const subsByParent = useMemo(() => {
    const m: Record<string, SubGroup[]> = {};
    for (const sg of state.subgroups) {
      (m[sg.parentGroupId] ||= []).push(sg);
    }
    return m;
  }, [state.subgroups]);

  const addSub = (parentId: string, name: string) => {
    if (!name.trim()) return;
    const sg: SubGroup = {
      id: uid('sg'), parentGroupId: parentId,
      name: name.trim(), pain: null, reachability: null, size: null,
    };
    update((prev) => ({ ...prev, subgroups: [...prev.subgroups, sg] }));
  };

  const removeSub = (id: string) =>
    update((prev) => ({
      ...prev,
      subgroups: prev.subgroups.filter((s) => s.id !== id),
      beachheadId: prev.beachheadId === id ? null : prev.beachheadId,
    }));

  const setIndivisible = (parentId: string, justification: string) => {
    const stub: SubGroup = {
      id: uid('sg'), parentGroupId: parentId,
      name: `(indivisible)`, pain: null, reachability: null, size: null,
      indivisibleJustification: justification,
    };
    update((prev) => ({
      ...prev,
      subgroups: [...prev.subgroups.filter((s) => s.parentGroupId !== parentId), stub],
    }));
  };

  return (
    <StepFrame stepId="l8.2" title="Break each group into two or three smaller groups.">
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Same product, very different buyer. Useful slicing axes: demographic, situation,
        channel you can reach them on, urgency, budget, role.
      </p>

      {groups.length === 0 && (
        <div style={{
          padding: 20, textAlign: 'center', color: MUTED,
          border: `1px dashed ${STONE}`, borderRadius: 6,
          fontStyle: 'italic',
        }}>Add groups in L8.1 first.</div>
      )}

      {groups.map((g) => (
        <ParentGroupSubdivideRow
          key={g.id}
          parent={g}
          subs={subsByParent[g.id] ?? []}
          onAdd={(n) => addSub(g.id, n)}
          onRemove={removeSub}
          onMarkIndivisible={(j) => setIndivisible(g.id, j)}
        />
      ))}

      <NavRow
        onBack={() => goTo('l8.1')}
        onNext={() => goTo('l8.3')}
        nextLabel="Continue → triple filter"
        disabled={state.subgroups.length === 0}
      />
    </StepFrame>
  );
}

function ParentGroupSubdivideRow({
  parent, subs, onAdd, onRemove, onMarkIndivisible,
}: {
  parent: ParentGroup;
  subs: SubGroup[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onMarkIndivisible: (justification: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [indivisibleMode, setIndivisibleMode] = useState(false);
  const [justification, setJustification] = useState('');

  const indivisible = subs.find((s) => s.indivisibleJustification);

  return (
    <div style={{
      padding: 16, marginBottom: 16,
      border: `1px solid ${TAN}`, borderRadius: 8,
      background: '#fff',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 600, color: INK,
        }}>{parent.name}</h3>
        {!indivisible && (
          <button
            type="button"
            onClick={() => setIndivisibleMode((v) => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 11, color: SLATE_FG, fontFamily: FONT_MONO,
              letterSpacing: '0.04em', textDecoration: 'underline',
            }}
          >{indivisibleMode ? 'cancel' : 'mark indivisible…'}</button>
        )}
      </div>

      {indivisible ? (
        <div style={{
          padding: 10, borderRadius: 4, background: PAPER,
          fontSize: 13, color: SLATE_FG, fontStyle: 'italic',
        }}>
          <strong style={{ color: INK }}>Indivisible:</strong> {indivisible.indivisibleJustification}
          <button
            type="button"
            onClick={() => onRemove(indivisible.id)}
            style={{
              marginLeft: 10, background: 'transparent', border: 'none',
              cursor: 'pointer', color: SLATE_FG, fontSize: 11,
              textDecoration: 'underline', fontFamily: FONT_MONO,
            }}
          >undo</button>
        </div>
      ) : indivisibleMode ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="One sentence: why is this group truly uniform?"
            style={{
              flex: 1, padding: '8px 10px', border: `1px solid ${TAN}`,
              borderRadius: 4, fontSize: 13, fontFamily: 'inherit',
              background: '#fff',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (justification.trim().length >= 10) {
                onMarkIndivisible(justification.trim());
                setIndivisibleMode(false); setJustification('');
              }
            }}
            disabled={justification.trim().length < 10}
            style={{
              padding: '8px 14px', background: INK, color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500,
              cursor: justification.trim().length >= 10 ? 'pointer' : 'not-allowed',
              opacity: justification.trim().length >= 10 ? 1 : 0.5,
              fontFamily: 'inherit',
            }}
          >Lock</button>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px 0' }}>
            {subs.map((s) => (
              <li key={s.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 4,
                background: PAPER, marginBottom: 4, fontSize: 13, color: INK,
              }}>
                <span>{s.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: SLATE_FG, opacity: 0.6,
                  }}
                  aria-label={`Remove ${s.name}`}
                >×</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onAdd(draft); setDraft(''); }
              }}
              placeholder={`Sub-group of "${parent.name}"`}
              style={{
                flex: 1, padding: '8px 10px', border: `1px solid ${TAN}`,
                borderRadius: 4, fontSize: 13, fontFamily: 'inherit',
                background: '#fff',
              }}
            />
            <button
              type="button"
              onClick={() => { onAdd(draft); setDraft(''); }}
              disabled={!draft.trim()}
              style={{
                padding: '8px 12px', background: 'transparent',
                border: `1px solid ${TAN}`, borderRadius: 4,
                fontSize: 12, color: INK, fontFamily: 'inherit',
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
                opacity: draft.trim() ? 1 : 0.5,
              }}
            >Add</button>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// L8.3 — Triple filter scoring grid
// ──────────────────────────────────────────────────────────────────

export function Step8_3({ state, update, goTo }: StepProps) {
  const scored = state.subgroups
    .filter((s) => !s.indivisibleJustification)
    .map((sg) => ({ sg, raw: computeBeachheadScore(sg) }));
  const topScore = scored.reduce<number>((m, x) => Math.max(m, x.raw ?? 0), 0);

  const grouped = state.optionSpace
    .map((p) => ({ parent: p, rows: scored.filter(({ sg }) => sg.parentGroupId === p.id) }))
    .filter((g) => g.rows.length > 0);

  const setField = (id: string, patch: Partial<SubGroup>) => {
    update((prev) => ({
      ...prev,
      subgroups: prev.subgroups.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const setBeachhead = (id: string) =>
    update((prev) => ({ ...prev, beachheadId: prev.beachheadId === id ? null : id }));

  return (
    <StepFrame stepId="l8.3" title="Score each sub-group on the triple filter.">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {state.optionSpace.map((p) => {
          const count = state.subgroups.filter((s) => s.parentGroupId === p.id && !s.indivisibleJustification).length;
          if (count === 0) return null;
          return <ParentChip key={p.id} name={p.name} count={count} />;
        })}
      </div>

      {/* Grid header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1.5fr 1.5fr 1.4fr 1.2fr 48px',
        gap: 14, padding: '10px 14px',
        border: `1px solid ${TAN}`, borderBottom: 'none',
        borderRadius: '8px 8px 0 0', background: '#fff',
        fontFamily: FONT_MONO, fontSize: 10,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        fontWeight: 600, color: SLATE_FG,
      }}>
        <span>Sub-group</span>
        <span>Pain <span style={{ color: TEAL }}>×3</span></span>
        <span>Reachability <span style={{ color: TEAL }}>×2</span></span>
        <span>Size <span style={{ color: MUTED }}>×1</span></span>
        <span>Beachhead score</span>
        <span style={{ textAlign: 'right' }}>Pick</span>
      </div>

      {/* Grouped rows */}
      <div style={{
        border: `1px solid ${TAN}`, borderRadius: '0 0 8px 8px',
        background: '#fff', overflow: 'visible',
      }}>
        {grouped.length === 0 && (
          <div style={{
            padding: 20, textAlign: 'center', color: MUTED,
            fontStyle: 'italic',
          }}>No scoreable sub-groups yet. Go back to L8.2.</div>
        )}
        {grouped.map((g, gi) => (
          <div key={g.parent.id}>
            <div style={{
              padding: '6px 14px', fontFamily: FONT_MONO, fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              fontWeight: 600, color: MUTED,
              borderTop: `1px solid ${HAIR}`, background: PAPER,
            }}>{g.parent.name}</div>
            {g.rows.map(({ sg, raw }, ri) => {
              const isBeachhead = state.beachheadId === sg.id;
              const isTop = raw != null && raw === topScore && topScore > 0;
              return (
                <div key={sg.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.5fr 1.5fr 1.4fr 1.2fr 48px',
                  gap: 14, padding: '12px 14px',
                  alignItems: 'center', borderTop: `1px solid ${HAIR}`,
                  background: isBeachhead ? TEAL_LITE : (gi + ri) % 2 === 0 ? '#fff' : '#fcfaf5',
                  borderLeft: isBeachhead ? `3px solid ${TEAL}` : '3px solid transparent',
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, color: INK, fontWeight: 500 }}>{sg.name}</div>
                    {isTop && (
                      <div style={{
                        fontFamily: FONT_MONO, fontSize: 9.5, color: TEAL,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        fontWeight: 700, marginTop: 2,
                      }}>★ top-scored</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {PAIN_OPTIONS.map((o) => (
                      <PillOption key={o.value} selected={sg.pain === o.value}
                        label={o.label} tip={o.tip}
                        onClick={() => setField(sg.id, { pain: sg.pain === o.value ? null : o.value })}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {REACH_OPTIONS.map((o) => (
                      <PillOption key={o.value} selected={sg.reachability === o.value}
                        label={o.label} tip={o.tip}
                        onClick={() => setField(sg.id, { reachability: sg.reachability === o.value ? null : o.value })}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {SIZE_OPTIONS.map((o) => (
                      <PillOption key={o.value} selected={sg.size === o.value}
                        label={o.label} tip={o.tip}
                        onClick={() => setField(sg.id, { size: sg.size === o.value ? null : o.value })}
                      />
                    ))}
                  </div>
                  <ScoreBar raw={raw} normalized={normalizedScore(raw)} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <BeachheadRadio
                      selected={isBeachhead}
                      label={sg.name}
                      onToggle={() => setBeachhead(sg.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <NavRow
        onBack={() => goTo('l8.2')}
        onNext={() => goTo('l8.4')}
        nextLabel="Continue → lock beachhead"
      />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L8.4 — Lock the beachhead
// ──────────────────────────────────────────────────────────────────

export function Step8_4({ state, update, goTo, saveLayer }: StepProps) {
  const beach = state.subgroups.find((s) => s.id === state.beachheadId)
    ?? topRankedSubgroup(state.subgroups);

  const lockAndContinue = async () => {
    if (!beach) return;
    if (state.beachheadId !== beach.id) {
      update((prev) => ({ ...prev, beachheadId: beach.id }));
    }
    // Write the beachhead name into customerSegment.claim_text — tier/gate
    // machinery picks it up unchanged.
    await saveLayer('customerSegment', {
      claim_text: beach.name,
      source_value: state.draftSources.customerSegment ?? 'experience',
    });
    goTo('l9.1');
  };

  return (
    <StepFrame stepId="l8.4" title="Lock the beachhead and write the why.">
      {beach ? (
        <>
          <div style={{
            padding: 16, marginBottom: 16,
            border: `2px solid ${TEAL}`, background: TEAL_LITE,
            borderRadius: 8,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: TEAL,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              fontWeight: 700, marginBottom: 6,
            }}>Selected beachhead</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: INK }}>{beach.name}</div>
          </div>
          <label style={{
            display: 'block', marginBottom: 8,
            fontFamily: FONT_MONO, fontSize: 10.5, color: SLATE_FG,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
          }}>Why this one? (one sentence)</label>
          <textarea
            value={state.beachheadJustification}
            onChange={(e) => update({ beachheadJustification: e.target.value })}
            placeholder='e.g. "I am one. I know what the problem feels like. I can find 50 of them on Reddit by Friday."'
            style={{
              width: '100%', minHeight: 80, padding: '10px 12px',
              border: `1px solid ${TAN}`, borderRadius: 6,
              fontSize: 13.5, lineHeight: 1.55, fontFamily: 'inherit',
              color: INK, background: '#fff', resize: 'vertical', outline: 'none',
              marginBottom: 16,
            }}
          />
          <StepSourcePicker layerId="customerSegment" state={state} update={update} />
          <NavRow
            onBack={() => goTo('l8.3')}
            onNext={lockAndContinue}
            nextLabel="Lock beachhead → L9 Problem"
          />
        </>
      ) : (
        <div style={{
          padding: 20, textAlign: 'center', color: MUTED, fontStyle: 'italic',
          border: `1px dashed ${STONE}`, borderRadius: 6,
        }}>Score at least one sub-group in L8.3 first.</div>
      )}
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L9.1 — Restate the problem for the beachhead
// ──────────────────────────────────────────────────────────────────

export function Step9_1({ state, update, goTo, saveLayer }: StepProps) {
  const onNext = async () => {
    if (state.l9.problemRestated.trim()) {
      await saveLayer('problem', {
        claim_text: state.l9.problemRestated.trim(),
        source_value: state.draftSources.problem ?? 'experience',
      });
    }
    goTo('l9.2');
  };

  return (
    <StepFrame stepId="l9.1" title="What's the specific problem causing the pain?">
      <BeachheadFixedHeader state={state} />
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Not the general problem — the one this sub-group experiences. Be specific to a moment,
        an artifact, a workaround.
      </p>
      <textarea
        value={state.l9.problemRestated}
        onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, problemRestated: e.target.value } }))}
        placeholder="What does your beachhead actually do on Monday morning that makes this suck?"
        style={{
          width: '100%', minHeight: 140, padding: '12px 14px',
          border: `1px solid ${TAN}`, borderRadius: 6,
          fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit',
          color: INK, background: '#fff', resize: 'vertical', outline: 'none',
          marginBottom: 16,
        }}
      />
      <StepSourcePicker layerId="problem" state={state} update={update} />
      <NavRow onBack={() => goTo('l8.4')} onNext={onNext} nextLabel="Continue → pain scale" />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L11 (step l9.2) — Pain scale: 1 required primary pain + up to 2 more
// ──────────────────────────────────────────────────────────────────
//
// Reads/writes flow through the stable multi-pain model in lib/doorAState
// (getPains / getPrimaryPain / addPain / editPain / promotePrimary /
// deletePain). Each pain carries its own text, severity, and evidence star;
// the layer's star is the MIN evidence across pains (painLayerEvidenceStar) so
// a strong primary can't mask a weak secondary. Only the primary is required.

function PainRow({
  pain, label, attemptedAdvance, onText, onSeverity, onEvidence, onMakePrimary, onDelete,
}: {
  pain: Pain;
  label: string;
  /** A blocked Continue happened — flag the primary's empty text. */
  attemptedAdvance: boolean;
  onText: (text: string) => void;
  onSeverity: (severity: PainSeverity) => void;
  onEvidence: (star: EvidenceStar) => void;
  onMakePrimary: () => void;
  onDelete: () => void;
}) {
  const primary = pain.isPrimary;
  // Only the primary pain is required; flag empty text after a blocked advance.
  const invalid = primary && attemptedAdvance && pain.text.trim().length === 0;
  return (
    <div style={{
      padding: 16, marginBottom: 12, borderRadius: 8, background: '#fff',
      border: `1px solid ${primary ? TEAL : TAN}`,
      borderLeft: `3px solid ${primary ? TEAL : TAN}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, marginBottom: 10,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', fontWeight: 700,
          color: primary ? TEAL : MUTED,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span>{label}</span>
          {primary && (
            <>
              <span aria-hidden style={{ color: STONE }}>·</span>
              <span>Primary</span>
              <span aria-hidden style={{ color: STONE }}>·</span>
              <span style={{ color: AMBER_FG }}>Required</span>
            </>
          )}
        </span>
        {/* Non-primary rows carry make-primary + delete; the primary carries
            neither (deletePain refuses the primary while others exist — promote
            another first). */}
        {!primary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onMakePrimary}
              style={{
                background: 'transparent', border: `1px solid ${TAN}`,
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600, color: SLATE_FG,
              }}
            >Make primary</button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${label}`}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 16, color: SLATE_FG, opacity: 0.6, lineHeight: 1,
              }}
            >×</button>
          </div>
        )}
      </div>

      <input
        value={pain.text}
        onChange={(e) => onText(e.target.value)}
        placeholder={primary
          ? 'The one pain this venture exists to kill…'
          : 'Another pain worth noting (optional)…'}
        aria-label={`${label} description`}
        aria-invalid={invalid}
        style={{
          width: '100%', padding: '10px 12px',
          border: `1px solid ${invalid ? AMBER_FG : TAN}`, borderRadius: 6,
          fontSize: 14, fontFamily: 'inherit', color: INK,
          background: '#fff', outline: 'none', marginBottom: 14,
        }}
      />

      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
          marginBottom: 8,
        }}>Severity</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {SEVERITY_OPTIONS.map((o) => (
            <PillOption
              key={o.value}
              selected={pain.severity === o.value}
              label={o.label}
              tip={o.tip}
              onClick={() => onSeverity(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Evidence reuses the "How do you know?" SourcePicker; the picked source
          maps 1:1 onto this pain's evidence star (★1 logical → ★5 prototype). */}
      <SourcePicker
        value={sourceForStar(pain.evidenceStar)}
        layerId="painScale"
        onChange={(src) => { if (src) onEvidence(starForSource(src)); }}
      />
    </div>
  );
}

export function Step9_2({ state, update, goTo, saveLayer, createDirectAssumption }: StepProps) {
  const pains = getPains(state);
  const primary = getPrimaryPain(state);
  const minStar = painLayerEvidenceStar(state);
  const [attemptedAdvance, setAttemptedAdvance] = useState(false);

  // Always land on at least one (blank) primary pain so the required row is
  // present to type into. Idempotent + StrictMode-safe: the guard runs inside
  // the functional updater, so a double-invoked effect can't mint two pains.
  useEffect(() => {
    update((prev) => (prev.pains.length === 0
      ? addPain(prev, { text: '', severity: 'med', evidenceStar: 1 })
      : prev));
  }, [update]);

  // Keep the layer's staged source in lockstep with the live roll-up
  // (MIN evidence star), so the StepRail / foundation counter show the same
  // star this step will persist on Continue. Guarded to avoid a write loop.
  useEffect(() => {
    if (pains.length === 0) return;
    const src = sourceForStar(minStar as EvidenceStar);
    if (state.draftSources.painScale !== src) {
      update((prev) => ({
        ...prev,
        draftSources: { ...prev.draftSources, painScale: src },
      }));
    }
  }, [minStar, pains.length, state.draftSources.painScale, update]);

  const primaryText = primary?.text.trim() ?? '';
  const remaining = MAX_PAINS - pains.length;
  const tooStrong = primary?.severity === 'high';

  const onNext = async () => {
    // Only the primary pain gates the step. Pains 2 & 3 are nudge-not-block.
    if (primaryText.length === 0) {
      setAttemptedAdvance(true);
      return;
    }
    setAttemptedAdvance(false);

    const moreCount = pains.length - 1;
    const claim = moreCount > 0
      ? `${primaryText} (+${moreCount} more pain${moreCount === 1 ? '' : 's'})`
      : primaryText;
    await saveLayer('painScale', {
      claim_text: claim.slice(0, 500),
      // L11 roll-up: the weakest pain's evidence sets the layer star.
      source_value: sourceForStar((minStar || 1) as EvidenceStar),
    });

    // Preserve the "everybody says it's the worst" guard-rail: a High-severity
    // primary becomes an explicit Discovery target.
    if (primary && primary.severity === 'high') {
      try {
        await createDirectAssumption({
          layerId: 'painScale',
          text: `Pain is High-severity for the beachhead: "${primaryText.slice(0, 200)}"`,
          notes: 'Auto-queued from L11 — needs 5 interviews in the beachhead to validate.',
        });
      } catch {
        // Best-effort; never block navigation on an assumption-write failure.
      }
    }
    goTo('l9.3');
  };

  return (
    <StepFrame stepId="l9.2" title="What's the pain — and how do you know?" voicePosition="inline">
      <BeachheadFixedHeader state={state} />
      {!tooStrong && (
        <div style={{ marginBottom: 18 }}>
          <MentorCallout body={lookupStepVoice('l9.2')} italic />
        </div>
      )}
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Lead with the one pain this venture exists to kill — that's the primary, and the only
        one you must fill in. Add up to two more if your beachhead carries them; each pain gets
        its own severity and its own evidence.
      </p>

      {pains.map((p) => (
        <PainRow
          key={p.id}
          pain={p}
          label={painLabel(p)}
          attemptedAdvance={attemptedAdvance}
          onText={(text) => update((prev) => editPain(prev, p.id, { text }))}
          onSeverity={(severity) => update((prev) => editPain(prev, p.id, { severity }))}
          onEvidence={(evidenceStar) => update((prev) => editPain(prev, p.id, { evidenceStar }))}
          onMakePrimary={() => update((prev) => promotePrimary(prev, p.id))}
          onDelete={() => update((prev) => deletePain(prev, p.id))}
        />
      ))}

      {/* Add-a-pain — enabled while there's a free slot (≤ MAX_PAINS). */}
      <button
        type="button"
        onClick={() => {
          if (pains.length < MAX_PAINS) {
            update((prev) => addPain(prev, { text: '', severity: 'med', evidenceStar: 1 }));
          }
        }}
        disabled={remaining <= 0}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '9px 14px', marginBottom: 18,
          background: 'transparent',
          border: `1px dashed ${remaining > 0 ? TEAL : STONE}`,
          borderRadius: 8, cursor: remaining > 0 ? 'pointer' : 'not-allowed',
          opacity: remaining > 0 ? 1 : 0.55, fontFamily: 'inherit',
          color: remaining > 0 ? INK : MUTED, fontSize: 13, fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, color: remaining > 0 ? TEAL : MUTED }}>+</span>
        Add a pain
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED, letterSpacing: '0.06em',
        }}>
          {remaining > 0
            ? `${remaining} slot${remaining === 1 ? '' : 's'} left · ${MAX_PAINS} max`
            : `${MAX_PAINS} max`}
        </span>
      </button>

      {/* Layer roll-up readout — the weakest pain sets the L11 star. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
        padding: '10px 14px', marginBottom: 18, borderRadius: 6,
        background: PAPER, border: `1px solid ${TAN}`,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, color: SLATE_FG,
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
        }}>Evidence strength</span>
        <span aria-label={`Evidence strength ${minStar} of 5`} style={{
          fontFamily: FONT_MONO, fontSize: 13,
          color: minStar >= 2 ? TEAL : MUTED, letterSpacing: '0.06em',
        }}>{'★'.repeat(minStar)}{'☆'.repeat(5 - minStar)}</span>
        <span style={{ fontSize: 12, color: MUTED }}>
          your weakest pain&apos;s evidence — a strong primary won&apos;t mask a thin secondary
        </span>
      </div>

      {tooStrong && (
        <div style={{ marginBottom: 16 }}>
          <MentorCallout
            tone="amber"
            body="Everybody rates their main pain High the first time. About one in twenty actually has a High-severity problem. We'll queue this as a Discovery assumption to test against 5 interviews in your beachhead."
          />
        </div>
      )}

      {attemptedAdvance && primaryText.length === 0 && (
        <div role="alert" style={{
          marginBottom: 14, padding: '10px 12px', borderRadius: 6,
          background: AMBER_SOFT, border: `1px solid ${AMBER_FG}`,
          fontSize: 12.5, color: AMBER_FG, lineHeight: 1.45,
        }}>
          Name the primary pain before continuing — it&apos;s the one required field on this
          step. Pains 2 and 3 are optional.
        </div>
      )}

      <NavRow onBack={() => goTo('l9.1')} onNext={onNext} nextLabel="Continue → solution" />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L09 (step l9.3) — Pain-anchored solution
// ──────────────────────────────────────────────────────────────────
//
// The solution ANSWERS the L11 pains: one row per pain (read via getPains in
// stable order, keyed by stable painId — never index/text). Each row pairs the
// read-only pain with a solution input + its own evidence, and renders the
// derived assumption inline. An unaddressed pain is a visible dashed gap, never
// hidden. L09 has NO hard gate — the primary-pain gate already lives at L11
// (l9.2) — so Continue stays live even with coverage gaps.

/** "L09 · Solution"-style badge for a layer id, read from the canonical layer
 *  config so it stays in lockstep with the StepRail's layer labels. */
function layerBadgeLabel(layerId: string): string {
  const L = PK_LAYER_BY_ID[layerId];
  return L ? `L${String(L.n).padStart(2, '0')} · ${L.name}` : layerId;
}

const solutionInputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: `1px solid ${TAN}`, borderRadius: 6,
  fontSize: 14, fontFamily: 'inherit', color: INK,
  background: '#fff', outline: 'none',
};

function SolutionRowCard({
  pain, label, row, segment, onText, onEvidence,
}: {
  pain: Pain;
  label: string;
  row: SolutionRow | undefined;
  segment: string;
  onText: (text: string) => void;
  onEvidence: (star: EvidenceStar) => void;
}) {
  const primary = pain.isPrimary;
  const solutionText = row?.solutionText ?? '';
  const filled = solutionText.trim().length > 0;
  // Pains live in the L11 pain-scale collection, so every row's source layer is
  // L11 · Pain Scale (the model carries no discrete L10/Problem pains yet).
  const derived = deriveAssumption({ segment, pain, solution: row });

  return (
    <div style={{
      padding: 16, marginBottom: 12, borderRadius: 8,
      background: filled ? '#fff' : PAPER,
      border: filled ? `1px solid ${primary ? TEAL : TAN}` : `1px dashed ${STONE}`,
      borderLeft: filled ? `3px solid ${primary ? TEAL : TAN}` : `3px dashed ${STONE}`,
    }}>
      {/* Read-only pain header: PAIN-N · source layer · Primary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', fontWeight: 700, color: primary ? TEAL : MUTED,
        }}>{label}</span>
        <span aria-hidden style={{ color: STONE }}>·</span>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: MUTED,
        }}>{layerBadgeLabel('painScale')}</span>
        {primary && (
          <>
            <span aria-hidden style={{ color: STONE }}>·</span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 700, color: TEAL,
            }}>Primary</span>
          </>
        )}
      </div>
      <p style={{
        margin: 0, marginBottom: 12, fontSize: 14, lineHeight: 1.5, fontWeight: 500,
        color: pain.text.trim() ? INK : MUTED,
      }}>
        {pain.text.trim() || 'Unnamed pain — name it on L11.'}
      </p>

      {/* Solution input — always present so any pain can be addressed here. */}
      <input
        value={solutionText}
        onChange={(e) => onText(e.target.value)}
        placeholder={primary
          ? 'How does the product kill this pain for the beachhead?'
          : 'How does the product address this pain? (optional)'}
        aria-label={`Solution for ${label}`}
        style={{ ...solutionInputStyle, marginBottom: filled ? 14 : 10 }}
      />

      {filled ? (
        <>
          {/* Evidence reuses the same "How do you know?" SourcePicker as the
              pain screen; the picked source maps 1:1 onto this solution's star. */}
          <SourcePicker
            value={sourceForStar(row?.evidenceStar ?? 1)}
            layerId="painScale"
            onChange={(src) => { if (src) onEvidence(starForSource(src)); }}
          />
          {derived && (
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 6,
              background: TEAL_LITE, border: `1px solid ${TEAL}`,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 700, color: TEAL, marginBottom: 4,
              }}>Derived assumption</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: INK }}>{derived.text}</div>
            </div>
          )}
        </>
      ) : (
        <div role="note" style={{
          fontSize: 12.5, color: MUTED, fontStyle: 'italic', lineHeight: 1.4,
        }}>
          no solution mapped yet — this pain is unaddressed
        </div>
      )}
    </div>
  );
}

/** Coverage nudge (never a gate): N of M beachhead pains addressed + a segmented
 *  bar, one segment per pain in order, filled when that pain has a solution. */
function CoverageStrip({ segments }: { segments: boolean[] }) {
  const total = segments.length;
  const addressed = segments.filter(Boolean).length;
  return (
    <div style={{
      marginBottom: 18, padding: '10px 14px', borderRadius: 6,
      background: PAPER, border: `1px solid ${TAN}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 10, marginBottom: 8,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, color: SLATE_FG,
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
        }}>Coverage</span>
        <span style={{ fontSize: 12.5, color: addressed === total ? TEAL : MUTED }}>
          {addressed} of {total} beachhead pain{total === 1 ? '' : 's'} addressed
        </span>
      </div>
      <div
        role="img"
        aria-label={`${addressed} of ${total} beachhead pains addressed`}
        style={{ display: 'flex', gap: 6 }}
      >
        {segments.map((on, i) => (
          <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: on ? TEAL : TAN }} />
        ))}
      </div>
    </div>
  );
}

export function Step9_3({ state, update, goTo, saveLayer }: StepProps) {
  const pains = getPains(state);
  const segment = beachheadSegmentLabel(state);
  const segments = pains.map(
    (p) => (getSolutionRow(state, p.id)?.solutionText ?? '').trim().length > 0,
  );

  // Keep the persisted derived-assumption snapshot in lockstep with the live
  // pains + rows + segment — the same guarded pattern Step9_2 uses to sync
  // draftSources. Returning `prev` unchanged when nothing moved makes this a
  // no-op (update() skips the autosave on an identical blob), so no write loop;
  // derivedAssumptions itself is deliberately NOT a dependency.
  useEffect(() => {
    update((prev) => {
      const next = rebuildDerivedAssumptions(prev, beachheadSegmentLabel(prev));
      return JSON.stringify(prev.derivedAssumptions) === JSON.stringify(next)
        ? prev
        : { ...prev, derivedAssumptions: next };
    });
  }, [state.pains, state.solutionRows, state.subgroups, state.beachheadId, update]);

  const onNext = async () => {
    // L09 has NO hard gate. Persist a layer claim only when there's content,
    // and navigate regardless of coverage gaps.
    const claim = solutionLayerClaim(state);
    if (claim) {
      await saveLayer('solution', {
        claim_text: claim.slice(0, 500),
        source_value: state.draftSources.solution ?? 'experience',
      });
    }
    goTo('l9.4');
  };

  return (
    <StepFrame stepId="l9.3" title="How does your solution answer each pain?">
      <BeachheadFixedHeader state={state} />

      {/* Optional one-line summary — carries the existing free-text value. */}
      <div style={{ marginBottom: 20 }}>
        <label
          htmlFor="solution-summary"
          style={{
            display: 'block', marginBottom: 6,
            fontFamily: FONT_MONO, fontSize: 10.5, color: '#64748b',
            letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
          }}
        >
          Describe your solution <span style={{ color: MUTED, fontWeight: 500 }}>· optional summary</span>
        </label>
        <input
          id="solution-summary"
          value={state.l9.solution}
          onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, solution: e.target.value } }))}
          placeholder="One line: what does the product do for this beachhead?"
          style={solutionInputStyle}
        />
      </div>

      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0, marginBottom: 18 }}>
        Answer each pain from L11 with the solution that kills it. The primary pain leads;
        secondary pains are worth answering but optional. Every answered pain becomes a
        derived assumption you&apos;ll test later.
      </p>

      {pains.length === 0 ? (
        <div role="note" style={{
          padding: '12px 14px', marginBottom: 18, borderRadius: 6,
          background: AMBER_SOFT, border: `1px solid ${AMBER_FG}`,
          fontSize: 12.5, color: AMBER_FG, lineHeight: 1.45,
        }}>
          No pains yet — name at least your primary pain on <strong>L11</strong> before mapping solutions.
        </div>
      ) : (
        <>
          {pains.map((p) => (
            <SolutionRowCard
              key={p.id}
              pain={p}
              label={painLabel(p)}
              row={getSolutionRow(state, p.id)}
              segment={segment}
              onText={(text) => update((prev) => setSolutionRow(prev, p.id, { solutionText: text }))}
              onEvidence={(evidenceStar) => update((prev) => setSolutionRow(prev, p.id, { evidenceStar }))}
            />
          ))}
          <CoverageStrip segments={segments} />
        </>
      )}

      <StepSourcePicker layerId="solution" state={state} update={update} />
      <NavRow
        onBack={() => goTo('l9.2')}
        onNext={onNext}
        nextLabel="Continue → adoption cost"
      />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L9.4 — Adoption cost + close-call detection
// ──────────────────────────────────────────────────────────────────

const VERDICT_OPTIONS: { value: AdoptionVerdict; label: string }[] = [
  { value: 'clearly-worth-it',  label: 'Clearly worth it' },
  { value: 'probably-worth-it', label: 'Probably worth it' },
  { value: 'close-call',        label: 'Close call' },
];

export function Step9_4({ state, update, goTo, createDirectAssumption }: StepProps) {
  const closeCall = isCloseCall(state.l9);
  const warning = lookupStepWarning('l9.4.close_call');
  const reactiveShowing = closeCall && Boolean(warning);

  // Sprint 3 T5 — required-field validation on Continue. Verdict is required;
  // the one-liners are flagged when blank but not hard-blocking (founder may
  // legitimately not have a tight one-line read yet).
  const [attemptedAdvance, setAttemptedAdvance] = useState(false);
  const verdictMissing = state.l9.verdict === null;
  const benefitMissing = state.l9.benefitOneLine.trim().length === 0;
  const costMissing = state.l9.costOneLine.trim().length === 0;
  const showValidation = attemptedAdvance && (verdictMissing || benefitMissing || costMissing);

  const onAdvance = async () => {
    if (verdictMissing) {
      setAttemptedAdvance(true);
      return;
    }
    setAttemptedAdvance(false);
    // Sprint 3 T11 — queue the close-call Discovery assumption here, on advance,
    // rather than from an effect that fired the instant the verdict was picked.
    // The old effect read benefit/cost *before* the founder had typed them and a
    // ref guard then blocked it from ever re-queuing with the real text — so the
    // assumption permanently read "(unstated)". Reading the values at advance
    // time captures whatever the founder actually entered, and mirrors the L9.2
    // critical-pain queue-on-continue pattern.
    if (state.l9.verdict === 'close-call') {
      const benefit = state.l9.benefitOneLine.trim();
      const cost = state.l9.costOneLine.trim();
      try {
        await createDirectAssumption({
          layerId: 'solution',
          text: `Adoption cost is a close call: benefit "${benefit || '(unstated)'}" vs cost "${cost || '(unstated)'}"`,
          notes: 'Auto-queued from L9.4 — needs Discovery against beachhead users to verify benefit lands in the first 30 seconds.',
        });
      } catch {
        // Best-effort; never block navigation on assumption-queue failure.
      }
    }
    goTo('l10.1');
  };

  return (
    <StepFrame stepId="l9.4" title="What does the user have to give up to use this?" suppressVoice={reactiveShowing}>
      <BeachheadFixedHeader state={state} />
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Time, money, learning curve, switching from what they use now, telling their team — anything beyond paying.
      </p>
      <textarea
        value={state.l9.adoptionCostNotes}
        onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, adoptionCostNotes: e.target.value } }))}
        placeholder="What does the user have to do or give up beyond paying?"
        style={{
          width: '100%', minHeight: 80, padding: '10px 12px',
          border: `1px solid ${TAN}`, borderRadius: 6,
          fontSize: 13.5, lineHeight: 1.55, fontFamily: 'inherit',
          color: INK, background: '#fff', resize: 'vertical', outline: 'none',
          marginBottom: 16,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{
            display: 'block', marginBottom: 4,
            fontFamily: FONT_MONO, fontSize: 10, color: TEAL,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
          }}>Benefit (one line)</label>
          <input
            value={state.l9.benefitOneLine}
            onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, benefitOneLine: e.target.value } }))}
            placeholder="In the user's terms…"
            aria-invalid={attemptedAdvance && benefitMissing}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${attemptedAdvance && benefitMissing ? AMBER_FG : TAN}`,
              borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: '#fff',
            }}
          />
        </div>
        <div>
          <label style={{
            display: 'block', marginBottom: 4,
            fontFamily: FONT_MONO, fontSize: 10, color: AMBER_FG,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
          }}>Cost (one line)</label>
          <input
            value={state.l9.costOneLine}
            onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, costOneLine: e.target.value } }))}
            placeholder="What the user gives up…"
            aria-invalid={attemptedAdvance && costMissing}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${attemptedAdvance && costMissing ? AMBER_FG : TAN}`,
              borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: '#fff',
            }}
          />
        </div>
      </div>

      <div style={{
        fontFamily: FONT_MONO, fontSize: 10.5, color: SLATE_FG,
        letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
        marginBottom: 8,
      }}>Verdict</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {VERDICT_OPTIONS.map((o) => {
          const on = state.l9.verdict === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => update((prev) => ({ ...prev, l9: { ...prev.l9, verdict: on ? null : o.value } }))}
              style={{
                padding: '10px 14px', borderRadius: 6, fontFamily: 'inherit',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `2px solid ${on ? TEAL : TAN}`,
                background: on ? TEAL_LITE : '#fff', color: INK,
              }}
            >{o.label}</button>
          );
        })}
      </div>

      {closeCall && warning && (
        <div style={{ marginBottom: 16 }}>
          <MentorCallout tone="amber" body={
            <>
              {warning}{' '}
              <button
                type="button"
                onClick={() => goTo('l8.4')}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: AMBER_FG, textDecoration: 'underline',
                  fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer',
                }}
              >Revisit beachhead at L8.4 →</button>
            </>
          } />
        </div>
      )}

      {/* Sprint 3 T11 — close-call consequence card.
          MONTY REVIEW — provisional copy below; the L9.2 critical-pain pattern
          is the template (claim → consequence → queued). Replace verbatim if
          Monty rewrites. The assumption is queued on Continue (see onAdvance
          above), capturing the final benefit/cost the founder entered. */}
      {closeCall && (
        <div style={{ marginBottom: 16 }} aria-live="polite">
          <MentorCallout body={
            <>
              <strong>Queued to the assumption stack:</strong>{' '}
              Close-call adoption cost is the most common reason early traction
              fades. We&apos;ll test whether your benefit lands with your beachhead
              in the first thirty seconds.
            </>
          } />
        </div>
      )}

      {showValidation && (
        <div role="alert" style={{
          marginBottom: 14, padding: '10px 12px', borderRadius: 6,
          background: AMBER_SOFT, border: `1px solid ${AMBER_FG}`,
          fontSize: 12.5, color: AMBER_FG, lineHeight: 1.45,
        }}>
          {verdictMissing
            ? 'Pick a verdict before continuing — Clearly worth it, Probably worth it, or Close call.'
            : 'Benefit and Cost one-liners are blank. They\'re how your beachhead will hear the pitch — fill them in or come back to L9.4 later.'}
        </div>
      )}

      <NavRow
        onBack={() => goTo('l9.3')}
        onNext={onAdvance}
        nextLabel="Continue → value chain"
      />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L10.1 — Value chain builder
// ──────────────────────────────────────────────────────────────────

export function Step10_1({ state, update, goTo }: StepProps) {
  const routes = state.l10.routes;
  const multi = routes.length > 1;
  // Role menu open-state is route-scoped: node ids (n-you, n-end…) repeat
  // across lanes, so a bare node id would open the menu in every lane at once.
  const [openRole, setOpenRole] = useState<{ routeId: string; nodeId: string } | null>(null);
  const [hoveredTmpl, setHoveredTmpl] = useState<string | null>(null);

  // The "direct B2C" nudge only applies to a single, direct route. Once a
  // founder adds a second route they've clearly thought about distribution.
  const onlyRoute = routes.length === 1 ? routes[0] : null;
  const isDirectB2C = onlyRoute ? nodesOrderedFn(onlyRoute.chain).length === 2 : false;
  const warning = lookupStepWarning('l10.1.direct_b2c');
  const reactiveShowing = isDirectB2C && Boolean(warning);

  const setRouteChain = (routeId: string, next: ValueChain) =>
    update((prev) => ({
      ...prev,
      l10: {
        ...prev.l10,
        routes: prev.l10.routes.map((r) => (r.id === routeId ? { ...r, chain: next } : r)),
      },
    }));

  const insertBetween = (routeId: string, fromId: string, toId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    const { chain } = route;
    const fromNode = chain.nodes.find((n) => n.id === fromId);
    const toNode = chain.nodes.find((n) => n.id === toId);
    if (!fromNode || !toNode) return;
    const newNode: ChainNodeT = {
      id: uid('n'), label: 'New link', role: 'distributor',
      position: (fromNode.position + toNode.position) / 2, locked: false,
    };
    const renumbered = [...chain.nodes, newNode]
      .sort((a, b) => a.position - b.position)
      .map((n, i) => ({ ...n, position: i }));
    const edges = chain.edges
      .filter((e) => !(e.fromNodeId === fromId && e.toNodeId === toId))
      .concat([
        { fromNodeId: fromId, toNodeId: newNode.id },
        { fromNodeId: newNode.id, toNodeId: toId },
      ]);
    setRouteChain(routeId, { nodes: renumbered, edges });
  };

  const removeNode = (routeId: string, id: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    const { chain } = route;
    const target = chain.nodes.find((n) => n.id === id);
    if (!target || target.locked) return;
    const prevNode = chain.nodes.find((n) => n.position === target.position - 1);
    const nextNode = chain.nodes.find((n) => n.position === target.position + 1);
    const nodesAfter = chain.nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.position > target.position ? { ...n, position: n.position - 1 } : n));
    const filtered = chain.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id);
    const edges = prevNode && nextNode
      ? [...filtered, { fromNodeId: prevNode.id, toNodeId: nextNode.id }]
      : filtered;
    setRouteChain(routeId, { nodes: nodesAfter, edges });
    setOpenRole((c) => (c?.routeId === routeId && c.nodeId === id ? null : c));
  };

  const rename = (routeId: string, id: string, label: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    setRouteChain(routeId, {
      ...route.chain,
      nodes: route.chain.nodes.map((n) => (n.id === id ? { ...n, label: label || n.label } : n)),
    });
  };

  const setRole = (routeId: string, id: string, role: ChainRole) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    setRouteChain(routeId, {
      ...route.chain,
      nodes: route.chain.nodes.map((n) => (n.id === id ? { ...n, role } : n)),
    });
    setOpenRole(null);
  };

  const setEdgeNote = (routeId: string, fromId: string, toId: string, notes: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    const cleaned = notes || undefined;
    const existing = route.chain.edges.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);
    const edges = existing
      ? route.chain.edges.map((e) =>
          e.fromNodeId === fromId && e.toNodeId === toId ? { ...e, notes: cleaned } : e,
        )
      : [...route.chain.edges, { fromNodeId: fromId, toNodeId: toId, notes: cleaned }];
    setRouteChain(routeId, { ...route.chain, edges });
  };

  // Templates load into the primary route, preserving prior single-route
  // behavior. Additional routes are grown by hand with the arrow inserts.
  const loadTemplate = (t: ChainTemplate) => {
    const primaryId = routes[0]?.id;
    if (!primaryId) return;
    const newNodes: ChainNodeT[] = t.chain.map((c, i) => ({
      id: i === 0 ? 'n-you' : i === t.chain.length - 1 ? 'n-end' : uid('n'),
      label: c.label, role: c.role, position: i,
      locked: i === 0 || i === t.chain.length - 1,
    }));
    const edges = newNodes.slice(0, -1).map((n, i) => ({
      fromNodeId: n.id, toNodeId: newNodes[i + 1].id,
    }));
    setRouteChain(primaryId, { nodes: newNodes, edges });
    setOpenRole(null);
  };

  const addRoute = () =>
    update((prev) => ({
      ...prev,
      l10: {
        ...prev.l10,
        routes: [...prev.l10.routes, emptyRoute(uid('route'), `Route ${prev.l10.routes.length + 1}`)],
      },
    }));

  const removeRoute = (routeId: string) => {
    update((prev) => (prev.l10.routes.length <= 1 ? prev : {
      ...prev,
      l10: { ...prev.l10, routes: prev.l10.routes.filter((r) => r.id !== routeId) },
    }));
    setOpenRole((c) => (c?.routeId === routeId ? null : c));
  };

  const renameRoute = (routeId: string, label: string) =>
    update((prev) => ({
      ...prev,
      l10: {
        ...prev.l10,
        routes: prev.l10.routes.map((r) => (r.id === routeId ? { ...r, label: label || r.label } : r)),
      },
    }));

  return (
    <StepFrame stepId="l10.1" title="Where are you in the value chain?" suppressVoice={reactiveShowing}>
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0, marginBottom: 16 }}>
        Between you and the person who ultimately uses what you make, how many steps are there?
        Add a node for each link in the chain. If you reach customers more than one way — say
        direct <em>and</em> through a distributor — add a route for each.
      </p>

      {routes.map((route) => (
        <RouteLane
          key={route.id}
          route={route}
          showChrome={multi}
          openNodeId={openRole?.routeId === route.id ? openRole.nodeId : null}
          onToggleDropdown={(nodeId) => setOpenRole((c) =>
            (c && c.routeId === route.id && c.nodeId === nodeId) ? null : { routeId: route.id, nodeId })}
          onRenameNode={(nodeId, s) => rename(route.id, nodeId, s)}
          onChangeRole={(nodeId, r) => setRole(route.id, nodeId, r)}
          onRemoveNode={(nodeId) => removeNode(route.id, nodeId)}
          onInsert={(fromId, toId) => insertBetween(route.id, fromId, toId)}
          onNoteChange={(fromId, toId, n) => setEdgeNote(route.id, fromId, toId, n)}
          onRenameLane={(label) => renameRoute(route.id, label)}
          onRemoveLane={() => removeRoute(route.id)}
        />
      ))}

      <button
        type="button"
        onClick={addRoute}
        style={{
          marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          border: `1px dashed ${TEAL}`, background: TEAL_LITE,
          color: TEAL, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600,
        }}
      >+ add another route to market</button>

      <div style={{
        display: 'flex', gap: 12, marginBottom: 12,
        fontSize: 11.5, color: MUTED,
      }}>
        <span style={{ fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>tip</span>
        <span style={{ color: SLATE_FG }}>Hover any arrow to insert a link. Click a node's name to rename.</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: MUTED,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          fontWeight: 600, marginBottom: 8,
        }}>{multi ? 'Load a starting template into the primary route' : 'Load a starting template'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {CHAIN_TEMPLATES.map((t) => (
            <TemplateMini
              key={t.id} tmpl={t}
              hovered={hoveredTmpl === t.id}
              onHover={setHoveredTmpl}
              onLoad={() => loadTemplate(t)}
            />
          ))}
        </div>
      </div>

      {isDirectB2C && warning && (
        <div style={{ marginBottom: 16 }}>
          <MentorCallout tone="amber" body={warning} />
        </div>
      )}

      <NavRow onBack={() => goTo('l9.4')} onNext={() => goTo('l10.2')} nextLabel="Continue → margin walk" />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L10.2 — Margin walk (minimal v1)
// ──────────────────────────────────────────────────────────────────

export function Step10_2({ state, update, goTo }: StepProps) {
  const routes = state.l10.routes;
  const multi = routes.length > 1;

  const setPrice = (routeId: string, value: number | null) =>
    update((prev) => ({
      ...prev,
      l10: {
        ...prev.l10,
        routes: prev.l10.routes.map((r) =>
          r.id === routeId ? { ...r, margins: { ...r.margins, priceUnits: value } } : r,
        ),
      },
    }));

  const setMarkup = (routeId: string, fromId: string, toId: string, value: number, fromDefault: boolean) =>
    update((prev) => ({
      ...prev,
      l10: {
        ...prev.l10,
        routes: prev.l10.routes.map((r) => {
          if (r.id !== routeId) return r;
          const existing = r.margins.estimates.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);
          const estimates = existing
            ? r.margins.estimates.map((e) =>
                e.fromNodeId === fromId && e.toNodeId === toId ? { ...e, markupPct: value, fromDefault } : e,
              )
            : [...r.margins.estimates, { fromNodeId: fromId, toNodeId: toId, markupPct: value, fromDefault }];
          return { ...r, margins: { ...r.margins, estimates } };
        }),
      },
    }));

  return (
    <StepFrame stepId="l10.2" title="Walk the chain — what does each link have to charge?">
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Enter your unit price. Industry-typical markups are pre-filled where we can; override anything you actually know.
        Every default you keep becomes a Discovery assumption to validate.
      </p>

      {routes.map((route) => (
        <RouteMarginWalk
          key={route.id}
          route={route}
          showLabel={multi}
          onSetPrice={(v) => setPrice(route.id, v)}
          onSetMarkup={(fromId, toId, v, fromDefault) => setMarkup(route.id, fromId, toId, v, fromDefault)}
        />
      ))}

      <NavRow onBack={() => goTo('l10.1')} onNext={() => goTo('l10.3')} nextLabel="Continue → business model" />
    </StepFrame>
  );
}

// One route's margin walk: a price box + the per-link markup table. Extracted
// so the per-route `useMemo` runs at the top level of a component rather than
// inside a .map() (which would break the Rules of Hooks).
function RouteMarginWalk({
  route, showLabel, onSetPrice, onSetMarkup,
}: {
  route: ValueRoute;
  showLabel: boolean;
  onSetPrice: (value: number | null) => void;
  onSetMarkup: (fromId: string, toId: string, value: number, fromDefault: boolean) => void;
}) {
  const nodes = nodesOrderedFn(route.chain);
  const price = route.margins.priceUnits;

  // Compute markup rows even without a price entered, so the table is visible
  // at load with defaults showing. Sell-price cells stay null until a price.
  const computed = useMemo(() => {
    let running: number | null = price;
    const out: { fromId: string; toId: string; price: number | null; markupPct: number }[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const fromId = nodes[i].id, toId = nodes[i + 1].id;
      const est = route.margins.estimates.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);
      const markupPct = est?.markupPct ?? defaultMarkupFor(nodes[i + 1].role);
      const next = running != null ? running * (1 + markupPct / 100) : null;
      out.push({ fromId, toId, price: next, markupPct });
      running = next;
    }
    return out;
  }, [price, nodes, route.margins.estimates]);

  return (
    <div style={{ marginBottom: showLabel ? 24 : 0 }}>
      {showLabel && (
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: SLATE_FG, marginBottom: 8,
        }}>{route.label}</div>
      )}

      <div style={{
        padding: 14, marginBottom: 16, borderRadius: 8,
        border: `1px solid ${TAN}`, background: '#fff',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <label style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: SLATE_FG,
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
        }}>Your price</label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={price ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onSetPrice(v === '' ? null : Number(v));
          }}
          style={{
            padding: '8px 10px', border: `1px solid ${TAN}`, borderRadius: 4,
            fontSize: 14, fontFamily: 'inherit', width: 120,
          }}
          placeholder="e.g. 9.99"
        />
        <span style={{ fontSize: 12, color: MUTED }}>per unit</span>
      </div>

      {nodes.length > 1 && (
        <div style={{
          padding: 16, marginBottom: 16, borderRadius: 8,
          border: `1px solid ${TAN}`, background: '#fff',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: SLATE_FG, fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px' }}>Link</th>
                <th style={{ textAlign: 'right', padding: '6px 4px' }}>Markup %</th>
                <th style={{ textAlign: 'right', padding: '6px 4px' }}>Sell price</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((row) => {
                const fromNode = nodes.find((n) => n.id === row.fromId);
                const toNode = nodes.find((n) => n.id === row.toId);
                const est = route.margins.estimates.find((e) => e.fromNodeId === row.fromId && e.toNodeId === row.toId);
                return (
                  <tr key={`${row.fromId}-${row.toId}`} style={{ borderTop: `1px solid ${HAIR}` }}>
                    <td style={{ padding: '8px 4px', color: INK }}>
                      {fromNode?.label} → {toNode?.label}
                      {!est && (
                        <span style={{
                          marginLeft: 6, fontFamily: FONT_MONO, fontSize: 10,
                          color: AMBER_FG, padding: '2px 6px', borderRadius: 3,
                          background: AMBER_SOFT,
                        }}>default</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                      <input
                        type="number"
                        value={row.markupPct}
                        onChange={(e) => onSetMarkup(row.fromId, row.toId, Number(e.target.value), false)}
                        style={{
                          width: 64, padding: '4px 6px', textAlign: 'right',
                          border: `1px solid ${TAN}`, borderRadius: 4,
                          fontFamily: FONT_MONO, fontSize: 12.5,
                        }}
                      />
                    </td>
                    <td style={{
                      padding: '8px 4px', textAlign: 'right', fontFamily: FONT_MONO,
                      color: row.price == null ? MUTED : INK,
                    }}>
                      {row.price == null ? '—' : row.price.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function defaultMarkupFor(role: ChainRole): number {
  switch (role) {
    case 'distributor': return 15;
    case 'retailer':    return 40;
    case 'aggregator':  return 20;
    case 'maker':       return 25;
    case 'end-user':    return 0;
    default:            return 20;
  }
}

// ──────────────────────────────────────────────────────────────────
// L10.3 — Business model picker
// ──────────────────────────────────────────────────────────────────

const BM_DEFAULT: { id: BusinessModelId; label: string; tip: string }[] = [
  { id: 'fixed-fee',       label: 'Fixed fee / one-time',  tip: 'Customer pays once, owns it.' },
  { id: 'subscription',    label: 'Subscription',          tip: 'Recurring payment for ongoing access.' },
  { id: 'freemium',        label: 'Freemium',              tip: 'Free tier + paid upgrade.' },
  { id: 'transaction-fee', label: 'Transaction / marketplace', tip: 'Percentage of each transaction.' },
];
const BM_MORE: { id: BusinessModelId; label: string; tip: string }[] = [
  { id: 'usage-based',      label: 'Usage-based',     tip: 'Pay per unit consumed (API call, kWh, seat-hour).' },
  { id: 'licensing',        label: 'Licensing',       tip: 'IP or platform licensed to others to deploy.' },
  { id: 'advertising',      label: 'Advertising',     tip: 'Service is free; advertisers pay for access.' },
  { id: 'razor-and-blades', label: 'Razor & blades',  tip: 'Cheap hardware, recurring consumables.' },
  { id: 'two-sided',        label: 'Two-sided',       tip: 'Free to one side, paid by the other.' },
  { id: 'service-attached', label: 'Service-attached',tip: 'Hybrid — service revenue while product matures.' },
];

export function Step10_3({ state, update, goTo, saveLayer }: StepProps) {
  const [showMore, setShowMore] = useState(false);
  const selected = state.l10.businessModelIds;

  const toggle = (id: BusinessModelId) => {
    update((prev) => ({
      ...prev,
      l10: {
        ...prev.l10,
        businessModelIds: selected.includes(id)
          ? prev.l10.businessModelIds.filter((x) => x !== id)
          : [...prev.l10.businessModelIds, id],
      },
    }));
  };

  const onNext = async () => {
    const names = [
      ...selected.map((id) => [...BM_DEFAULT, ...BM_MORE].find((m) => m.id === id)?.label).filter(Boolean),
      state.l10.businessModelOther.trim() || null,
    ].filter((x): x is string => Boolean(x));
    if (names.length > 0) {
      await saveLayer('businessModel', {
        claim_text: names.join(', '),
        source_value: state.draftSources.businessModel ?? 'experience',
      });
    }
    goTo('l10.4');
  };

  return (
    <StepFrame stepId="l10.3" title="How will this make money?">
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Pick one or more. Industry-default first, custom second. Many businesses are hybrid
        (subscription + transaction, freemium + advertising).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {BM_DEFAULT.map((m) => (
          <BMCard key={m.id} {...m} on={selected.includes(m.id)} onToggle={() => toggle(m.id)} />
        ))}
        {showMore && BM_MORE.map((m) => (
          <BMCard key={m.id} {...m} on={selected.includes(m.id)} onToggle={() => toggle(m.id)} />
        ))}
      </div>
      {!showMore && (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            color: TEAL, fontSize: 12, fontFamily: FONT_MONO,
            letterSpacing: '0.04em', cursor: 'pointer', marginBottom: 16,
          }}
        >+ show 6 more models</button>
      )}

      <label style={{
        display: 'block', marginBottom: 6, marginTop: 8,
        fontFamily: FONT_MONO, fontSize: 10.5, color: SLATE_FG,
        letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
      }}>Other (write-in)</label>
      <input
        value={state.l10.businessModelOther}
        onChange={(e) => update((prev) => ({ ...prev, l10: { ...prev.l10, businessModelOther: e.target.value } }))}
        placeholder="If you're using a model not listed above…"
        style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${TAN}`,
          borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: '#fff',
          marginBottom: 16,
        }}
      />

      <StepSourcePicker layerId="businessModel" state={state} update={update} />
      <NavRow onBack={() => goTo('l10.2')} onNext={onNext} nextLabel="Continue → competitors" />
    </StepFrame>
  );
}

function BMCard({ label, tip, on, onToggle }: { label: string; tip: string; on: boolean; onToggle: () => void }) {
  // Sprint 3 T12 — these were reading as display tiles. Adding a hover lift
  // + drop shadow so the founder sees them as click targets at a glance.
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      style={{
        textAlign: 'left', padding: '10px 12px', borderRadius: 6,
        border: `2px solid ${on ? TEAL : TAN}`,
        background: on ? TEAL_LITE : '#fff',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'transform .12s, box-shadow .12s, border-color .12s',
      }}
      onMouseEnter={(e) => {
        if (!on) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(11,18,32,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{label}</div>
      <div style={{ fontSize: 11.5, color: SLATE_FG, marginTop: 2 }}>{tip}</div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// L10.4 — Competitor starter
// ──────────────────────────────────────────────────────────────────

const TAG_OPTIONS: { value: CompetitorTag; label: string }[] = [
  { value: 'direct',         label: 'Direct' },
  { value: 'indirect',       label: 'Indirect' },
  { value: 'status-quo',     label: 'Status quo / Do nothing' },
  { value: 'diy-workaround', label: 'DIY workaround' },
];

// Sprint 3 T6 — substrings that strongly imply "they live with it" / status-
// quo competition. Case-insensitive substring match. The mentor card on this
// step actively tells the founder this is the most common competitor; defaulting
// these to 'direct' contradicts that lesson.
const DO_NOTHING_PATTERNS: readonly string[] = [
  'do nothing', 'suck it up', 'live with it', 'keep flying', 'keep using',
  'stay on', 'status quo', 'tolerate', 'put up with', 'deal with it',
  'nothing changes',
];

function inferCompetitorTag(name: string, fallback: CompetitorTag): CompetitorTag {
  const n = name.toLowerCase();
  if (DO_NOTHING_PATTERNS.some((p) => n.includes(p))) return 'status-quo';
  return fallback;
}

export function Step10_4({ state, update, goTo, saveLayer, onGraduate }: StepProps) {
  const [draft, setDraft] = useState('');
  const [draftTag, setDraftTag] = useState<CompetitorTag>('direct');

  // Auto-suggest 'status-quo' as the user types if the draft text matches a
  // do-nothing pattern. Founder can still override by clicking the dropdown.
  const draftIsDoNothing = useMemo(
    () => DO_NOTHING_PATTERNS.some((p) => draft.toLowerCase().includes(p)),
    [draft],
  );
  useEffect(() => {
    if (draftIsDoNothing && draftTag === 'direct') setDraftTag('status-quo');
  }, [draftIsDoNothing, draftTag]);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const tag = inferCompetitorTag(name, draftTag);
    const c: Competitor = { id: uid('c'), name, tag };
    update((prev) => ({ ...prev, l10: { ...prev.l10, competitors: [...prev.l10.competitors, c] } }));
    setDraft('');
    setDraftTag('direct');
  };

  const remove = (id: string) =>
    update((prev) => ({
      ...prev,
      l10: { ...prev.l10, competitors: prev.l10.competitors.filter((c) => c.id !== id) },
    }));

  const setTag = (id: string, tag: CompetitorTag) =>
    update((prev) => ({
      ...prev,
      l10: { ...prev.l10, competitors: prev.l10.competitors.map((c) => (c.id === id ? { ...c, tag } : c)) },
    }));

  const finalize = async () => {
    if (state.l10.competitors.length > 0) {
      const summary = state.l10.competitors
        .map((c) => `${c.name} (${c.tag})`)
        .join(', ');
      await saveLayer('competitiveMarket', {
        claim_text: summary,
        source_value: state.draftSources.competitiveMarket ?? 'experience',
      });
    }
    await onGraduate();
  };

  return (
    <StepFrame stepId="l10.4" title="What do people in your beachhead do right now?">
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        List 3–5 things. Include "do nothing" if that's one of them — it usually is.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="e.g. Pomodoro apps (Forest, Be Focused)"
          style={{
            flex: 1, padding: '8px 10px', border: `1px solid ${TAN}`,
            borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: '#fff',
          }}
        />
        <select
          value={draftTag}
          onChange={(e) => setDraftTag(e.target.value as CompetitorTag)}
          style={{
            padding: '8px 10px', border: `1px solid ${TAN}`,
            borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: '#fff',
          }}
        >
          {TAG_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          style={{
            padding: '8px 14px', background: INK, color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500,
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            opacity: draft.trim() ? 1 : 0.5, fontFamily: 'inherit',
          }}
        >Add</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
        {state.l10.competitors.map((c) => (
          <li key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 4,
            background: '#fff', border: `1px solid ${TAN}`,
            marginBottom: 4, fontSize: 13, color: INK,
          }}>
            <span style={{ flex: 1 }}>{c.name}</span>
            <select
              value={c.tag}
              onChange={(e) => setTag(c.id, e.target.value as CompetitorTag)}
              style={{
                padding: '4px 6px', border: `1px solid ${TAN}`,
                borderRadius: 4, fontSize: 11.5, fontFamily: 'inherit',
                background: '#fff',
              }}
            >
              {TAG_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => remove(c.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 14, color: SLATE_FG, opacity: 0.6,
              }}
              aria-label={`Remove ${c.name}`}
            >×</button>
          </li>
        ))}
      </ul>

      <StepSourcePicker layerId="competitiveMarket" state={state} update={update} />
      <NavRow
        onBack={() => goTo('l10.3')}
        onNext={finalize}
        nextLabel="Save & graduate to dashboard →"
      />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// NavRow — Prev / Next bar shared by every step
// ──────────────────────────────────────────────────────────────────

function NavRow({
  onBack, onNext, nextLabel, disabled,
}: {
  onBack: (() => void) | null;
  onNext: () => void | Promise<void>;
  nextLabel: string;
  disabled?: boolean;
}) {
  // Every step (and the terminal graduate action) routes its "Next" through
  // here. Previously `void onNext()` dropped any rejected promise on the floor,
  // so a failed layer save / graduation looked like a dead button. Now we await
  // and surface the error: `busy` blocks double-submits while the save is in
  // flight, and the mounted ref keeps the success path — which usually
  // navigates away and unmounts this row — from setting state post-unmount.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleNext = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onNext();
      if (mountedRef.current) setBusy(false);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Something went wrong saving this step.');
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${TAN}` }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '9px 14px', background: 'transparent',
              border: `1px solid ${STONE}`, borderRadius: 6,
              fontSize: 12.5, color: SLATE_FG, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >← Back</button>
        ) : <span />}
        <button
          type="button"
          onClick={() => { void handleNext(); }}
          disabled={disabled || busy}
          style={{
            padding: '10px 18px', background: INK, color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: (disabled || busy) ? 'not-allowed' : 'pointer',
            opacity: (disabled || busy) ? 0.5 : 1, fontFamily: 'inherit',
          }}
        >{busy ? 'Saving…' : nextLabel}</button>
      </div>
      {error && (
        <div role="alert" style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 6,
          background: AMBER_SOFT, border: `1px solid ${AMBER_FG}`,
          fontSize: 12.5, color: AMBER_FG, lineHeight: 1.45,
        }}>
          Couldn&apos;t save this step: {error}. Your work is still here — try again.
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Step list (used by StepRail and page-level dispatch)
// ──────────────────────────────────────────────────────────────────

export interface StepMeta {
  id: StepId;
  label: string;
  layerId: string; // canonical L8/L9/L10 layer this step contributes to
}

export const STEPS: readonly StepMeta[] = [
  { id: 'l8.1',  label: 'Option space',           layerId: 'customerSegment' },
  { id: 'l8.2',  label: 'Sub-divide',              layerId: 'customerSegment' },
  { id: 'l8.3',  label: 'Triple filter',           layerId: 'customerSegment' },
  { id: 'l8.4',  label: 'Lock beachhead',          layerId: 'customerSegment' },
  { id: 'l9.1',  label: 'Restate problem',         layerId: 'problem' },
  { id: 'l9.2',  label: 'Pain scale',              layerId: 'painScale' },
  { id: 'l9.3',  label: 'Solution + assumptions',  layerId: 'solution' },
  { id: 'l9.4',  label: 'Adoption cost',           layerId: 'solution' },
  { id: 'l10.1', label: 'Value chain',             layerId: 'businessModel' },
  { id: 'l10.2', label: 'Margin walk',             layerId: 'businessModel' },
  { id: 'l10.3', label: 'Business model',          layerId: 'businessModel' },
  { id: 'l10.4', label: 'Competitors',             layerId: 'competitiveMarket' },
];

// ──────────────────────────────────────────────────────────────────
// Dispatch — given a step id, render the right component
// ──────────────────────────────────────────────────────────────────

export function StepView(props: StepProps & { stepId: StepId }) {
  switch (props.stepId) {
    case 'l8.1':  return <Step8_1  {...props} />;
    case 'l8.2':  return <Step8_2  {...props} />;
    case 'l8.3':  return <Step8_3  {...props} />;
    case 'l8.4':  return <Step8_4  {...props} />;
    case 'l9.1':  return <Step9_1  {...props} />;
    case 'l9.2':  return <Step9_2  {...props} />;
    case 'l9.3':  return <Step9_3  {...props} />;
    case 'l9.4':  return <Step9_4  {...props} />;
    case 'l10.1': return <Step10_1 {...props} />;
    case 'l10.2': return <Step10_2 {...props} />;
    case 'l10.3': return <Step10_3 {...props} />;
    case 'l10.4': return <Step10_4 {...props} />;
  }
}
