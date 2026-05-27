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

import { useMemo, useState } from 'react';
import {
  BeachheadRadio, CategoryBadge, MentorCallout,
  ParentChip, PillOption, ScoreBar,
} from '../components/atoms';
import {
  ChainArrow, ChainNode, TemplateMini, CHAIN_TEMPLATES,
  type ChainTemplate,
} from '../components/valueChain';
import {
  computeBeachheadScore, extractAssumptions, isCloseCall,
  nodesOrdered as nodesOrderedFn, normalizedScore, topRankedSubgroup,
  type AdoptionVerdict, type BusinessModelId, type ChainNode as ChainNodeT,
  type ChainRole, type Competitor, type CompetitorTag,
  type DoorAState, type ExtractedAssumption, type PainValue,
  type ParentGroup, type ReachValue, type SizeValue, type SubGroup,
  type ValueChain,
} from '../lib/doorAState';
import type { SourceId } from '../lib/layers';
import { lookupStepVoice, lookupStepWarning, type StepId } from '../lib/voice';
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

// ── Layout helpers ──

function StepFrame({
  stepId, title, children,
}: {
  stepId: StepId; title: string; children: React.ReactNode;
}) {
  const voice = lookupStepVoice(stepId);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32,
      padding: '32px 40px',
    }}>
      <main style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <CategoryBadge cat="critical" />
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.12em',
            color: MUTED, fontWeight: 600, textTransform: 'uppercase',
          }}>Step {stepId.toUpperCase().replace('L', 'L')}</span>
        </div>
        <h2 style={{
          fontFamily: FONT_SERIF, fontSize: 30, lineHeight: 1.15,
          color: INK, letterSpacing: '-0.012em', margin: 0, marginBottom: 20,
        }}>{title}</h2>
        {children}
      </main>
      <aside style={{ alignSelf: 'start', position: 'sticky', top: 88 }}>
        <MentorCallout body={voice} italic />
      </aside>
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

  return (
    <StepFrame stepId="l8.1" title="List all the groups who might need this product.">
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

      {tooFew && groups.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <MentorCallout
            tone="amber"
            body={lookupStepWarning('l8.1.few_groups') ?? ''}
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
          >{indivisibleMode ? 'cancel' : 'mark indivisible'}</button>
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
      source_value: 'experience',
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
        source_value: 'experience',
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
          marginBottom: 20,
        }}
      />
      <NavRow onBack={() => goTo('l8.4')} onNext={onNext} nextLabel="Continue → pain scale" />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L9.2 — Pain scale + justification
// ──────────────────────────────────────────────────────────────────

export function Step9_2({ state, update, goTo, saveLayer, createDirectAssumption }: StepProps) {
  const onNext = async () => {
    const rating = state.l9.painRating;
    if (rating) {
      await saveLayer('painScale', {
        claim_text: `${rating} — ${state.l9.painJustification.trim()}`.slice(0, 500),
        source_value: 'experience',
      });
      // Critical claims become explicit Discovery targets.
      if (rating === 'critical' && state.l9.painJustification.trim().length > 0) {
        try {
          await createDirectAssumption({
            layerId: 'painScale',
            text: `Pain is Critical for the beachhead: "${state.l9.painJustification.trim().slice(0, 200)}"`,
            notes: 'Auto-queued from L9.2 — needs 5 interviews to validate.',
          });
        } catch {
          // Best-effort; don't block navigation on assumption-write failure.
        }
      }
    }
    goTo('l9.3');
  };

  const tooStrong = state.l9.painRating === 'critical';

  return (
    <StepFrame stepId="l9.2" title="How acute is this pain — really?">
      <BeachheadFixedHeader state={state} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {PAIN_OPTIONS.map((o) => {
          const on = state.l9.painRating === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => update((prev) => ({ ...prev, l9: { ...prev.l9, painRating: on ? null : o.value } }))}
              style={{
                textAlign: 'left', padding: '12px 16px',
                border: `2px solid ${on ? TEAL : TAN}`,
                background: on ? TEAL_LITE : '#fff',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{o.label}</div>
              <div style={{ fontSize: 12.5, color: SLATE_FG, marginTop: 2 }}>{o.tip}</div>
            </button>
          );
        })}
      </div>

      {state.l9.painRating && (
        <>
          <label style={{
            display: 'block', marginBottom: 6,
            fontFamily: FONT_MONO, fontSize: 10.5, color: SLATE_FG,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
          }}>One sentence: why this rating?</label>
          <textarea
            value={state.l9.painJustification}
            onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, painJustification: e.target.value } }))}
            placeholder="Why is this Critical and not Useful?"
            style={{
              width: '100%', minHeight: 80, padding: '10px 12px',
              border: `1px solid ${TAN}`, borderRadius: 6,
              fontSize: 13.5, lineHeight: 1.55, fontFamily: 'inherit',
              color: INK, background: '#fff', resize: 'vertical', outline: 'none',
              marginBottom: 16,
            }}
          />
        </>
      )}

      {tooStrong && (
        <div style={{ marginBottom: 16 }}>
          <MentorCallout
            tone="amber"
            body="Everybody rates their problem Critical the first time. About one in twenty actually has a Critical problem. We'll queue this as a Discovery assumption to test against 5 interviews in your beachhead."
          />
        </div>
      )}

      <NavRow onBack={() => goTo('l9.1')} onNext={onNext} nextLabel="Continue → solution" />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L9.3 — Solution + extracted assumptions
