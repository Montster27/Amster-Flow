import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useGuide } from '../contexts/GuideContext';
import type { ModuleProgress } from '../contexts/GuideContext';

/**
 * Hook to sync project data with Supabase
 * Loads data on mount and saves changes to database
 */
export function useProjectData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { progress, importProgress, reset } = useGuide();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load project data from Supabase on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadProjectData = async () => {
      try {
        // Reset store immediately when projectId changes to clear old data
        reset();
        initialLoadRef.current = false;

        setLoading(true);
        setError(null);

        // Load all answer rows for this project
        const { data: answerRows, error: loadError } = await supabase
          .from('project_modules')
          .select('*')
          .eq('project_id', projectId);

        if (loadError) throw loadError;

        // Group answers by module name
        const progressData: Record<string, ModuleProgress> = {};

        if (answerRows) {
          for (const row of answerRows) {
            const moduleName = row.module_name;

            if (!progressData[moduleName]) {
              progressData[moduleName] = {
                moduleName,
                answers: [],
                completed: false,
              };
            }

            progressData[moduleName].answers.push({
              questionIndex: row.question_index,
              answer: row.answer,
            });
          }
        }

        // Import into store
        importProgress(progressData);
        initialLoadRef.current = true;
      } catch (err) {
        console.error('Error loading project data:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, importProgress]);

  // Save progress to Supabase whenever it changes
  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current) return;

    const saveProgressToDatabase = async () => {
      // Prevent concurrent saves
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // For each module, save each answer as a separate row
        for (const [moduleName, moduleProgress] of Object.entries(progress)) {
          for (const answer of moduleProgress.answers) {
            await supabase
              .from('project_modules')
              .upsert({
                project_id: projectId,
                module_name: moduleName as 'problem' | 'customerSegments' | 'solution',
                question_index: answer.questionIndex,
                answer: answer.answer,
                updated_by: user.id,
              }, {
                onConflict: 'project_id,module_name,question_index',
              });
          }
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    // Debounce saves to avoid too many database writes
    const timeoutId = setTimeout(saveProgressToDatabase, 1000);

    return () => clearTimeout(timeoutId);
  }, [projectId, user, progress, loading]);

  return { loading, error };
}
