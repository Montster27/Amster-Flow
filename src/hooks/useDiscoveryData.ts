import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useDiscovery } from '../contexts/DiscoveryContext';
import type {
  Assumption,
  EnhancedInterview,
  AssumptionType,
  AssumptionStatus,
  CanvasArea,
  PriorityLevel,
  ConfidenceLevel,
  IntervieweeTypeEnhanced,
  AssumptionTag,
} from '../types/discovery';
import { captureException } from '../lib/sentry';

/**
 * Hook to sync Discovery data with Supabase
 * Loads assumptions on mount and saves changes to database
 */
export function useDiscoveryData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { assumptions, interviews, importData, reset } = useDiscovery();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load Discovery data from Supabase on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadDiscoveryData = async () => {
      try {
        // Reset store immediately when projectId changes to clear old data
        reset();
        initialLoadRef.current = false;

        setLoading(true);
        setError(null);

        // Load assumptions with Discovery fields
        const { data: assumptionsData, error: assumptionsError } = await supabase
          .from('project_assumptions')
          .select('*')
          .eq('project_id', projectId);

        if (assumptionsError) throw assumptionsError;

        // Convert database rows to Assumption format
        // Filter to only include assumptions with canvas_area (Discovery assumptions)
        const assumptions: Assumption[] = (assumptionsData || [])
          .filter(row => (row as any).canvas_area) // Client-side filter for Discovery assumptions
          .map(row => ({
          id: row.id,
          type: row.type as AssumptionType,
          description: row.description,
          created: row.created_at || new Date().toISOString(),
          lastUpdated: row.updated_at || new Date().toISOString(),
          status: row.status as AssumptionStatus,
          confidence: (row.confidence || 3) as ConfidenceLevel,
          evidence: row.evidence || [],

          // Discovery specific fields (use type assertion to handle missing properties)
          canvasArea: (row as any).canvas_area as CanvasArea,
          importance: ((row as any).importance || 3) as ConfidenceLevel,
          priority: ((row as any).priority || 'medium') as PriorityLevel,
          riskScore: (row as any).risk_score || undefined,
          interviewCount: (row as any).interview_count || 0,
          lastTestedDate: (row as any).last_tested_date || undefined,

          // System Structure integration fields
          linkedActorIds: (row as any).linked_actor_ids || [],
          linkedConnectionIds: (row as any).linked_connection_ids || [],
        }));

        // Load enhanced interviews
        const { data: interviewsData, error: interviewsError } = await supabase
          .from('project_interviews_enhanced')
          .select('*')
          .eq('project_id', projectId);

        if (interviewsError) throw interviewsError;

        // Convert database rows to EnhancedInterview format
        const interviews: EnhancedInterview[] = (interviewsData || []).map(row => ({
          id: row.id,
          intervieweeType: row.interviewee_type as IntervieweeTypeEnhanced,
          segmentName: row.segment_name,
          date: row.interview_date,
          context: row.context || '',
          status: row.status as 'draft' | 'completed',
          mainPainPoints: row.main_pain_points,
          problemImportance: row.problem_importance as ConfidenceLevel,
          problemImportanceQuote: row.problem_importance_quote || undefined,
          currentAlternatives: row.current_alternatives,
          memorableQuotes: row.memorable_quotes || [],
          surprisingFeedback: row.surprising_feedback || '',
          assumptionTags: (row as any).assumption_tags as AssumptionTag[] || [],
          studentReflection: row.student_reflection || '',
          mentorFeedback: row.mentor_feedback || undefined,
          created: row.created_at || new Date().toISOString(),
          lastUpdated: row.updated_at || new Date().toISOString(),
        }));

        // Import into store
        importData({ assumptions, interviews });
        initialLoadRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading Discovery data');
        captureException(error, {
          extra: { projectId, context: 'useDiscoveryData load' },
        });
        setError('Failed to load Discovery data');
      } finally {
        setLoading(false);
      }
    };

    loadDiscoveryData();
  }, [projectId, importData, reset]);

  // Save assumptions to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveAssumptions = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Upsert all current Discovery assumptions
        if (assumptions.length > 0) {
          const rows = assumptions.map(assumption => ({
            id: assumption.id,
            project_id: projectId,
            type: assumption.type,
            description: assumption.description,
            status: assumption.status,
            confidence: assumption.confidence,
            evidence: assumption.evidence,
            created_at: assumption.created,
            updated_at: assumption.lastUpdated,
            created_by: user.id,

            // Discovery specific fields
            canvas_area: assumption.canvasArea,
            importance: assumption.importance,
            priority: assumption.priority,
            risk_score: assumption.riskScore,
            interview_count: assumption.interviewCount,
            last_tested_date: assumption.lastTestedDate,

            // System Structure integration fields
            linked_actor_ids: assumption.linkedActorIds || [],
            linked_connection_ids: assumption.linkedConnectionIds || [],
          } as any)); // Type assertion to allow new fields

          await supabase
            .from('project_assumptions')
            .upsert(rows, { onConflict: 'id' });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error saving Discovery data');
        captureException(error, {
          extra: { projectId, context: 'useDiscoveryData save' },
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveAssumptions, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, assumptions, loading]);

  // Save interviews to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveInterviews = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Upsert all current enhanced interviews
        if (interviews.length > 0) {
          const rows = interviews.map(interview => ({
            id: interview.id,
            project_id: projectId,
            interviewee_type: interview.intervieweeType,
            segment_name: interview.segmentName,
            interview_date: interview.date,
            context: interview.context,
            status: interview.status,
            main_pain_points: interview.mainPainPoints,
            problem_importance: interview.problemImportance,
            problem_importance_quote: interview.problemImportanceQuote,
            current_alternatives: interview.currentAlternatives,
            memorable_quotes: interview.memorableQuotes,
            surprising_feedback: interview.surprisingFeedback,
            assumption_tags: interview.assumptionTags,
            student_reflection: interview.studentReflection,
            mentor_feedback: interview.mentorFeedback,
            created_at: interview.created,
            updated_at: interview.lastUpdated,
            created_by: user.id,
          } as any)); // Type assertion to allow new fields

          await supabase
            .from('project_interviews_enhanced')
            .upsert(rows, { onConflict: 'id' });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error saving interviews');
        captureException(error, {
          extra: { projectId, context: 'useDiscoveryData save interviews' },
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveInterviews, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, interviews, loading]);

  return { loading, error };
}
