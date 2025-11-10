import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useSectorMap } from '../contexts/SectorMapContext';
import type { Competitor, DecisionMaker, FirstTarget, CustomerType } from '../types/sectorMap';

/**
 * Hook to sync sector map data with Supabase
 * Loads data on mount and saves changes to database
 */
export function useSectorMapData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const {
    customerType,
    firstTarget,
    competitors,
    decisionMakers,
    importData,
    reset,
  } = useSectorMap();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load sector map data from Supabase on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadSectorMapData = async () => {
      try {
        // Reset store immediately when projectId changes to clear old data
        reset();
        initialLoadRef.current = false;

        setLoading(true);
        setError(null);

        // Load first target (should be single row per project)
        const { data: firstTargetData, error: firstTargetError } = await supabase
          .from('project_first_target')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (firstTargetError) throw firstTargetError;

        // Load competitors
        const { data: competitorsData, error: competitorsError } = await supabase
          .from('project_competitors')
          .select('*')
          .eq('project_id', projectId);

        if (competitorsError) throw competitorsError;

        // Load decision makers
        const { data: decisionMakersData, error: decisionMakersError } = await supabase
          .from('project_decision_makers')
          .select('*')
          .eq('project_id', projectId);

        if (decisionMakersError) throw decisionMakersError;

        // Convert to app format and import
        const loadedCustomerType: CustomerType = (firstTargetData?.customer_type as CustomerType) || 'business';

        const loadedFirstTarget: FirstTarget = {
          description: firstTargetData?.description || '',
          companySize: firstTargetData?.company_size || '',
          location: firstTargetData?.location || '',
        };

        const loadedCompetitors: Competitor[] = (competitorsData || []).map(row => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          suppliers: row.suppliers || [],
          customers: row.customers || [],
          created: row.created_at || new Date().toISOString(),
        }));

        const loadedDecisionMakers: DecisionMaker[] = (decisionMakersData || []).map(row => ({
          id: row.id,
          role: row.role,
          influence: (row.influence || 'influencer') as 'decision-maker' | 'influencer' | 'payer',
          description: row.description || '',
          created: row.created_at || new Date().toISOString(),
        }));

        importData({
          customerType: loadedCustomerType,
          firstTarget: loadedFirstTarget,
          competitors: loadedCompetitors,
          decisionMakers: loadedDecisionMakers,
        });

        initialLoadRef.current = true;
      } catch (err) {
        console.error('Error loading sector map data:', err);
        setError('Failed to load sector map data');
      } finally {
        setLoading(false);
      }
    };

    loadSectorMapData();
  }, [projectId, importData, reset]);

  // Save first target and customer type to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveFirstTarget = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        await supabase
          .from('project_first_target')
          .upsert({
            project_id: projectId,
            customer_type: customerType,
            description: firstTarget.description || null,
            company_size: firstTarget.companySize || null,
            location: firstTarget.location || null,
            updated_by: user.id,
          }, {
            onConflict: 'project_id',
          });
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveFirstTarget, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, customerType, firstTarget, loading]);

  // Save competitors to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveCompetitors = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Delete all existing competitors for this project
        await supabase
          .from('project_competitors')
          .delete()
          .eq('project_id', projectId);

        // Insert all current competitors
        if (competitors.length > 0) {
          const rows = competitors.map(competitor => ({
            id: competitor.id,
            project_id: projectId,
            name: competitor.name,
            description: competitor.description || null,
            suppliers: competitor.suppliers,
            customers: competitor.customers,
            created_by: user.id,
            created_at: competitor.created,
          }));

          await supabase
            .from('project_competitors')
            .insert(rows);
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveCompetitors, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, competitors, loading]);

  // Save decision makers to Supabase whenever they change
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveDecisionMakers = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Delete all existing decision makers for this project
        await supabase
          .from('project_decision_makers')
          .delete()
          .eq('project_id', projectId);

        // Insert all current decision makers
        if (decisionMakers.length > 0) {
          const rows = decisionMakers.map(dm => ({
            id: dm.id,
            project_id: projectId,
            role: dm.role,
            influence: dm.influence,
            description: dm.description || null,
            created_by: user.id,
            created_at: dm.created,
          }));

          await supabase
            .from('project_decision_makers')
            .insert(rows);
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveDecisionMakers, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, decisionMakers, loading]);

  return { loading, error };
}
