import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuickCheckProvider, useQuickCheckStore, type QuickCheckSegment } from './quickCheckStore';
import { useQuickCheckData } from '../../hooks/useQuickCheckData';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { MentorVoice } from '../../components/ui/MentorVoice';
import { JourneyProgress } from '../../components/ui/JourneyProgress';

function SegmentCard({
  segment,
  expanded,
  onToggle,
}: {
  segment: QuickCheckSegment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { updateSegmentField, updateSegmentContact } = useQuickCheckStore();

  return (
    <div className={`rounded-xl border-2 ${segment.isBeachhead ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-white'} overflow-hidden`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-5 py-4 flex items-center justify-between ${segment.isBeachhead ? 'bg-blue-50' : 'bg-slate-50'}`}
      >
        <div className="flex items-center gap-3">
          {segment.isBeachhead && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">STARTING POINT</span>
          )}
          {!segment.isBeachhead && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-300 text-slate-700">PARKED</span>
          )}
          <span className="font-semibold text-slate-800">{segment.segmentName}</span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-5 space-y-5">
          {/* Problem */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Describe their pain in their words — as if you are them {segment.isBeachhead && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              rows={3}
              placeholder={`"I'm frustrated because..." or "Every week I waste time on..."`}
              value={segment.problem}
              onChange={(e) => updateSegmentField(segment.segmentId, 'problem', e.target.value)}
            />
          </div>

          {/* Contacts */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Name up to 3 people you could interview {segment.isBeachhead && <span className="text-red-500">*</span>}
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Start with anyone you know who's close to this problem. Even one name is a start — interview them and ask for intros to others like them.
            </p>
            <div className="space-y-2">
              {segment.contacts.map((contact, i) => (
                <input
                  key={i}
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder={i === 0 ? 'Someone you know with this problem' : i === 1 ? 'Ask person 1 for an intro' : 'Use LinkedIn to find someone via a mutual connection'}
                  value={contact}
                  onChange={(e) => updateSegmentContact(segment.segmentId, i, e.target.value)}
                />
              ))}
            </div>
            <MentorVoice
              text="Start with anyone you know — even if they're not the perfect customer. Interview them, then ask: 'Who else do you know that deals with this?' Each conversation should open the door to the next one. If you're stuck, search LinkedIn for people in this role and ask a mutual connection for an intro."
              type="tip"
              className="mt-2"
            />
          </div>

          {/* Solution */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              What's the simplest thing you could build or do to test this? {segment.isBeachhead && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              rows={2}
              placeholder="A landing page, a manual service, a prototype, a spreadsheet..."
              value={segment.solution}
              onChange={(e) => updateSegmentField(segment.segmentId, 'solution', e.target.value)}
            />
          </div>

          {/* Auto-generated Hypothesis */}
          {(segment.problem || segment.solution) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Your Testable Hypothesis</p>
              <p className="text-sm text-green-900 italic">
                {segment.hypothesis || 'Fill in the problem and solution to generate your hypothesis.'}
              </p>
            </div>
          )}

          {!segment.isBeachhead && (
            <p className="text-xs text-slate-500 italic">
              Parked — come back to this segment if your beachhead doesn't validate.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function QuickCheckContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error } = useQuickCheckData(projectId);
  const {
    segments,
    canGraduate,
    setBeachheadCompleted,
    getBeachhead,
    getParkedSegments,
    exportData,
  } = useQuickCheckStore();

  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(() => {
    // Beachhead starts expanded
    const beachhead = segments.find((s) => s.isBeachhead);
    return new Set(beachhead ? [beachhead.segmentId] : []);
  });
  const [graduating, setGraduating] = useState(false);
  const [graduationError, setGraduationError] = useState<string | null>(null);

  // Expand beachhead when segments load
  const beachhead = getBeachhead();
  if (beachhead && !expandedSegments.has(beachhead.segmentId) && segments.length > 0 && expandedSegments.size === 0) {
    setExpandedSegments(new Set([beachhead.segmentId]));
  }

  const toggleSegment = (segmentId: number) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) next.delete(segmentId);
      else next.add(segmentId);
      return next;
    });
  };

  const handleGraduate = async () => {
    if (!projectId || !canGraduate()) return;
    setGraduating(true);
    setGraduationError(null);
    try {
      const qcData = exportData();

      // Store parked segments in beachhead_data for later reference
      const parkedSegments = qcData.segments
        .filter((s) => !s.isBeachhead)
        .map((s) => ({
          segmentId: s.segmentId,
          segmentName: s.segmentName,
          problem: s.problem,
          solution: s.solution,
          hypothesis: s.hypothesis,
        }));

      const { data: projectData, error: projectLoadError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectLoadError) {
        setGraduationError(`Could not update project metadata: ${projectLoadError.message}`);
        return;
      }

      if (projectData) {
        const existingBeachhead = (projectData as any).beachhead_data || {};
        const { error: projectUpdateError } = await supabase
          .from('projects')
          .update({
            beachhead_data: {
              ...existingBeachhead,
              parkedSegments,
              quickCheckCompleted: true,
            },
          } as any)
          .eq('id', projectId);

        if (projectUpdateError) {
          setGraduationError(`Could not update project metadata: ${projectUpdateError.message}`);
          return;
        }
      }

      // Persist `beachhead_completed: true` to project_quick_check BEFORE navigating.
      // Auto-save is debounced 1s and gets cancelled when this component unmounts,
      // so relying on it would drop the flag and bounce the user back.
      const { error: qcUpdateError } = await (supabase as any)
        .from('project_quick_check')
        .upsert(
          {
            project_id: projectId,
            segments: qcData.segments,
            beachhead_completed: true,
            updated_by: user?.id,
          },
          { onConflict: 'project_id' }
        );

      if (qcUpdateError) {
        setGraduationError(`Could not mark Quick Check complete: ${qcUpdateError.message}`);
        return;
      }

      setBeachheadCompleted(true);
      navigate(`/project/${projectId}/sanity-check`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error continuing to Sanity Check.';
      console.error('Quick Check → Sanity Check failed:', err);
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

  if (segments.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="py-12">
          <p className="text-lg text-slate-600 mb-4">Complete Step 0: First Look before starting Quick Check.</p>
          <button
            onClick={() => navigate(`/project/${projectId}/discovery/step-0`)}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Go to Step 0
          </button>
        </div>
      </div>
    );
  }

  const parked = getParkedSegments();

  return (
    <>
    <JourneyProgress currentStep="quickcheck" />
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Quick Check</h1>
        </div>
        <p className="text-sm text-slate-600">
          Before interviewing anyone, articulate what you're testing. For each segment, describe the problem, name real contacts, and define the simplest test.
        </p>
      </div>

      {/* Beachhead Segment (always first) */}
      {beachhead && (
        <div className="mb-4">
          <SegmentCard
            segment={beachhead}
            expanded={expandedSegments.has(beachhead.segmentId)}
            onToggle={() => toggleSegment(beachhead.segmentId)}
          />
        </div>
      )}

      {/* Parked Segments */}
      {parked.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Other segments ({parked.length}) — optional for now
          </p>
          <div className="space-y-3">
            {parked.map((seg) => (
              <SegmentCard
                key={seg.segmentId}
                segment={seg}
                expanded={expandedSegments.has(seg.segmentId)}
                onToggle={() => toggleSegment(seg.segmentId)}
              />
            ))}
          </div>
        </div>
      )}

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
                    Couldn't continue to Sanity Check
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {canGraduate() ? (
              <span className="text-green-600 font-medium">Ready for Sanity Check</span>
            ) : (
              <span>Fill in your starting point's problem, contacts, and solution to continue</span>
            )}
          </div>
          <button
            onClick={handleGraduate}
            disabled={!canGraduate() || graduating}
            className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {graduating ? 'Continuing...' : 'Continue to Sanity Check →'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default function QuickCheckPage() {
  return (
    <QuickCheckProvider>
      <QuickCheckContent />
    </QuickCheckProvider>
  );
}
