import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useStep0Store, type Customer, type Segment, type Benefit } from '../features/discovery/step0Store';
import { captureException } from '../lib/sentry';

/**
 * Hook to sync Step 0 "First Look" data with Supabase
 * Loads data on mount and auto-saves changes to database
 */
export function useStep0Data(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const {
    part,
    customers,
    segments,
    focusedSegmentId,
    focusJustification,
    benefits,
    importData,
    exportData,
    reset,
  } = useStep0Store();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load Step 0 data from Supabase on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadStep0Data = async () => {
      try {
        // Reset store immediately when projectId changes to clear old data
        reset();
        initialLoadRef.current = false;

        setLoading(true);
        setError(null);

        // Load Step 0 data (single row per project)
        const { data, error: loadError } = await supabase
          .from('project_step0')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (loadError) throw loadError;

        // If data exists, import it
        if (data) {
          importData({
            part: data.current_part,
            customers: (data.customers || []) as unknown as Customer[],
            segments: (data.segments || []) as unknown as Segment[],
            focusedSegmentId: data.focused_segment_id,
            focusJustification: data.focus_justification || '',
            benefits: (data.benefits || []) as unknown as Benefit[],
          });
        }

        initialLoadRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading Step 0 data');
        captureException(error, {
          extra: { projectId, context: 'useStep0Data load' },
        });
        setError('Failed to load Step 0 data');
      } finally {
        setLoading(false);
      }
    };

    loadStep0Data();
  }, [projectId, importData, reset]);

  // Auto-save Step 0 data to Supabase whenever it changes
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveStep0Data = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Export current data
        const currentData = exportData();

        // Upsert to database
        await supabase
          .from('project_step0')
          .upsert({
            project_id: projectId,
            current_part: currentData.part,
            customers: currentData.customers,
            segments: currentData.segments,
            focused_segment_id: currentData.focusedSegmentId,
            focus_justification: currentData.focusJustification,
            benefits: currentData.benefits,
            updated_by: user.id,
          }, {
            onConflict: 'project_id',
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error saving Step 0 data');
        captureException(error, {
          extra: { projectId, context: 'useStep0Data save' },
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    // Debounce saves by 1 second to avoid too many database writes
    const timeoutId = setTimeout(saveStep0Data, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, part, customers, segments, focusedSegmentId, focusJustification, benefits, loading, exportData]);

  return { loading, error };
}
