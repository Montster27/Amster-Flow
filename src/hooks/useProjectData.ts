import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGuideStore } from '../store/useGuideStore';
import type { ModuleProgress } from '../store/useGuideStore';

/**
 * Hook to sync project data with Supabase
 * Loads data on mount and saves changes to database
 */
export function useProjectData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { progress, importProgress } = useGuideStore();

  // Load project data from Supabase on mount
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadProjectData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all modules for this project
        const { data: modules, error: loadError } = await supabase
          .from('project_modules')
          .select('*')
          .eq('project_id', projectId);

        if (loadError) throw loadError;

        // Convert database format to store format
        const progressData: Record<string, ModuleProgress> = {};

        if (modules) {
          for (const module of modules) {
            progressData[module.module_name] = {
              moduleName: module.module_name,
              answers: module.answers || [],
              completed: module.completed || false,
            };
          }
        }

        // Import into store
        importProgress(progressData);
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
    if (!projectId || loading) return;

    const saveProgressToDatabase = async () => {
      try {
        // Save each module's progress
        for (const [moduleName, moduleProgress] of Object.entries(progress)) {
          const { error: upsertError } = await supabase
            .from('project_modules')
            .upsert({
              project_id: projectId,
              module_name: moduleName,
              answers: moduleProgress.answers,
              completed: moduleProgress.completed,
            }, {
              onConflict: 'project_id,module_name',
            });

          if (upsertError) {
            console.error(`Error saving module ${moduleName}:`, upsertError);
          }
        }
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    };

    // Debounce saves to avoid too many database writes
    const timeoutId = setTimeout(saveProgressToDatabase, 1000);

    return () => clearTimeout(timeoutId);
  }, [projectId, progress, loading]);

  return { loading, error };
}
