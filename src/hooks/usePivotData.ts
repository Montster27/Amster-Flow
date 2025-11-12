import { useEffect, useState, useRef, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { PivotDecision } from '../types/pivot';
import { PivotContext } from '../contexts/PivotContext';
import { captureException } from '../lib/sentry';

/**
 * Hook to sync Pivot decision data with Supabase database
 * Handles loading, auto-saving (with debounce), and error states
 *
 * Similar pattern to useDiscoveryData and useVisualSectorMapData
 */
export function usePivotData(projectId?: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Get context to access and update decision data
  const context = useContext(PivotContext);
  if (!context) {
    throw new Error('usePivotData must be used within PivotProvider');
  }

  const { currentDecision } = context;
  // Access the internal setState to load data from database
  const setCurrentDecision = (context as any).setCurrentDecision;

  // Load pivot decisions from database on mount
  useEffect(() => {
    if (!projectId || !user || initialLoadRef.current) return;

    const loadPivotData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the most recent uncompleted decision or create new one
        const { data, error: fetchError } = await supabase
          .from('project_pivot_decisions')
          .select('*')
          .eq('project_id', projectId)
          .is('completed_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          throw fetchError;
        }

        if (data) {
          // Convert database format to TypeScript format
          const pivotDecision: PivotDecision = {
            id: data.id,
            projectId: data.project_id,
            mode: data.mode as 'easy' | 'detailed',
            iterationId: data.iteration_id || undefined,
            decision: data.decision as 'proceed' | 'patch' | 'pivot' | null,

            // Cognitive debiasing
            preMortemInsights: data.pre_mortem_insights || [],
            contradictoryEvidence: (data.contradictory_evidence as any) || [],
            reframingResponses: (data.reframing_responses as any) || {
              inheritanceQuestion: '',
              contradictionQuestion: '',
              temporalQuestion: '',
            },

            // Quantitative metrics
            productMarketFit: (data.product_market_fit as any) || undefined,
            retentionMetrics: (data.retention_metrics as any) || undefined,
            unitEconomics: (data.unit_economics as any) || undefined,

            // Qualitative insights
            jobsToBeDone: (data.jobs_to_be_done as any) || undefined,
            painPoints: (data.pain_points as any) || [],
            customerQuotes: (data.customer_quotes as any) || [],

            // Decision rationale
            hypothesisTested: (data.hypothesis_tested as any) || undefined,
            decisionRationale: data.decision_rationale || '',
            nextActions: data.next_actions || [],

            // Confidence assessment
            confidenceAssessment: (data.confidence_assessment as any) || undefined,

            // PIVOT readiness
            pivotReadiness: (data.pivot_readiness as any) || undefined,
            recommendedPivotType: (data.recommended_pivot_type as any) || undefined,

            // Reflection
            lessonsLearned: data.lessons_learned || [],
            biasesIdentified: (data.biases_identified as any) || [],
            confidenceLevel: data.confidence_level || 50,

            // Meta-data
            createdAt: data.created_at || '',
            updatedAt: data.updated_at || '',
            completedAt: data.completed_at || undefined,
            timeSpentMinutes: data.time_spent_minutes || 0,
            externalAdvisorsConsulted: data.external_advisors_consulted || [],
          };

          setCurrentDecision(pivotDecision);
        } else {
          // No existing decision - set to null so user can choose mode
          // Don't create database record yet - wait for mode selection
          setCurrentDecision(null);
        }

        initialLoadRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading pivot data');
        captureException(error, {
          extra: { projectId, context: 'usePivotData load' },
        });
        setError('Failed to load pivot decision data');
      } finally {
        setLoading(false);
      }
    };

    loadPivotData();
  }, [projectId, user]);

  // Auto-save to database when currentDecision changes (with 1-second debounce)
  useEffect(() => {
    if (!projectId || !user || !currentDecision || !initialLoadRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Convert TypeScript format to database format
        const { error: updateError } = await supabase
          .from('project_pivot_decisions')
          .update({
            mode: currentDecision.mode,
            iteration_id: currentDecision.iterationId,
            decision: currentDecision.decision,

            // Cognitive debiasing
            pre_mortem_insights: currentDecision.preMortemInsights,
            contradictory_evidence: currentDecision.contradictoryEvidence as any,
            reframing_responses: currentDecision.reframingResponses as any,

            // Quantitative metrics
            product_market_fit: currentDecision.productMarketFit as any,
            retention_metrics: currentDecision.retentionMetrics as any,
            unit_economics: currentDecision.unitEconomics as any,

            // Qualitative insights
            jobs_to_be_done: currentDecision.jobsToBeDone as any,
            pain_points: currentDecision.painPoints as any,
            customer_quotes: currentDecision.customerQuotes as any,

            // Decision rationale
            hypothesis_tested: currentDecision.hypothesisTested as any,
            decision_rationale: currentDecision.decisionRationale,
            next_actions: currentDecision.nextActions,

            // Confidence assessment
            confidence_assessment: currentDecision.confidenceAssessment as any,

            // PIVOT readiness
            pivot_readiness: currentDecision.pivotReadiness as any,
            recommended_pivot_type: currentDecision.recommendedPivotType,

            // Reflection
            lessons_learned: currentDecision.lessonsLearned,
            biases_identified: currentDecision.biasesIdentified,
            confidence_level: currentDecision.confidenceLevel,

            // Meta-data
            completed_at: currentDecision.completedAt,
            time_spent_minutes: currentDecision.timeSpentMinutes,
            external_advisors_consulted: currentDecision.externalAdvisorsConsulted,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDecision.id);

        if (updateError) {
          captureException(new Error('Error auto-saving pivot data'), {
            extra: {
              updateError,
              pivotDecisionId: currentDecision.id,
              projectId,
              context: 'usePivotData auto-save',
            },
          });
          setError('Failed to save pivot decision data');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error auto-saving pivot data');
        captureException(error, {
          extra: {
            pivotDecisionId: currentDecision.id,
            projectId,
            context: 'usePivotData auto-save',
          },
        });
        setError('Failed to save pivot decision data');
      }
    }, 1000); // 1-second debounce

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, user, currentDecision]);

  return { loading, error };
}