// ──────────────────────────────────────────────────────────────────

export function Step9_3({ state, update, goTo, saveLayer, createDirectAssumption }: StepProps) {
  const solution = state.l9.solution;

  const refreshExtraction = () => {
    const sentences = extractAssumptions(solution);
    // Preserve already-promoted assumptions; mark new candidates as not promoted.
    update((prev) => {
      const existing = new Map(prev.l9.extractedAssumptions.map((a) => [a.text, a]));
      const next: ExtractedAssumption[] = sentences.map((text) =>
        existing.get(text) ?? { id: uid('a'), text, promoted: false },
      );
      return { ...prev, l9: { ...prev.l9, extractedAssumptions: next } };
    });
  };

  const promote = async (a: ExtractedAssumption) => {
    if (a.promoted) return;
    try {
      await createDirectAssumption({
        layerId: 'solution',
        text: a.text,
        notes: 'Auto-extracted from L9.3 solution text.',
      });
      update((prev) => ({
        ...prev,
        l9: {
          ...prev.l9,
          extractedAssumptions: prev.l9.extractedAssumptions.map((x) =>
            x.id === a.id ? { ...x, promoted: true } : x,
          ),
        },
      }));
    } catch {
      // Surface as inline error in a future polish pass; swallowed here.
    }
  };

  const dismiss = (id: string) =>
    update((prev) => ({
      ...prev,
      l9: {
        ...prev.l9,
        extractedAssumptions: prev.l9.extractedAssumptions.filter((x) => x.id !== id),
      },
    }));

  const onNext = async () => {
    if (state.l9.solution.trim()) {
      await saveLayer('solution', {
        claim_text: state.l9.solution.trim(),
        source_value: 'experience',
      });
    }
    goTo('l9.4');
  };

  return (
    <StepFrame stepId="l9.3" title="Describe your solution — for this beachhead.">
      <BeachheadFixedHeader state={state} />
      <textarea
        value={solution}
        onChange={(e) => update((prev) => ({ ...prev, l9: { ...prev.l9, solution: e.target.value } }))}
        onBlur={refreshExtraction}
        placeholder="1–3 sentences. What does the product actually do for this person?"
        style={{
          width: '100%', minHeight: 120, padding: '12px 14px',
          border: `1px solid ${TAN}`, borderRadius: 6,
          fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit',
          color: INK, background: '#fff', resize: 'vertical', outline: 'none',
          marginBottom: 12,
        }}
      />
      <button
        type="button"
        onClick={refreshExtraction}
        disabled={!solution.trim()}
        style={{
          padding: '6px 12px', background: 'transparent',
          border: `1px solid ${TAN}`, borderRadius: 4,
          fontSize: 12, color: INK, fontFamily: 'inherit',
          cursor: solution.trim() ? 'pointer' : 'not-allowed',
          opacity: solution.trim() ? 1 : 0.5, marginBottom: 16,
        }}
      >Extract candidate assumptions</button>

      {state.l9.extractedAssumptions.length > 0 && (
        <div style={{
          padding: 14, borderRadius: 8, background: PAPER,
          border: `1px solid ${TAN}`, marginBottom: 20,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: SLATE_FG,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 8,
          }}>Candidate assumptions ({state.l9.extractedAssumptions.length})</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {state.l9.extractedAssumptions.map((a) => (
              <li key={a.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0', borderTop: `1px solid ${HAIR}`,
                fontSize: 13, color: INK, lineHeight: 1.45,
              }}>
                <span style={{ flex: 1 }}>{a.text}</span>
                {a.promoted ? (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, color: TEAL,
                    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                  }}>queued ✓</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => promote(a)}
                      style={{
                        background: 'transparent', border: `1px solid ${TEAL}`,
                        color: TEAL, borderRadius: 4, padding: '2px 8px',
                        fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
                      }}
                    >Queue</button>
                    <button
                      type="button"
                      onClick={() => dismiss(a.id)}
                      style={{
                        background: 'transparent', border: 'none', color: MUTED,
                        cursor: 'pointer', fontSize: 14,
                      }}
                      aria-label="Dismiss"
                    >×</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <NavRow onBack={() => goTo('l9.2')} onNext={onNext} nextLabel="Continue → adoption cost" />
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

export function Step9_4({ state, update, goTo }: StepProps) {
  const closeCall = isCloseCall(state.l9);
  const warning = lookupStepWarning('l9.4.close_call');

  return (
    <StepFrame stepId="l9.4" title="What does the user have to give up to use this?">
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
            style={{
              width: '100%', padding: '8px 10px', border: `1px solid ${TAN}`,
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
            style={{
              width: '100%', padding: '8px 10px', border: `1px solid ${TAN}`,
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

      <NavRow onBack={() => goTo('l9.3')} onNext={() => goTo('l10.1')} nextLabel="Continue → value chain" />
    </StepFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// L10.1 — Value chain builder
// ──────────────────────────────────────────────────────────────────

export function Step10_1({ state, update, goTo }: StepProps) {
  const chain = state.l10.chain;
  const [openRoleNodeId, setOpenRoleNodeId] = useState<string | null>(null);
  const [hoveredTmpl, setHoveredTmpl] = useState<string | null>(null);

  const nodes = nodesOrderedFn(chain);
  const isDirectB2C = nodes.length === 2;
  const warning = lookupStepWarning('l10.1.direct_b2c');

  const setChain = (next: ValueChain) => update((prev) => ({ ...prev, l10: { ...prev.l10, chain: next } }));

  const insertBetween = (fromId: string, toId: string) => {
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
    setChain({ nodes: renumbered, edges });
  };

  const removeNode = (id: string) => {
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
    setChain({ nodes: nodesAfter, edges });
    if (openRoleNodeId === id) setOpenRoleNodeId(null);
  };

  const rename = (id: string, label: string) =>
    setChain({
      ...chain,
      nodes: chain.nodes.map((n) => (n.id === id ? { ...n, label: label || n.label } : n)),
    });

  const setRole = (id: string, role: ChainRole) => {
    setChain({
      ...chain,
      nodes: chain.nodes.map((n) => (n.id === id ? { ...n, role } : n)),
    });
    setOpenRoleNodeId(null);
  };

  const findEdge = (fromId: string, toId: string) =>
    chain.edges.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);

  const setEdgeNote = (fromId: string, toId: string, notes: string) => {
    const existing = findEdge(fromId, toId);
    const cleaned = notes || undefined;
    if (existing) {
      setChain({
        ...chain,
        edges: chain.edges.map((e) =>
          e.fromNodeId === fromId && e.toNodeId === toId ? { ...e, notes: cleaned } : e,
        ),
      });
    } else {
      setChain({ ...chain, edges: [...chain.edges, { fromNodeId: fromId, toNodeId: toId, notes: cleaned }] });
    }
  };

  const loadTemplate = (t: ChainTemplate) => {
    const newNodes: ChainNodeT[] = t.chain.map((c, i) => ({
      id: i === 0 ? 'n-you' : i === t.chain.length - 1 ? 'n-end' : uid('n'),
      label: c.label, role: c.role, position: i,
      locked: i === 0 || i === t.chain.length - 1,
    }));
    const edges = newNodes.slice(0, -1).map((n, i) => ({
      fromNodeId: n.id, toNodeId: newNodes[i + 1].id,
    }));
    setChain({ nodes: newNodes, edges });
    setOpenRoleNodeId(null);
  };

  return (
    <StepFrame stepId="l10.1" title="Where are you in the value chain?">
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0, marginBottom: 16 }}>
        Between you and the person who ultimately uses what you make, how many steps are there?
        Add a node for each link in the chain.
      </p>

      <div style={{
        padding: 24, marginBottom: 16, borderRadius: 12,
        border: `1px solid ${TAN}`, background: '#fff', overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, minWidth: 'max-content' }}>
          {nodes.map((node, i) => {
            const isFirst = i === 0;
            const isLast = i === nodes.length - 1;
            return (
              <span key={node.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <ChainNode
                  node={node} isFirst={isFirst} isLast={isLast}
                  dropdownOpen={openRoleNodeId === node.id}
                  onToggleDropdown={() => setOpenRoleNodeId((c) => (c === node.id ? null : node.id))}
                  onRename={(s) => rename(node.id, s)}
                  onChangeRole={(r) => setRole(node.id, r)}
                  onRemove={() => removeNode(node.id)}
                />
                {!isLast && (
                  <ChainArrow
                    onInsert={() => insertBetween(node.id, nodes[i + 1].id)}
                    note={findEdge(node.id, nodes[i + 1].id)?.notes}
                    onNoteChange={(n) => setEdgeNote(node.id, nodes[i + 1].id, n)}
                  />
                )}
              </span>
            );
          })}
        </div>
      </div>

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
        }}>Load a starting template</div>
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
  const chain = state.l10.chain;
  const nodes = nodesOrderedFn(chain);
  const price = state.l10.margins.priceUnits;

  const computed = useMemo(() => {
    if (price == null) return [];
    let running = price;
    const out: { fromId: string; toId: string; price: number; markupPct: number }[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const fromId = nodes[i].id, toId = nodes[i + 1].id;
      const est = state.l10.margins.estimates.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);
      const markupPct = est?.markupPct ?? defaultMarkupFor(nodes[i + 1].role);
      const next = running * (1 + markupPct / 100);
      out.push({ fromId, toId, price: next, markupPct });
      running = next;
    }
    return out;
  }, [price, nodes, state.l10.margins.estimates]);

  const setMarkup = (fromId: string, toId: string, value: number, fromDefault: boolean) => {
    update((prev) => {
      const existing = prev.l10.margins.estimates.find((e) => e.fromNodeId === fromId && e.toNodeId === toId);
      const next = existing
        ? prev.l10.margins.estimates.map((e) =>
            e.fromNodeId === fromId && e.toNodeId === toId ? { ...e, markupPct: value, fromDefault } : e,
          )
        : [...prev.l10.margins.estimates, { fromNodeId: fromId, toNodeId: toId, markupPct: value, fromDefault }];
      return { ...prev, l10: { ...prev.l10, margins: { ...prev.l10.margins, estimates: next } } };
    });
  };

  return (
    <StepFrame stepId="l10.2" title="Walk the chain — what does each link have to charge?">
      <p style={{ fontSize: 14, color: SLATE_FG, lineHeight: 1.55, marginTop: 0 }}>
        Enter your unit price. Industry-typical markups are pre-filled where we can; override anything you actually know.
        Every default you keep becomes a Discovery assumption to validate.
      </p>

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
            update((prev) => ({
              ...prev,
              l10: { ...prev.l10, margins: { ...prev.l10.margins, priceUnits: v === '' ? null : Number(v) } },
            }));
          }}
          style={{
            padding: '8px 10px', border: `1px solid ${TAN}`, borderRadius: 4,
            fontSize: 14, fontFamily: 'inherit', width: 120,
          }}
          placeholder="e.g. 9.99"
        />
        <span style={{ fontSize: 12, color: MUTED }}>per unit</span>
      </div>

      {price != null && nodes.length > 1 && (
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
                const est = state.l10.margins.estimates.find((e) => e.fromNodeId === row.fromId && e.toNodeId === row.toId);
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
                        onChange={(e) => setMarkup(row.fromId, row.toId, Number(e.target.value), false)}
                        style={{
                          width: 64, padding: '4px 6px', textAlign: 'right',
                          border: `1px solid ${TAN}`, borderRadius: 4,
                          fontFamily: FONT_MONO, fontSize: 12.5,
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: FONT_MONO, color: INK }}>
                      {row.price.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NavRow onBack={() => goTo('l10.1')} onNext={() => goTo('l10.3')} nextLabel="Continue → business model" />
    </StepFrame>
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
        source_value: 'experience',
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

      <NavRow onBack={() => goTo('l10.2')} onNext={onNext} nextLabel="Continue → competitors" />
    </StepFrame>
  );
}

function BMCard({ label, tip, on, onToggle }: { label: string; tip: string; on: boolean; onToggle: () => void }) {
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
  { value: 'status-quo',     label: 'Status quo' },
  { value: 'diy-workaround', label: 'DIY workaround' },
];

export function Step10_4({ state, update, goTo, saveLayer, onGraduate }: StepProps) {
  const [draft, setDraft] = useState('');
  const [draftTag, setDraftTag] = useState<CompetitorTag>('direct');

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const c: Competitor = { id: uid('c'), name, tag: draftTag };
    update((prev) => ({ ...prev, l10: { ...prev.l10, competitors: [...prev.l10.competitors, c] } }));
    setDraft('');
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
        source_value: 'experience',
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
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 16, marginTop: 8, borderTop: `1px solid ${TAN}`,
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
        onClick={() => { void onNext(); }}
        disabled={disabled}
        style={{
          padding: '10px 18px', background: INK, color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
        }}
      >{nextLabel}</button>
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
