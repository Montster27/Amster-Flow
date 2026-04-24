import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  SanityCheckProvider,
  useSanityCheckStore,
  type SanityContact,
  type SanityContactStatus,
  type SanitySignal,
} from './sanityCheckStore';
import { useSanityCheckData } from '../../hooks/useSanityCheckData';
import { useAuth } from '../../hooks/useAuth';
import { graduateToDiscovery } from '../discovery/graduationService';
import { supabase } from '../../lib/supabase';
import { captureException } from '../../lib/sentry';
import { JourneyProgress } from '../../components/ui/JourneyProgress';
import { MentorVoice } from '../../components/ui/MentorVoice';

type BeachheadSummary = {
  segmentName: string;
  problem: string;
  solution: string;
  hypothesis: string;
};

const SIGNAL_OPTIONS: { value: Exclude<SanitySignal, null>; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unclear', label: 'Unclear' },
];

const STATUS_OPTIONS: { value: SanityContactStatus; label: string; desc: string }[] = [
  { value: 'not_started', label: 'Not started', desc: "Haven't reached out yet" },
  { value: 'done', label: 'Done', desc: 'Had the conversation' },
  { value: 'unreachable', label: "Couldn't reach", desc: 'Tried but no response' },
];

function ContactCard({ contact, expanded, onToggle }: { contact: SanityContact; expanded: boolean; onToggle: () => void }) {
  const { updateContact } = useSanityCheckStore();
  const displayName = contact.name.trim() || `Contact ${contact.index + 1}`;
  const isDone = contact.status === 'done';

  const statusBadge = (() => {
    switch (contact.status) {
      case 'done':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-600 text-white">DONE</span>;
      case 'unreachable':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-300 text-slate-700">UNREACHABLE</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-600">NOT STARTED</span>;
    }
  })();

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {statusBadge}
          <span className="font-semibold text-slate-800">{displayName}</span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Name edit (in case Quick Check didn't fill it) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Contact name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Who are you talking to?"
              value={contact.name}
              onChange={(e) => updateContact(contact.index, { name: e.target.value })}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = contact.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const patch: Partial<SanityContact> = { status: opt.value };
                      if (opt.value === 'done' && !contact.interviewedAt) {
                        patch.interviewedAt = new Date().toISOString();
                      }
                      updateContact(contact.index, patch);
                    }}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {isDone && (
            <>
              <SignalField
                label="Did they confirm the problem exists?"
                help="A real problem, in their words — not a polite nod."
                value={contact.hasProblem}
                onChange={(v) => updateContact(contact.index, { hasProblem: v })}
              />

              <SignalField
                label="Are they actively trying to solve it today?"
                help="Workarounds, hacks, tools, spreadsheets — anything counts. If they aren't doing anything, the need is likely latent."
                value={contact.isSolving}
                onChange={(v) => updateContact(contact.index, { isSolving: v })}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  What they said — in their words
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Quote them. What workaround do they use? What surprised you?"
                  value={contact.notes}
                  onChange={(e) => updateContact(contact.index, { notes: e.target.value })}
                />
              </div>
            </>
          )}

          {contact.status === 'unreachable' && (
            <p className="text-xs text-slate-500 italic">
              Marked unreachable — you still need 3 real conversations to move on.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SignalField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: SanitySignal;
  onChange: (v: SanitySignal) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {help && <p className="text-xs text-slate-500 mb-2">{help}</p>}
      <div className="flex gap-2">
        {SIGNAL_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? null : opt.value)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                active
                  ? opt.value === 'yes'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : opt.value === 'no'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-400 bg-slate-50 text-slate-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SanityCheckContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, missingQuickCheck } = useSanityCheckData(projectId);
  const {
    contacts,
    acknowledgedLatentWarning,
    setAcknowledgedLatentWarning,
    setCompleted,
    problemConfirmedCount,
    activelySolvingCount,
    doneCount,
    canGraduate,
    exportData,
  } = useSanityCheckStore();

  const [beachhead, setBeachhead] = useState<BeachheadSummary | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [graduating, setGraduating] = useState(false);
  const [graduationError, setGraduationError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-expand the first un-done contact
    if (contacts.length > 0 && expanded.size === 0) {
      const firstOpen = contacts.find((c) => c.status !== 'done') ?? contacts[0];
      setExpanded(new Set([firstOpen.index]));
    }
  }, [contacts, expanded.size]);

  useEffect(() => {
    if (!projectId) return;
    const loadBeachhead = async () => {
      const { data } = await (supabase as any)
        .from('project_quick_check')
        .select('segments')
        .eq('project_id', projectId)
        .maybeSingle();
      const seg = (data?.segments as Array<Record<string, unknown>> | undefined)?.find((s) => s.isBeachhead);
      if (seg) {
        setBeachhead({
          segmentName: (seg.segmentName as string) || '',
          problem: (seg.problem as string) || '',
          solution: (seg.solution as string) || '',
          hypothesis: (seg.hypothesis as string) || '',
        });
      }
    };
    loadBeachhead();
  }, [projectId]);

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleGraduate = async () => {
    if (!projectId || !canGraduate()) return;
    setGraduating(true);
    setGraduationError(null);

    try {
      const sanity = exportData();

      // Load Step 0 data for beachhead graduation
      const { data: step0Row, error: step0LoadError } = await supabase
        .from('project_step0')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (step0LoadError) {
        setGraduationError(`Could not load Step 0 data: ${step0LoadError.message}`);
        return;
      }
      if (!step0Row) {
        setGraduationError('No Step 0 data found for this project.');
        return;
      }

      const step0 = step0Row as any;
      const focusedSegmentId: number | undefined =
        typeof step0.focused_segment_id === 'number' ? step0.focused_segment_id : undefined;

      const result = await graduateToDiscovery(
        projectId,
        {
          ideaStatement: step0.idea || { building: '', helps: '', achieve: '' },
          customers: step0.customers || [],
          segments: step0.segments || [],
          focusedSegmentId,
        },
        focusedSegmentId
      );

      if (!result.success) {
        setGraduationError(
          result.errors.length > 0
            ? `Graduation failed: ${result.errors.join('; ')}`
            : 'Graduation failed for an unknown reason.'
        );
        return;
      }

      // Stamp sanity check summary onto beachhead_data
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectData) {
        const existing = ((projectData as any).beachhead_data as Record<string, unknown>) || {};
        await supabase
          .from('projects')
          .update({
            beachhead_data: {
              ...existing,
              sanityCheck: {
                problemConfirmedCount: problemConfirmedCount(),
                activelySolvingCount: activelySolvingCount(),
                completedAt: new Date().toISOString(),
              },
            },
          } as any)
          .eq('id', projectId);
      }

      // Persist completed flag before navigating (auto-save is debounced)
      const { error: updateErr } = await (supabase as any)
        .from('project_sanity_check')
        .upsert(
          {
            project_id: projectId,
            contacts: sanity.contacts,
            acknowledged_latent_warning: sanity.acknowledgedLatentWarning,
            completed: true,
            completed_at: new Date().toISOString(),
            updated_by: user?.id,
          },
          { onConflict: 'project_id' }
        );

      if (updateErr) {
        setGraduationError(`Could not mark Sanity Check complete: ${updateErr.message}`);
        return;
      }

      setCompleted(true);
      navigate(`/project/${projectId}/discovery`, {
        state: {
          message: 'Sanity Check complete. Ready for Discovery.',
          fromSanityCheck: true,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error during graduation.';
      captureException(err instanceof Error ? err : new Error(message), {
        extra: { projectId, context: 'SanityCheckPage graduate' },
      });
      setGraduationError(message);
    } finally {
      setGraduating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      </div>
    );
  }

  if (missingQuickCheck) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="py-12">
          <p className="text-lg text-slate-600 mb-4">
            Complete Quick Check before running a Sanity Check.
          </p>
          <button
            onClick={() => navigate(`/project/${projectId}/quick-check`)}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Go to Quick Check
          </button>
        </div>
      </div>
    );
  }

  const confirmed = problemConfirmedCount();
  const solving = activelySolvingCount();
  const done = doneCount();
  const gatePassed = canGraduate();

  return (
    <>
      <JourneyProgress currentStep="sanitycheck" />
      <div className="max-w-3xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(`/project/${projectId}/quick-check`)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Back to Quick Check"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Sanity Check</h1>
          </div>
          <p className="text-sm text-slate-600">
            Three conversations to confirm the problem is real, more than one person has it, and
            they're already trying to solve it. Skip this and you risk spending Discovery on a
            problem nobody actually has.
          </p>
        </div>

        {/* Latent-need warning */}
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                  This approach only works for problems people already know they have.
                </p>
                <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                  If you're building for a <strong>latent need</strong> — something customers won't
                  recognize until they see it (e.g. the first iPhone) — interviews won't validate
                  it. You'll need prototypes or demos instead. Continue only if customers already
                  feel this pain.
                </p>
                <label className="flex items-center gap-2 mt-3 text-sm text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgedLatentWarning}
                    onChange={(e) => setAcknowledgedLatentWarning(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span>I understand — my idea is for a known pain, not a latent need.</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Beachhead context */}
        {beachhead && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
              Testing this hypothesis
            </div>
            <div className="text-sm font-semibold text-slate-800 mb-1">
              Segment: {beachhead.segmentName}
            </div>
            {beachhead.hypothesis && (
              <p className="text-sm italic text-slate-700 leading-relaxed">
                {beachhead.hypothesis}
              </p>
            )}
          </div>
        )}

        {/* Mentor tip */}
        <div className="mb-4">
          <MentorVoice
            text="Don't pitch. Ask them to tell you about the last time this problem actually hit them. The more concrete their story, the stronger the signal. If they shrug, the problem isn't painful enough."
            type="mentor_voice"
          />
        </div>

        {/* Contact cards */}
        <div className="space-y-3 mb-6">
          {contacts.map((c) => (
            <ContactCard
              key={c.index}
              contact={c}
              expanded={expanded.has(c.index)}
              onToggle={() => toggle(c.index)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 -mx-6 px-6">
          {graduationError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span aria-hidden="true" className="text-red-600 shrink-0 mt-0.5">⚠️</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-800">
                      Couldn't continue to Discovery
                    </p>
                    <p className="text-sm text-red-700 mt-0.5 break-words">{graduationError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGraduationError(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium shrink-0"
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <GateSummary done={done} confirmed={confirmed} solving={solving} passed={gatePassed} />
            <button
              onClick={handleGraduate}
              disabled={!gatePassed || graduating}
              className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {graduating ? 'Setting up...' : 'Continue to Discovery →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function GateSummary({
  done,
  confirmed,
  solving,
  passed,
}: {
  done: number;
  confirmed: number;
  solving: number;
  passed: boolean;
}) {
  if (passed) {
    return (
      <div className="text-sm">
        <span className="text-green-600 font-semibold">Ready for Discovery.</span>{' '}
        <span className="text-slate-600">
          3 conversations done. {confirmed} confirmed the problem, {solving} are actively solving it.
        </span>
      </div>
    );
  }

  const remaining = Math.max(0, 3 - done);
  return (
    <div className="text-sm text-slate-600">
      {done} of 3 conversations done. Need {remaining} more to continue.
    </div>
  );
}

export default function SanityCheckPage() {
  return (
    <SanityCheckProvider>
      <SanityCheckContent />
    </SanityCheckProvider>
  );
}
