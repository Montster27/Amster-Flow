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
import { GateBadge, PageShell, Term, VentureHeader } from '../components/atoms';
import { FrameworkDisclosure, useFrameworkDisclosure } from '../components/FrameworkDisclosure';
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

// ── Glossary definitions (plain-language, reused across tooltips) ──
//
// Kept here so the framework section and the primary UI cite the same wording
// for the four terms the v3 usability review flagged as unexplained.
const DEF_LAYER =
  'Layer: one building block of your venture’s story — Customer Segment, Problem, Solution, and so on. PivotKit scores each layer on its own.';
const DEF_EVIDENCE =
  'Evidence strength: how sure you can be a claim is true, based on where it comes from. A hunch is weak; customer interviews or a working prototype are strong.';
const DEF_STAGE_GATE =
  'Stage gate: a checkpoint that clears once its layers have enough evidence. The three gates are Customer–Problem Fit, Problem–Solution Fit, and Business Model Viability.';

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
        }}>All 12 steps</div>
        <div style={{ fontSize: 11.5, color: SLATE_FG, lineHeight: 1.45 }}>
          Follow the guided sequence or jump ahead—you can return anytime. Each
          step adds evidence to one <Term definition={DEF_LAYER}>layer</Term> of
          your venture, so your progress keeps moving either way.
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

// Section kicker used throughout the framework disclosure.
function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: SLATE_FG, fontWeight: 700,
      marginBottom: 8,
    }}>{children}</div>
  );
}

// Foundation progress — the always-expanded panel that lives inside the
// framework disclosure. (Replaces the header hover-counter; v3 usability step 1
// moves layer evidence-strength totals out of the primary view.) Lists each of
// the six foundation layers with its current evidence strength, in plain
// language, and states the graduation bar.
function FoundationPanel({
  cleared, total, stack, draftSources,
}: {
  cleared: number;
  total: number;
  stack: Record<string, { source_value?: string | null } | undefined>;
  draftSources: Partial<Record<string, string>>;
}) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${HAIR}` }}>
      <SectionKicker>Progress</SectionKicker>
      <div style={{ fontSize: 12.5, color: SLATE_FG, lineHeight: 1.5, marginBottom: 12 }}>
        <span style={{ color: TEAL, fontWeight: 700 }}>{cleared}</span> of {total}{' '}
        <Term definition={DEF_LAYER}>layers</Term> now have enough{' '}
        <Term definition={DEF_EVIDENCE}>evidence strength</Term> to clear. This
        guided setup finishes when every foundation layer gets there.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {FOUNDATION_QUEUE.map((id) => {
          const layer = PK_LAYER_BY_ID[id];
          const src = (draftSources[id] ?? stack[id]?.source_value ?? null) as SourceId | null;
          const tier = pkTier(id, src);
          const ok = tier >= 2;
          return (
            <div key={id} style={{
              display: 'flex', justifyContent: 'space-between', gap: 10,
              alignItems: 'baseline', padding: '4px 0',
            }}>
              <span style={{ fontSize: 13, color: ok ? INK : SLATE_FG }}>
                {ok ? '✓' : '·'} {layer?.name ?? id}
              </span>
              <span
                aria-label={`Evidence strength ${tier} of 5`}
                style={{
                  fontFamily: FONT_MONO, fontSize: 12,
                  color: ok ? TEAL : MUTED, letterSpacing: '0.04em',
                }}
              >{renderStars(tier)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stage-gate panel — CPF / PSF / BMV, moved into the framework disclosure. The
// acronyms are expanded in the lede and again on each badge's own tooltip.
function StageGatePanel({ gates }: { gates: Parameters<typeof GateBadge>[0]['gate'][] }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${HAIR}` }}>
      <SectionKicker>Stage gates</SectionKicker>
      <div style={{ fontSize: 12.5, color: SLATE_FG, lineHeight: 1.5, marginBottom: 12 }}>
        <Term definition={DEF_STAGE_GATE}>Stage gates</Term> are the three
        checkpoints investors look for: Customer–Problem Fit (CPF),
        Problem–Solution Fit (PSF), and Business Model Viability (BMV). Hover a
        badge for what each one still needs.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {gates.map((g) => <GateBadge key={g.id} gate={g} />)}
      </div>
    </div>
  );
}

