// Door A · Guided start — step-graph rewrite (L8.1 → L10.4).
//
// Replaces the previous 6-textarea wizard with the spec'd step graph from
// door_a_l8_l10_spec.md. Each step writes its own slice of state into
// pivotkit_door_a_state.data; the L8.4 / L9.x / L10.3 / L10.4 steps also
// write the canonical claim_text into pivotkit_layer_states so the existing
// tier / gate machinery (lib/gates.ts) continues to work unchanged.
//
// URL hash carries the current step (`#l8.3` etc.) so reload + share-link
// land on the same step.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssumptions } from '../hooks/useAssumptions';
import { useDoorAState } from '../hooks/useDoorAState';
import { useLayerStack, useVenture } from '../hooks/useVenture';
import { PageShell, VentureHeader } from '../components/atoms';
import { FOUNDATION_QUEUE, PK_LAYER_BY_ID, pkTier } from '../lib/layers';
import type { SourceId } from '../lib/layers';
import { stepHasDraft, type DoorAState } from '../lib/doorAState';
import {
  FONT_MONO, FONT_SERIF, HAIR, INK, MUTED, PAPER, SLATE_FG, TAN, TEAL, TEAL_LITE,
} from '../lib/tokens';
import type { StepId } from '../lib/voice';
import {
  STEPS, StepView, type StepMeta, type StepProps,
} from './DoorAPage.steps';

// ── Hash <-> step helpers ──

const VALID_STEPS: Set<StepId> = new Set(STEPS.map((s) => s.id));

