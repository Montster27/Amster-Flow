import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useVisualSectorMap } from '../contexts/VisualSectorMapContext';
import type { VisualSectorMapData } from '../types/visualSectorMap';
import { captureException } from '../lib/sentry';

/**
 * Hook to sync visual sector map data with Supabase
 * Loads data on mount and auto-saves changes to database
 */
export function useVisualSectorMapData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const {
    scope,
    actors,
    connections,
    annotations,
    activeLayers,
    importData,
    exportData,
    reset,
  } = useVisualSectorMap();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load visual sector map data from Supabase on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadVisualSectorMapData = async () => {
      try {
        // Reset store immediately when projectId changes to clear old data
        reset();
        initialLoadRef.current = false;

        setLoading(true);
        setError(null);

        // Load visual sector map data (single row per project)
        const { data, error: loadError } = await supabase
          .from('project_visual_sector_map')
          .select('data')
          .eq('project_id', projectId)
          .maybeSingle();

        if (loadError) throw loadError;

        // If data exists, import it
        if (data?.data) {
          const visualSectorMapData = data.data as unknown as VisualSectorMapData;
          importData(visualSectorMapData);
        }

        initialLoadRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading visual sector map data');
        captureException(error, {
          extra: { projectId, context: 'useVisualSectorMapData load' },
        });
        setError('Failed to load visual sector map data');
      } finally {
        setLoading(false);
      }
    };

    loadVisualSectorMapData();
  }, [projectId, importData, reset]);

  // Auto-save visual sector map data to Supabase whenever it changes
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveVisualSectorMapData = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Export current data
        const currentData = exportData();

        // Upsert to database
        await supabase
          .from('project_visual_sector_map')
          .upsert({
            project_id: projectId,
            data: currentData as any,
            updated_by: user.id,
          }, {
            onConflict: 'project_id',
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error saving visual sector map data');
        captureException(error, {
          extra: { projectId, context: 'useVisualSectorMapData save' },
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    // Debounce saves by 1 second to avoid too many database writes
    const timeoutId = setTimeout(saveVisualSectorMapData, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, scope, actors, connections, annotations, activeLayers, loading, exportData]);

  return { loading, error };
}