// ── ProgressHeader — the "Step N of 12 · Phase" line that anchors the primary
// view. Plain language only: no L-numbers, no sub-step codenames. ──
function ProgressHeader({ index, total, phase }: { index: number; total: number; phase: string }) {
  const pct = total > 0 ? Math.round((index / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 11, color: TEAL, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Step {index} of {total}</span>
        <span style={{
          fontFamily: FONT_SERIF, fontSize: 16, color: SLATE_FG,
          letterSpacing: '-0.005em',
        }}>{phase}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={index}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${index} of ${total}`}
        style={{ height: 4, borderRadius: 2, background: TAN, overflow: 'hidden' }}
      >
        <div style={{
          width: `${pct}%`, height: '100%', background: TEAL,
          transition: 'width .25s ease',
        }} />
      </div>
    </div>
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

  // Keep URL hash in sync with current step, and mirror it to localStorage so
  // the Questions Up & Down "Continue guided flow" action can restore the exact
  // step even when the URL hash isn't carried across the navigation.
  useEffect(() => {
    setHash(step);
    if (projectId) {
      try { window.localStorage.setItem(`pk.v3.lastStep.${projectId}`, step); } catch { /* ignore */ }
    }
  }, [step, projectId]);

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

  // Foundation progress (for the framework panel)
  const cleared = useMemo(() => {
    return FOUNDATION_QUEUE.reduce((n, layerId) => {
      const t = pkTier(layerId, stack[layerId]?.source_value);
      return n + (t >= 2 ? 1 : 0);
    }, 0);
  }, [stack]);

  // Persisted open/closed state for the "See progress and framework" section.
  // Keyed per project so the choice survives navigation between guided steps
  // and page reloads (v3 usability acceptance criterion).
  const fw = useFrameworkDisclosure(`pk:doorA:${projectId ?? 'unknown'}:framework`);

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

  const meta = STEPS.find((s) => s.id === step);
  const layer = meta ? PK_LAYER_BY_ID[meta.layerId] : null;
  const stepIndex = STEPS.findIndex((s) => s.id === step) + 1;
  const phase = layer?.name ?? meta?.layerId ?? '';

  return (
    <PageShell>
      <VentureHeader
        ventureName="Guided setup"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: SLATE_FG,
              letterSpacing: '0.06em',
            }}>
              <SaveStatePill saving={saving} lastSavedAt={lastSavedAt} />
            </span>
            <SwitchToDashboardButton
              onClick={() => navigate(`/v3/dashboard/${projectId}`)}
            />
          </div>
        }
      />

      {/* Single-column guided flow. The current task owns the space above the
          fold; the framework (stage gates, evidence-strength totals, the full
          step list) lives inside the collapsed disclosure below. */}
      <div style={{ background: PAPER, minHeight: 'calc(100vh - 64px)' }}>
        <div style={{
          maxWidth: 760, margin: '0 auto',
          padding: 'clamp(20px, 4vw, 32px) clamp(16px, 5vw, 40px) 56px',
        }}>
          <ProgressHeader index={stepIndex} total={STEPS.length} phase={phase} />

          <StepView stepId={step} {...stepProps} />

          <FrameworkDisclosure open={fw.open} onToggle={fw.toggle}>
            <FoundationPanel
              cleared={cleared}
              total={FOUNDATION_QUEUE.length}
              stack={stack}
              draftSources={state.draftSources}
            />
            <StageGatePanel gates={gates} />
            <StepRail
              currentStep={step}
              onJump={goTo}
              stack={stack}
              state={state}
            />
          </FrameworkDisclosure>
        </div>
      </div>
    </PageShell>
  );
}
