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
import {
  FONT_MONO, FONT_SERIF, HAIR, INK, MUTED, PAPER, SLATE_FG, TAN, TEAL, TEAL_LITE,
} from '../lib/tokens';
import type { StepId } from '../lib/voice';
import {
  STEPS, StepView, type StepMeta, type StepProps,
} from './DoorAPage.steps';

// ── Hash <-> step helpers ──

const VALID_STEPS: Set<StepId> = new Set(STEPS.map((s) => s.id));

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

function StepRail({
  currentStep, onJump, stack,
}: {
  currentStep: StepId;
  onJump: (s: StepId) => void;
  stack: Record<string, { claim_text?: string | null; source_value?: string | null } | undefined>;
}) {
  // A step is "done" when its target layer has any claim_text.
  const isDone = (s: StepMeta) => Boolean(stack[s.layerId]?.claim_text);

  const stepsBySection: { title: string; steps: StepMeta[] }[] = [
    { title: 'L8 · Customer Segment', steps: STEPS.filter((s) => s.id.startsWith('l8.')) },
    { title: 'L9 · Problem & Solution', steps: STEPS.filter((s) => s.id.startsWith('l9.')) },
    { title: 'L10 · Business Model',  steps: STEPS.filter((s) => s.id.startsWith('l10.')) },
  ];

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
          12 steps across L8 → L10. Nudge, don't block — you can skip ahead
          and come back. Each step contributes a claim to the underlying layer
          so your gates keep moving.
        </div>
      </div>

      {stepsBySection.map((section) => (
        <div key={section.title}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: MUTED, fontWeight: 700,
            marginBottom: 6,
          }}>{section.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {section.steps.map((s) => {
              const done = isDone(s);
              const isCurrent = s.id === currentStep;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onJump(s.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 16px',
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
                    fontFamily: FONT_MONO, fontSize: 10,
                    color: isCurrent ? TEAL : MUTED,
                    fontWeight: 700, letterSpacing: '0.04em',
                  }}>{s.id.toUpperCase().replace('L', '')}</span>
                  <span style={{
                    fontSize: 12.5,
                    color: isCurrent ? INK : SLATE_FG,
                    fontWeight: isCurrent ? 600 : 500,
                  }}>{s.label}</span>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: done ? TEAL : 'transparent',
                    border: done ? 'none' : `1px solid ${TAN}`,
                    justifySelf: 'end',
                  }} />
                </button>
              );
            })}
          </div>
        </div>
      ))}

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

// ── Main page ──

export default function DoorAPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const { stack, rows, gates, saveLayer, refetch } = useLayerStack(projectId);
  const { state, loading: dLoading, hydrated, saving, update, flush } =
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
              <span style={{ color: TEAL, fontWeight: 700 }}>{cleared}</span>
              {' / '}{FOUNDATION_QUEUE.length} layers ≥ 2★
              {saving && <span style={{ marginLeft: 8, color: MUTED }}>· saving</span>}
            </span>
            <button
              type="button"
              onClick={() => navigate(`/v3/door-b/${projectId}`)}
              style={{
                padding: '7px 12px', background: 'transparent', color: SLATE_FG,
                border: `1px solid ${TAN}`, borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Drop into full stack →</button>
          </div>
        }
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 320px',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <div style={{ borderRight: `1px solid ${HAIR}`, background: PAPER }}>
          {/* Page title rail */}
          <div style={{
            padding: '14px 40px 0', display: 'flex',
            alignItems: 'baseline', gap: 12,
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: MUTED,
              letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
            }}>You are here</span>
            <span style={{
              fontFamily: FONT_SERIF, fontSize: 17, color: INK,
              letterSpacing: '-0.005em',
            }}>{PK_LAYER_BY_ID[STEPS.find((s) => s.id === step)?.layerId ?? 'customerSegment']?.name}</span>
            <span style={{ color: MUTED, fontSize: 12 }}>·</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: SLATE_FG, letterSpacing: '0.06em' }}>{step.toUpperCase()}</span>
          </div>
          <StepView stepId={step} {...stepProps} />
        </div>
        <StepRail currentStep={step} onJump={goTo} stack={stack} />
      </div>
    </PageShell>
  );
}
