import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useDiscovery } from '../contexts/DiscoveryContext';
import type { Assumption, Interview, Iteration, AssumptionType, AssumptionStatus, IntervieweeType, InterviewFormat } from '../types/discovery';
import { captureException } from '../lib/sentry';

/**
 * Hook to sync discovery data (assumptions, interviews, iterations) with Supabase
 * Loads data on mount and saves changes to database
 */
export function useDiscoveryData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { assumptions, iterations, importData, reset } = useDiscovery();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load discovery data from Supabase on mount
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

        // Load assumptions
        const { data: assumptionsData, error: assumptionsError } = await supabase
          .from('project_assumptions')
          .select('*')
          .eq('project_id', projectId);

        if (assumptionsError) throw assumptionsError;

        // Load interviews from enhanced table
        const { data: interviewsData, error: interviewsError } = await supabase
          .from('project_interviews_enhanced')
          .select('*')
          .eq('project_id', projectId);

        if (interviewsError) throw interviewsError;

        // Load iterations
        const { data: iterationsData, error: iterationsError } = await supabase
          .from('project_iterations')
          .select('*')
          .eq('project_id', projectId);

        if (iterationsError) throw iterationsError;

        // Convert database rows to app format
        const assumptions: Assumption[] = (assumptionsData || []).map(row => ({
          id: row.id,
          type: row.type as AssumptionType,
          description: row.description,
          cluster: (row.cluster || 'problem') as 'customer' | 'problem' | 'solution',
          created: row.created_at || new Date().toISOString(),
          lastUpdated: row.updated_at || new Date().toISOString(),
          status: row.status as AssumptionStatus,
          confidence: (row.confidence || 3) as 1 | 2 | 3 | 4 | 5,
          evidence: row.evidence || [],
        }));

        const interviews: Interview[] = (interviewsData || []).map(row => {
          // Map enhanced interview fields to basic Interview type
          const noteParts = [
            row.context || '',
            row.main_pain_points ? `Main Pain Points: ${row.main_pain_points}` : '',
            row.current_alternatives ? `Current Alternatives: ${row.current_alternatives}` : '',
            row.student_reflection || '',
          ].filter(Boolean);

          return {
            id: row.id,
            date: row.interview_date || new Date().toISOString(),
            customerSegment: row.segment_name || 'Unknown',
            interviewee: undefined, // Enhanced table uses interviewee_type instead
            intervieweeType: row.interviewee_type ? row.interviewee_type as IntervieweeType : undefined,
            format: 'in-person' as InterviewFormat, // Enhanced table doesn't have format field
            duration: undefined, // Enhanced table doesn't have duration field
            notes: noteParts.join('\n\n'),
            assumptionsAddressed: [], // Assumption tags are in separate table
            keyInsights: row.memorable_quotes || [],
            surprises: row.surprising_feedback || undefined,
            nextAction: undefined, // Enhanced table doesn't have next_action field
            followUpNeeded: false, // Enhanced table doesn't have follow_up_needed field
            status: row.status as 'draft' | 'completed' | undefined,
          };
        });

        const iterations: Iteration[] = (iterationsData || []).map(row => ({
          id: row.id,
          version: row.version,
          date: row.date,
          changes: row.changes || '',
          reasoning: row.reasoning || '',
          assumptionsAffected: row.assumptions_affected || [],
          patternsObserved: row.patterns_observed || undefined,
          riskiestAssumption: row.riskiest_assumption || undefined,
          nextExperiment: row.next_experiment || undefined,
        }));

        // Import into store
        importData({ assumptions, interviews, iterations });
        initialLoadRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading discovery data');
        captureException(error, {
          extra: { projectId, context: 'useDiscoveryData load' },
        });
        setError('Failed to load discovery data');
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

        // Upsert all current assumptions (more efficient than delete-and-insert)
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
          }));

          await supabase
            .from('project_assumptions')
            .upsert(rows, { onConflict: 'id' });
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveAssumptions, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, assumptions, loading]);

  // NOTE: Interview saving removed - interviews are now managed exclusively through
  // useEnhancedInterviews hook and project_interviews_enhanced table.
  // This prevents duplicate interview systems and data fragmentation.
  // The DiscoveryContext still holds interview state for display purposes,
  // but persistence is handled by the Enhanced Interview System.

  // Save iterations to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveIterations = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Upsert all current iterations (more efficient than delete-and-insert)
        if (iterations.length > 0) {
          const rows = iterations.map(iteration => ({
            id: iteration.id,
            project_id: projectId,
            version: iteration.version,
            date: iteration.date,
            changes: iteration.changes,
            reasoning: iteration.reasoning,
            assumptions_affected: iteration.assumptionsAffected,
            patterns_observed: iteration.patternsObserved || null,
            riskiest_assumption: iteration.riskiestAssumption || null,
            next_experiment: iteration.nextExperiment || null,
            created_by: user.id,
          }));

          await supabase
            .from('project_iterations')
            .upsert(rows, { onConflict: 'id' });
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveIterations, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, iterations, loading]);

  return { loading, error };
}
