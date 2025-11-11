import { useEffect, useState, useRef, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { PivotDecision } from '../types/pivot';
import { PivotContext } from '../contexts/PivotContext';

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
            iterationId: data.iteration_id,
            decision: data.decision as 'proceed' | 'patch' | 'pivot' | null,

            // Cognitive debiasing
            preMortemInsights: data.pre_mortem_insights || [],
            contradictoryEvidence: data.contradictory_evidence || [],
            reframingResponses: data.reframing_responses || {
              inheritanceQuestion: '',
              contradictionQuestion: '',
              temporalQuestion: '',
            },

            // Quantitative metrics
            productMarketFit: data.product_market_fit,
            retentionMetrics: data.retention_metrics,
            unitEconomics: data.unit_economics,

            // Qualitative insights
            jobsToBeDone: data.jobs_to_be_done,
            painPoints: data.pain_points || [],
            customerQuotes: data.customer_quotes || [],

            // Decision rationale
            hypothesisTested: data.hypothesis_tested,
            decisionRationale: data.decision_rationale || '',
            nextActions: data.next_actions || [],

            // Confidence assessment
            confidenceAssessment: data.confidence_assessment,

            // PIVOT readiness
            pivotReadiness: data.pivot_readiness,
            recommendedPivotType: data.recommended_pivot_type,

            // Reflection
            lessonsLearned: data.lessons_learned || [],
            biasesIdentified: data.biases_identified || [],
            confidenceLevel: data.confidence_level || 50,

            // Meta-data
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            completedAt: data.completed_at,
            timeSpentMinutes: data.time_spent_minutes || 0,
            externalAdvisorsConsulted: data.external_advisors_consulted || [],
          };

          setCurrentDecision(pivotDecision);
        } else {
          // No existing decision, create a new one
          const newDecision: Partial<PivotDecision> = {
            projectId: projectId,
            mode: 'easy',
            decision: null,
            preMortemInsights: [],
            contradictoryEvidence: [],
            reframingResponses: {
              inheritanceQuestion: '',
              contradictionQuestion: '',
              temporalQuestion: '',
            },
            decisionRationale: '',
            nextActions: [],
            lessonsLearned: [],
            biasesIdentified: [],
            confidenceLevel: 50,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timeSpentMinutes: 0,
            externalAdvisorsConsulted: [],
            painPoints: [],
            customerQuotes: [],
          };

          // Insert new decision into database
          const { data: insertedData, error: insertError } = await supabase
            .from('project_pivot_decisions')
            .insert({
              project_id: projectId,
              mode: newDecision.mode,
              decision: newDecision.decision,
              pre_mortem_insights: newDecision.preMortemInsights,
              contradictory_evidence: newDecision.contradictoryEvidence,
              reframing_responses: newDecision.reframingResponses,
              decision_rationale: newDecision.decisionRationale,
              next_actions: newDecision.nextActions,
              lessons_learned: newDecision.lessonsLearned,
              biases_identified: newDecision.biasesIdentified,
              confidence_level: newDecision.confidenceLevel,
              time_spent_minutes: newDecision.timeSpentMinutes,
              external_advisors_consulted: newDecision.externalAdvisorsConsulted,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (insertedData) {
            const pivotDecision: PivotDecision = {
              ...newDecision as PivotDecision,
              id: insertedData.id,
            };
            setCurrentDecision(pivotDecision);
          }
        }

        initialLoadRef.current = true;
      } catch (err) {
        console.error('Error loading pivot data:', err);
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
            contradictory_evidence: currentDecision.contradictoryEvidence,
            reframing_responses: currentDecision.reframingResponses,

            // Quantitative metrics
            product_market_fit: currentDecision.productMarketFit,
            retention_metrics: currentDecision.retentionMetrics,
            unit_economics: currentDecision.unitEconomics,

            // Qualitative insights
            jobs_to_be_done: currentDecision.jobsToBeDone,
            pain_points: currentDecision.painPoints,
            customer_quotes: currentDecision.customerQuotes,

            // Decision rationale
            hypothesis_tested: currentDecision.hypothesisTested,
            decision_rationale: currentDecision.decisionRationale,
            next_actions: currentDecision.nextActions,

            // Confidence assessment
            confidence_assessment: currentDecision.confidenceAssessment,

            // PIVOT readiness
            pivot_readiness: currentDecision.pivotReadiness,
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
          console.error('Error auto-saving pivot data:', updateError);
          setError('Failed to save pivot decision data');
        }
      } catch (err) {
        console.error('Error auto-saving pivot data:', err);
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