// Sprint 3 T14 — coarse-grained relative time. Compact phrasings; "saved · 12s
// ago" reassures the founder without competing with the page content. Updates
// at most once per minute past the first minute, so a parent re-render every
// 30s is plenty.
function relativeAgo(date: Date, now: number): string {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function stepFromHash(): StepId {
  if (typeof window === 'undefined') return 'l8.1';
  const raw = window.location.hash.replace(/^#/, '').toLowerCase();
  if (raw && VALID_STEPS.has(raw as StepId)) return raw as StepId;
  return 'l8.1';
}

function setHash(step: StepId) {
  if (typeof window === 'undefined') return;
  const target = `#${step}`;
  if (window.location.hash !== target) {
    history.replaceState(null, '', target);
  }
}

// ── Sidebar StepRail ──
//
// Lists all 12 steps with done / current / locked status. Click to jump.

function renderStars(tier: number): string {
  const filled = Math.max(0, Math.min(5, tier));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

type SubStepState = 'empty' | 'in-progress' | 'complete';

function StepStateMark({ state }: { state: SubStepState }) {
  // Three visually distinct shapes so the state reads in monochrome:
  //   empty       → bare ring
  //   in-progress → ring with a small filled center dot
  //   complete    → solid disk
  if (state === 'complete') {
    return (
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: TEAL, border: 'none',
        justifySelf: 'end',
      }} />
    );
  }
  if (state === 'in-progress') {
    return (
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: 'transparent', border: `1.5px solid ${TEAL}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        justifySelf: 'end',
      }}>
        <span style={{
          width: 3, height: 3, borderRadius: '50%', background: TEAL,
        }} />
      </span>
    );
  }
  return (
    <span style={{
      width: 10, height: 10, borderRadius: '50%',
      background: 'transparent', border: `1px solid ${TAN}`,
      justifySelf: 'end',
    }} />
  );
}

function StepRail({
  currentStep, onJump, stack, state,
}: {
  currentStep: StepId;
  onJump: (s: StepId) => void;
  stack: Record<string, { claim_text?: string | null; source_value?: string | null } | undefined>;
  /** Full Door A state. The rail needs `draftSources` (for live source tier
   *  on the section the founder is editing) and the rest of the blob (for
   *  per-sub-step in-progress detection — Sprint 2 T1). */
  state: DoorAState;
}) {
  // A step is "done" when its target layer has any claim_text.
  const isDone = (s: StepMeta) => Boolean(stack[s.layerId]?.claim_text);
  const subStepState = (s: StepMeta): SubStepState => {
    if (isDone(s)) return 'complete';
    if (stepHasDraft(s.id, state)) return 'in-progress';
    return 'empty';
  };

  // Group steps by the canonical layer they contribute to, preserving STEPS order.
  // Sub-step numbers (l8.1, l9.3, etc.) are not user-facing.
  const stepsBySection: { title: string; steps: StepMeta[] }[] = (() => {
    const out: { layerId: string; title: string; steps: StepMeta[] }[] = [];
    for (const s of STEPS) {
      const layer = PK_LAYER_BY_ID[s.layerId];
      const title = layer
        ? `L${String(layer.n).padStart(2, '0')} · ${layer.name}`
        : s.layerId;
      let section = out.find((sec) => sec.layerId === s.layerId);
      if (!section) {
        section = { layerId: s.layerId, title, steps: [] };
        out.push(section);
      }
      section.steps.push(s);
    }
    return out.map(({ title, steps }) => ({ title, steps }));
  })();

  return (
    <aside style={{
      padding: '20px 18px', overflow: 'auto', background: '#f4f1ea',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: SLATE_FG, fontWeight: 700,
          marginBottom: 8,
        }}>Door A · Step graph</div>
        <div style={{ fontSize: 11.5, color: SLATE_FG, lineHeight: 1.45 }}>
          12 steps that fill the six foundation layers. Nudge, don't block — you
          can skip ahead and come back. Each step contributes a claim to the
          underlying layer so your gates keep moving.
        </div>
      </div>

      {stepsBySection.map((section) => {
        // After T6, each section maps to one canonical layer.
        const sectionLayerId = section.steps[0]?.layerId;
        const liveSrc = sectionLayerId
          ? (state.draftSources[sectionLayerId] ?? stack[sectionLayerId]?.source_value ?? null)
          : null;
        const tier = sectionLayerId
          ? pkTier(sectionLayerId, liveSrc as SourceId | null)
          : 0;
        return (
        <div key={section.title}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            gap: 6, marginBottom: 6,
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: MUTED, fontWeight: 700,
            }}>{section.title}</span>
            <span
              aria-label={`${tier} of 5 stars`}
              style={{
                fontFamily: FONT_MONO, fontSize: 11,
                color: tier >= 2 ? TEAL : MUTED, letterSpacing: '0.04em',
              }}
            >{renderStars(tier)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {section.steps.map((s) => {
              const subState = subStepState(s);
              const isCurrent = s.id === currentStep;
              const sectionLayer = PK_LAYER_BY_ID[s.layerId];
              const layerStr = sectionLayer
                ? `L${String(sectionLayer.n).padStart(2, '0')} ${sectionLayer.name}`
                : s.layerId;
              const stateStr = subState === 'complete' ? 'complete'
                : subState === 'in-progress' ? 'in progress'
                : 'not yet started';
              const ariaLabel = `${layerStr}, ${s.label}, ${stateStr}${isCurrent ? ', current step' : ''}`;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onJump(s.id)}
                  aria-label={ariaLabel}
                  aria-current={isCurrent ? 'step' : undefined}
                  data-step-state={subState}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 16px',
                    alignItems: 'center', gap: 8,
                    padding: '7px 10px',
                    textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: isCurrent ? '#fff' : 'transparent',
                    border: `1px solid ${isCurrent ? TEAL : TAN}`,
                    borderRadius: 6,
                  }}
                >
                  <span style={{
                    fontSize: 12.5,
                    color: isCurrent ? INK : SLATE_FG,
                    fontWeight: isCurrent ? 600 : 500,
                  }}>{s.label}</span>
                  <StepStateMark state={subState} />
                </button>
              );
            })}
          </div>
        </div>
        );
      })}

      <div style={{
        padding: '10px 12px', borderRadius: 6,
        background: TEAL_LITE,
        border: `1px dashed ${TEAL}`,
        fontSize: 11.5, color: INK, lineHeight: 1.5,
      }}>
        <strong style={{ color: TEAL }}>Graduates at:</strong> all six contributory layers
        (customerSegment, problem, painScale, solution, businessModel, competitiveMarket)
        ≥ 2 stars. The full 16-layer stack unlocks then.
      </div>
    </aside>
  );
}

// ── SwitchToDashboardButton ──
//
// Tooltip-on-hover/focus version of the mode-switch escape hatch. Tooltip
// copy is plain UX explanation (not Monty voice) — it surfaces what happens
// to the work-in-progress so founders aren't afraid to click.
//
// Mobile/touch tooltip behavior is deferred (Sprint 3); native `title`
// attribute is the fallback for non-hover environments.

// Sprint 3 T14 — "saving" → "saved · {time} ago" companion state. Ticks
// internally on a 30s interval so the relative time stays current without
// re-rendering the entire header on every keystroke. Falls back to a quiet
// dash when there's nothing to report (fresh page, no edits, no saves).
function SaveStatePill({ saving, lastSavedAt }: { saving: boolean; lastSavedAt: Date | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);
  if (saving) {
    return <span style={{ marginLeft: 8, color: MUTED }}>· saving…</span>;
  }
  if (lastSavedAt) {
    return (
      <span
        style={{ marginLeft: 8, color: MUTED }}
        title={`Last saved ${lastSavedAt.toLocaleTimeString()}`}
      >· saved · {relativeAgo(lastSavedAt, now)}</span>
    );
  }
  return null;
}

// Sprint 3 T10 — foundation star counter with hover/focus tooltip that names
// each contributing layer and shows its current tier. The Stage Gates panel
// on the dashboard is the fuller reference — this is the in-flow nudge.
function FoundationCounter({
  cleared, total, stack, draftSources,
}: {
  cleared: number;
  total: number;
  stack: Record<string, { source_value?: string | null } | undefined>;
  draftSources: Partial<Record<string, string>>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', isolation: 'isolate' }}>
      <span
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          cursor: 'help', borderBottom: `1px dotted ${MUTED}`,
          outline: 'none',
        }}
      >
        <span style={{ color: TEAL, fontWeight: 700 }}>{cleared}</span>
        {' / '}{total} layers ≥ 2★
      </span>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', right: 0, top: '100%',
            marginTop: 6, zIndex: 200, width: 280,
            padding: '10px 12px', borderRadius: 6,
            background: INK, color: '#f8fafc',
            fontSize: 11.5, lineHeight: 1.45, textAlign: 'left',
            boxShadow: '0 6px 16px rgba(11,18,32,0.18)',
            pointerEvents: 'none', textTransform: 'none', letterSpacing: 0,
            fontWeight: 400,
          }}
        >
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
            color: '#fcd34d', fontWeight: 700, textTransform: 'uppercase',
            marginBottom: 6,
          }}>Foundation · {cleared}/{total}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FOUNDATION_QUEUE.map((id) => {
              const layer = PK_LAYER_BY_ID[id];
              const src = (draftSources[id] ?? stack[id]?.source_value ?? null) as SourceId | null;
              const tier = pkTier(id, src);
              const ok = tier >= 2;
              return (
                <div key={id} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 10,
                }}>
                  <span style={{ color: ok ? '#86efac' : '#cbd5e1' }}>
                    {ok ? '✓' : '·'} {layer?.name ?? id}
                  </span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10.5,
                    color: ok ? '#86efac' : '#94a3b8',
                  }}>{tier}/5★</span>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 6, paddingTop: 6, borderTop: '1px solid #334155',
            color: '#cbd5e1', fontSize: 11,
          }}>Door A graduates when every layer here clears 2★.</div>
        </span>
      )}
    </span>
  );
}

function SwitchToDashboardButton({ onClick }: { onClick: () => void }) {
  const [open, setOpen] = useState(false);
  const tooltip = 'See your full 16-layer stack now. Your work is saved — you can come back to the guided flow any time.';
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={onClick}
        title={tooltip}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          padding: '7px 12px', background: 'transparent', color: SLATE_FG,
          border: `1px solid ${TAN}`, borderRadius: 6, fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >Switch to dashboard →</button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', right: 0, top: '100%',
            marginTop: 8, zIndex: 30, width: 280,
            padding: '10px 12px', borderRadius: 6,
            background: INK, color: '#f8fafc',
            fontSize: 12, lineHeight: 1.45,
            boxShadow: '0 6px 16px rgba(11,18,32,0.18)',
            pointerEvents: 'none',
          }}
        >{tooltip}</span>
      )}
    </span>
  );
}

// ── Main page ──

export default function DoorAPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const { stack, rows, gates, saveLayer, refetch } = useLayerStack(projectId);
  const { state, loading: dLoading, hydrated, saving, lastSavedAt, update, flush } =
    useDoorAState(projectId);
  const { createDirect } = useAssumptions(projectId, rows);

  const [step, setStep] = useState<StepId>(() => stepFromHash());

  // Listen for hashchange (back/forward, share-link clicks)
  useEffect(() => {
    const onHash = () => setStep(stepFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Keep URL hash in sync with current step
  useEffect(() => { setHash(step); }, [step]);

  // Stamp door choice on first visit
  useEffect(() => {
    if (venture && !venture.door_choice) {
      void updateVenture({ door_choice: 'A' });
    }
  }, [venture, updateVenture]);

  const goTo = useCallback((next: StepId) => {
    setStep(next);
    // Make sure the autosave flush settles before the next step renders.
    void flush();
  }, [flush]);

  const onGraduate = useCallback(async () => {
    await flush();
    await refetch();
    await updateVenture({ has_completed_onboarding: true });
    navigate(`/v3/dashboard/${projectId}`);
  }, [flush, refetch, updateVenture, navigate, projectId]);

  // Foundation progress (for the header summary)
  const cleared = useMemo(() => {
    return FOUNDATION_QUEUE.reduce((n, layerId) => {
      const t = pkTier(layerId, stack[layerId]?.source_value);
      return n + (t >= 2 ? 1 : 0);
    }, 0);
  }, [stack]);

  if (!projectId) {
    return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  }
  if (vLoading || dLoading || !hydrated) {
    return <PageShell><div style={{ padding: 40 }}>Loading…</div></PageShell>;
  }

  const stepProps: StepProps = {
    state, update, goTo, saveLayer,
    createDirectAssumption: (args) => createDirect(args),
    onGraduate,
  };

  return (
    <PageShell>
      <VentureHeader
        ventureName="Door A · Guided start"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: SLATE_FG,
              letterSpacing: '0.06em',
            }}>
              <FoundationCounter
                cleared={cleared}
                total={FOUNDATION_QUEUE.length}
                stack={stack}
                draftSources={state.draftSources}
              />
              <SaveStatePill saving={saving} lastSavedAt={lastSavedAt} />
            </span>
            <SwitchToDashboardButton
              onClick={() => navigate(`/v3/dashboard/${projectId}`)}
            />
          </div>
        }
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 320px',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <div style={{ borderRight: `1px solid ${HAIR}`, background: PAPER }}>
          {/* Page title rail */}
          {(() => {
            const meta = STEPS.find((s) => s.id === step);
            const layer = meta ? PK_LAYER_BY_ID[meta.layerId] : null;
            return (
              <div style={{
                padding: '14px 40px 0', display: 'flex',
                alignItems: 'baseline', gap: 12,
              }}>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED,
                  letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                }}>You are here</span>
                {layer && (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: TEAL,
                    letterSpacing: '0.08em', fontWeight: 700,
                  }}>L{String(layer.n).padStart(2, '0')}</span>
                )}
                <span style={{
                  fontFamily: FONT_SERIF, fontSize: 17, color: INK,
                  letterSpacing: '-0.005em',
                }}>{layer?.name ?? meta?.layerId}</span>
                {meta && (
                  <>
                    <span style={{ color: MUTED, fontSize: 12 }}>·</span>
                    <span style={{
                      fontSize: 13, color: SLATE_FG,
                    }}>{meta.label}</span>
                  </>
                )}
              </div>
            );
          })()}
          <StepView stepId={step} {...stepProps} />
        </div>
        <StepRail
          currentStep={step}
          onJump={goTo}
          stack={stack}
          state={state}
        />
      </div>
    </PageShell>
  );
}
