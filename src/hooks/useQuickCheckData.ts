import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useQuickCheckStore, type QuickCheckSegment } from '../features/quickcheck/quickCheckStore';
import { captureException } from '../lib/sentry';

/**
 * Hook to sync Quick Check data with Supabase.
 * On first visit, seeds from project_step0 data.
 */
export function useQuickCheckData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const {
    segments,
    beachheadCompleted,
    importData,
    exportData,
    reset,
  } = useQuickCheckStore();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load Quick Check data (or seed from Step 0)
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        reset();
        initialLoadRef.current = false;
        setLoading(true);
        setError(null);

        // Try loading existing Quick Check data
        // Table not in generated types yet — use type assertion
        const { data: qcData, error: qcError } = await (supabase as any)
          .from('project_quick_check')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (qcError) throw qcError;

        if (qcData) {
          // Existing Quick Check data found
          const row = qcData as any;
          importData({
            segments: (row.segments || []) as QuickCheckSegment[],
            beachheadCompleted: row.beachhead_completed || false,
          });
        } else {
          // No Quick Check data — seed from Step 0
          const { data: step0Data, error: step0Error } = await supabase
            .from('project_step0')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

          if (step0Error) throw step0Error;

          if (step0Data) {
            const step0 = step0Data as any;
            const step0Segments = (step0.segments || []) as any[];
            const focusedId = step0.focused_segment_id;
            const idea = (step0.idea || {}) as { building?: string; helps?: string; achieve?: string };

            const seededSegments: QuickCheckSegment[] = step0Segments.map((seg: any) => {
              const isBeachhead = seg.id === focusedId;
              // Pre-fill problem from top benefit
              const topBenefit = seg.benefits?.[0]?.text || '';
              // Pre-fill solution from idea for beachhead only
              const solutionPreFill = isBeachhead && idea.building
                ? `${idea.building} that helps ${idea.helps || 'them'} ${idea.achieve || ''}`
                : '';

              return {
                segmentId: seg.id,
                segmentName: seg.name || '',
                isBeachhead,
                problem: topBenefit ? `They struggle with: ${topBenefit}` : '',
                contacts: ['', '', ''],
                solution: solutionPreFill,
                hypothesis: '',
              };
            });

            // Generate initial hypotheses
            seededSegments.forEach((seg) => {
              if (seg.problem && seg.solution) {
                seg.hypothesis = `We believe ${seg.segmentName} will adopt our solution because ${seg.problem}, if we build ${seg.solution}.`;
              }
            });

            importData({
              segments: seededSegments,
              beachheadCompleted: false,
            });
          }
        }

        initialLoadRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading Quick Check data');
        captureException(error, { extra: { projectId, context: 'useQuickCheckData load' } });
        setError('Failed to load Quick Check data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, importData, reset]);

  // Auto-save on state changes
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveData = async () => {
      if (isSavingRef.current) return;
      try {
        isSavingRef.current = true;
        const currentData = exportData();
        await (supabase as any)
          .from('project_quick_check')
          .upsert({
            project_id: projectId,
            segments: currentData.segments,
            beachhead_completed: currentData.beachheadCompleted,
            updated_by: user.id,
          }, { onConflict: 'project_id' });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error saving Quick Check data');
        captureException(error, { extra: { projectId, context: 'useQuickCheckData save' } });
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, segments, beachheadCompleted, loading, exportData]);

  return { loading, error };
}
