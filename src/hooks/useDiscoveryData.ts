import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useDiscovery } from '../contexts/DiscoveryContext';
import type { Assumption, Interview, Iteration, AssumptionType, AssumptionStatus } from '../types/discovery';

/**
 * Hook to sync discovery data (assumptions, interviews, iterations) with Supabase
 * Loads data on mount and saves changes to database
 */
export function useDiscoveryData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { assumptions, interviews, iterations, importData, reset } = useDiscovery();
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

        // Load interviews
        const { data: interviewsData, error: interviewsError } = await supabase
          .from('project_interviews')
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
          created: row.created_at,
          lastUpdated: row.updated_at,
          status: row.status as AssumptionStatus,
          confidence: (row.confidence || 3) as 1 | 2 | 3 | 4 | 5,
          evidence: row.evidence || [],
        }));

        const interviews: Interview[] = (interviewsData || []).map(row => ({
          id: row.id,
          date: row.date,
          customerSegment: row.customer_segment,
          interviewee: row.interviewee || undefined,
          intervieweeType: row.interviewee_type || undefined,
          format: row.format || 'in-person',
          duration: row.duration || undefined,
          notes: row.notes || '',
          assumptionsAddressed: row.assumptions_addressed || [],
          keyInsights: row.key_insights || [],
          surprises: row.surprises || undefined,
          nextAction: row.next_action || undefined,
          followUpNeeded: row.follow_up_needed || false,
        }));

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
        console.error('Error loading discovery data:', err);
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

        // Delete all existing assumptions for this project
        await supabase
          .from('project_assumptions')
          .delete()
          .eq('project_id', projectId);

        // Insert all current assumptions
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
            .insert(rows);
        }
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

        // Delete all existing interviews for this project
        await supabase
          .from('project_interviews')
          .delete()
          .eq('project_id', projectId);

        // Insert all current interviews
        if (interviews.length > 0) {
          const rows = interviews.map(interview => ({
            id: interview.id,
            project_id: projectId,
            date: interview.date,
            customer_segment: interview.customerSegment,
            interviewee: interview.interviewee || null,
            interviewee_type: interview.intervieweeType || null,
            format: interview.format,
            duration: interview.duration || null,
            notes: interview.notes,
            assumptions_addressed: interview.assumptionsAddressed,
            key_insights: interview.keyInsights,
            surprises: interview.surprises || null,
            next_action: interview.nextAction || null,
            follow_up_needed: interview.followUpNeeded,
            created_by: user.id,
          }));

          await supabase
            .from('project_interviews')
            .insert(rows);
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveInterviews, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, interviews, loading]);

  // Save iterations to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveIterations = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Delete all existing iterations for this project
        await supabase
          .from('project_iterations')
          .delete()
          .eq('project_id', projectId);

        // Insert all current iterations
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
            .insert(rows);
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
