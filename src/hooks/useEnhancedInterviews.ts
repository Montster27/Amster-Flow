import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { EnhancedInterview, IntervieweeTypeEnhanced, AssumptionTag, ConfidenceLevel, InterviewStatus } from '../types/discovery';
import { captureException } from '../lib/sentry';

/**
 * Hook to manage enhanced interviews with Supabase
 * Loads enhanced interviews and provides CRUD operations
 */
export function useEnhancedInterviews(projectId: string | undefined) {
  const [interviews, setInterviews] = useState<EnhancedInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const initialLoadRef = useRef(false);

  // Load enhanced interviews from database
  const loadInterviews = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setInterviews([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('project_interviews_enhanced')
        .select('*')
        .eq('project_id', projectId)
        .order('interview_date', { ascending: false });

      if (interviewsError) throw interviewsError;

      // Load assumption tags for all interviews
      const interviewIds = (interviewsData || []).map(i => i.id);
      const { data: tagsData, error: tagsError } = interviewIds.length > 0
        ? await supabase
            .from('interview_assumption_tags')
            .select('*')
            .in('interview_id', interviewIds)
        : { data: [], error: null };

      if (tagsError) throw tagsError;

      // Group tags by interview
      const tagsByInterview = new Map<string, AssumptionTag[]>();
      (tagsData || []).forEach(tag => {
        const tags = tagsByInterview.get(tag.interview_id) || [];
        tags.push({
          assumptionId: tag.assumption_id,
          validationEffect: tag.validation_effect as 'supports' | 'contradicts' | 'neutral',
          confidenceChange: tag.confidence_change,
          quote: tag.supporting_quote || undefined,
        });
        tagsByInterview.set(tag.interview_id, tags);
      });

      // Convert to EnhancedInterview format
      const interviews: EnhancedInterview[] = (interviewsData || []).map(row => ({
        id: row.id,
        intervieweeType: row.interviewee_type as IntervieweeTypeEnhanced,
        segmentName: row.segment_name,
        date: row.interview_date,
        context: row.context,
        status: row.status as InterviewStatus,
        mainPainPoints: row.main_pain_points,
        problemImportance: row.problem_importance as ConfidenceLevel,
        problemImportanceQuote: row.problem_importance_quote || undefined,
        currentAlternatives: row.current_alternatives,
        memorableQuotes: row.memorable_quotes || [],
        surprisingFeedback: row.surprising_feedback || '',
        assumptionTags: tagsByInterview.get(row.id) || [],
        studentReflection: row.student_reflection || '',
        mentorFeedback: row.mentor_feedback || undefined,
        created: row.created_at || new Date().toISOString(),
        lastUpdated: row.updated_at || new Date().toISOString(),
      }));

      setInterviews(interviews);
      initialLoadRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error loading enhanced interviews');
      captureException(error, {
        extra: { projectId, context: 'useEnhancedInterviews load' },
      });
      setError('Failed to load enhanced interviews');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load on mount and when projectId changes
  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  // Add new interview
  const addInterview = useCallback(async (
    interviewData: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'>
  ): Promise<EnhancedInterview | null> => {
    if (!projectId || !user) return null;

    try {
      const now = new Date().toISOString();

      // Insert interview
      const { data: newInterview, error: insertError } = await supabase
        .from('project_interviews_enhanced')
        .insert({
          project_id: projectId,
          interviewee_type: interviewData.intervieweeType,
          segment_name: interviewData.segmentName,
          interview_date: interviewData.date,
          context: interviewData.context,
          status: interviewData.status,
          main_pain_points: interviewData.mainPainPoints,
          problem_importance: interviewData.problemImportance,
          problem_importance_quote: interviewData.problemImportanceQuote || null,
          current_alternatives: interviewData.currentAlternatives,
          memorable_quotes: interviewData.memorableQuotes,
          surprising_feedback: interviewData.surprisingFeedback,
          student_reflection: interviewData.studentReflection,
          mentor_feedback: interviewData.mentorFeedback || null,
          created_by: user.id,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newInterview) throw new Error('Failed to create interview');

      // Insert assumption tags
      if (interviewData.assumptionTags.length > 0) {
        const tagRows = interviewData.assumptionTags.map(tag => ({
          interview_id: newInterview.id,
          assumption_id: tag.assumptionId,
          validation_effect: tag.validationEffect,
          confidence_change: tag.confidenceChange,
          supporting_quote: tag.quote || null,
        }));

        const { error: tagsError } = await supabase
          .from('interview_assumption_tags')
          .insert(tagRows);

        if (tagsError) throw tagsError;
      }

      // Reload interviews
      await loadInterviews();

      return {
        ...interviewData,
        id: newInterview.id,
        created: newInterview.created_at || now,
        lastUpdated: newInterview.updated_at || now,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error adding interview');
      captureException(error, {
        extra: { projectId, context: 'useEnhancedInterviews add' },
      });
      setError('Failed to add interview');
      return null;
    }
  }, [projectId, user, loadInterviews]);

  // Update existing interview
  const updateInterview = useCallback(async (
    id: string,
    interviewData: Omit<EnhancedInterview, 'id' | 'created' | 'lastUpdated'>
  ): Promise<boolean> => {
    if (!projectId || !user) return false;

    try {
      const now = new Date().toISOString();

      // Update interview
      const { error: updateError } = await supabase
        .from('project_interviews_enhanced')
        .update({
          interviewee_type: interviewData.intervieweeType,
          segment_name: interviewData.segmentName,
          interview_date: interviewData.date,
          context: interviewData.context,
          status: interviewData.status,
          main_pain_points: interviewData.mainPainPoints,
          problem_importance: interviewData.problemImportance,
          problem_importance_quote: interviewData.problemImportanceQuote || null,
          current_alternatives: interviewData.currentAlternatives,
          memorable_quotes: interviewData.memorableQuotes,
          surprising_feedback: interviewData.surprisingFeedback,
          student_reflection: interviewData.studentReflection,
          mentor_feedback: interviewData.mentorFeedback || null,
          updated_at: now,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete existing tags
      await supabase
        .from('interview_assumption_tags')
        .delete()
        .eq('interview_id', id);

      // Insert new tags
      if (interviewData.assumptionTags.length > 0) {
        const tagRows = interviewData.assumptionTags.map(tag => ({
          interview_id: id,
          assumption_id: tag.assumptionId,
          validation_effect: tag.validationEffect,
          confidence_change: tag.confidenceChange,
          supporting_quote: tag.quote || null,
        }));

        const { error: tagsError } = await supabase
          .from('interview_assumption_tags')
          .insert(tagRows);

        if (tagsError) throw tagsError;
      }

      // Reload interviews
      await loadInterviews();

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error updating interview');
      captureException(error, {
        extra: { projectId, interviewId: id, context: 'useEnhancedInterviews update' },
      });
      setError('Failed to update interview');
      return false;
    }
  }, [projectId, user, loadInterviews]);

  // Delete interview
  const deleteInterview = useCallback(async (id: string): Promise<boolean> => {
    if (!projectId) return false;

    try {
      // Delete assumption tags first (cascade should handle this, but being explicit)
      await supabase
        .from('interview_assumption_tags')
        .delete()
        .eq('interview_id', id);

      // Delete interview
      const { error: deleteError } = await supabase
        .from('project_interviews_enhanced')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Reload interviews
      await loadInterviews();

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error deleting interview');
      captureException(error, {
        extra: { projectId, interviewId: id, context: 'useEnhancedInterviews delete' },
      });
      setError('Failed to delete interview');
      return false;
    }
  }, [projectId, loadInterviews]);

  return {
    interviews,
    loading,
    error,
    addInterview,
    updateInterview,
    deleteInterview,
    reload: loadInterviews,
  };
}
