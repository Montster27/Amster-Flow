/**
 * V2 Migration Service
 * Handles migration of existing projects to V2 schema
 */

import { supabase } from '../lib/supabase';

export interface MigrationResult {
  success: boolean;
  projectId: string;
  assumptionsMigrated: number;
  errors: string[];
}

/**
 * Detect if a project needs V2 migration
 */
export async function detectLegacyProject(projectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('projects')
    .select('v2_migrated_at, beachhead_data')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error detecting legacy project:', error);
    return false;
  }

  // Project needs migration if:
  // 1. v2_migrated_at is null (never migrated)
  // 2. AND has assumptions (not a new project)
  if (data.v2_migrated_at === null) {
    const { count } = await supabase
      .from('project_assumptions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    return (count || 0) > 0;
  }

  return false;
}

/**
 * Get migration status for a project
 */
export async function getMigrationStatus(projectId: string): Promise<{
  needsMigration: boolean;
  migratedAt: string | null;
  hasBeachhead: boolean;
  assumptionCount: number;
}> {
  const { data: project } = await supabase
    .from('projects')
    .select('v2_migrated_at, beachhead_data')
    .eq('id', projectId)
    .single();

  const { count } = await supabase
    .from('project_assumptions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  return {
    needsMigration: project?.v2_migrated_at === null && (count || 0) > 0,
    migratedAt: project?.v2_migrated_at,
    hasBeachhead: project?.beachhead_data !== null,
    assumptionCount: count || 0,
  };
}

/**
 * Migrate existing project assumptions to V2 stage structure
 */
export async function migrateExistingProject(projectId: string): Promise<MigrationResult> {
  const errors: string[] = [];
  let assumptionsMigrated = 0;

  try {
    // 1. Get all assumptions for this project
    const { data: assumptions, error: fetchError } = await supabase
      .from('project_assumptions')
      .select('id, canvas_area, validation_stage')
      .eq('project_id', projectId);

    if (fetchError) {
      throw new Error(`Failed to fetch assumptions: ${fetchError.message}`);
    }

    // 2. Update each assumption with the correct validation_stage
    for (const assumption of assumptions || []) {
      const stage = getStageForCanvasArea(assumption.canvas_area);

      if (assumption.validation_stage !== stage) {
        const { error: updateError } = await supabase
          .from('project_assumptions')
          .update({ validation_stage: stage })
          .eq('id', assumption.id);

        if (updateError) {
          errors.push(`Failed to update assumption ${assumption.id}: ${updateError.message}`);
        } else {
          assumptionsMigrated++;
        }
      }
    }

    // 3. Mark project as migrated
    const { error: projectError } = await supabase
      .from('projects')
      .update({ v2_migrated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (projectError) {
      errors.push(`Failed to mark project as migrated: ${projectError.message}`);
    }

    return {
      success: errors.length === 0,
      projectId,
      assumptionsMigrated,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      projectId,
      assumptionsMigrated,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Get the validation stage for a canvas area
 */
function getStageForCanvasArea(canvasArea: string): number {
  const stage1Areas = ['customerSegments', 'problem'];
  const stage2Areas = ['existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters'];
  const stage3Areas = ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage'];

  if (stage1Areas.includes(canvasArea)) return 1;
  if (stage2Areas.includes(canvasArea)) return 2;
  if (stage3Areas.includes(canvasArea)) return 3;

  // Default to stage 1 for unknown areas
  return 1;
}

/**
 * Rollback a project migration (restore from backup)
 */
export async function rollbackMigration(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get backup data
    const { data: backup, error: backupError } = await supabase
      .from('project_assumptions_backup')
      .select('*')
      .eq('project_id', projectId);

    if (backupError) {
      throw new Error(`Failed to fetch backup: ${backupError.message}`);
    }

    if (!backup || backup.length === 0) {
      throw new Error('No backup found for this project');
    }

    // 2. Delete current assumptions
    const { error: deleteError } = await supabase
      .from('project_assumptions')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      throw new Error(`Failed to delete current assumptions: ${deleteError.message}`);
    }

    // 3. Restore from backup (excluding backup-specific columns)
    const restoredAssumptions = backup.map(({ backed_up_at, ...rest }) => rest);

    const { error: insertError } = await supabase
      .from('project_assumptions')
      .insert(restoredAssumptions);

    if (insertError) {
      throw new Error(`Failed to restore assumptions: ${insertError.message}`);
    }

    // 4. Clear migration timestamp
    const { error: projectError } = await supabase
      .from('projects')
      .update({ v2_migrated_at: null })
      .eq('id', projectId);

    if (projectError) {
      throw new Error(`Failed to clear migration timestamp: ${projectError.message}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
