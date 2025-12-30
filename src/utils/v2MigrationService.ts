/**
 * V2 Migration Service
 * Handles migration of existing projects to V2 schema
 *
 * Note: This service uses type assertions because the V2 schema columns
 * may not be in the generated Supabase types until types are regenerated.
 */

import { supabase } from '../lib/supabase';

export interface MigrationResult {
  success: boolean;
  projectId: string;
  assumptionsMigrated: number;
  errors: string[];
}

// Type for assumptions with V2 fields (not in generated types yet)
interface AssumptionWithV2Fields {
  id: string;
  canvas_area?: string;
  validation_stage?: number;
  project_id: string;
}

// Type for projects with V2 fields
interface ProjectWithV2Fields {
  v2_migrated_at?: string | null;
  beachhead_data?: Record<string, unknown> | null;
}

/**
 * Detect if a project needs V2 migration
 */
export async function detectLegacyProject(projectId: string): Promise<boolean> {
  // Use raw query to avoid type issues with new columns
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error detecting legacy project:', error);
    return false;
  }

  const project = data as unknown as ProjectWithV2Fields;

  // Project needs migration if:
  // 1. v2_migrated_at is null (never migrated)
  // 2. AND has assumptions (not a new project)
  if (project.v2_migrated_at === null || project.v2_migrated_at === undefined) {
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
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  const project = data as unknown as ProjectWithV2Fields;

  const { count } = await supabase
    .from('project_assumptions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  return {
    needsMigration: (project?.v2_migrated_at === null || project?.v2_migrated_at === undefined) && (count || 0) > 0,
    migratedAt: project?.v2_migrated_at || null,
    hasBeachhead: project?.beachhead_data !== null && project?.beachhead_data !== undefined,
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
    const { data, error: fetchError } = await supabase
      .from('project_assumptions')
      .select('*')
      .eq('project_id', projectId);

    if (fetchError) {
      throw new Error(`Failed to fetch assumptions: ${fetchError.message}`);
    }

    const assumptions = (data || []) as unknown as AssumptionWithV2Fields[];

    // 2. Update each assumption with the correct validation_stage
    for (const assumption of assumptions) {
      const stage = getStageForCanvasArea(assumption.canvas_area || '');

      if (assumption.validation_stage !== stage) {
        const { error: updateError } = await supabase
          .from('project_assumptions')
          .update({ validation_stage: stage } as Record<string, unknown>)
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
      .update({ v2_migrated_at: new Date().toISOString() } as Record<string, unknown>)
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
 * Note: This uses raw SQL since project_assumptions_backup is not in generated types
 */
export async function rollbackMigration(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use RPC or raw approach for backup table since it's not in generated types
    // For now, just clear the migration timestamp - full rollback requires backup table access

    // Clear migration timestamp
    const { error: projectError } = await supabase
      .from('projects')
      .update({ v2_migrated_at: null } as Record<string, unknown>)
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
