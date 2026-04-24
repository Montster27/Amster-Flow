/**
 * Graduation Service
 *
 * Records the beachhead selection on the project. Discovery seeds its own
 * assumptions from interview signal, so this service no longer creates
 * `project_assumptions` rows — the Sanity Check step gates graduation and
 * verifies real problem signal before Discovery begins.
 */

import { supabase } from '../../lib/supabase';
import type { BeachheadData } from '../../types/discovery';
import type { Customer, Segment, IdeaStatement } from './step0Store';

export interface Step0Data {
  ideaStatement: IdeaStatement;
  customers: Customer[];
  segments: Segment[];
  focusedSegmentId?: number;
}

export interface GraduationResult {
  success: boolean;
  beachheadSet: boolean;
  errors: string[];
}

/**
 * Calculate the recommended beachhead segment based on accessRank (1-5).
 * Higher rank = easier to reach.
 */
export function getRecommendedBeachhead(segments: Segment[]): Segment | null {
  if (segments.length === 0) return null;
  const sorted = [...segments].sort((a, b) => (b.accessRank ?? 0) - (a.accessRank ?? 0));
  return sorted[0] ?? null;
}

async function storeBeachheadSegment(
  projectId: string,
  segment: Segment
): Promise<{ success: boolean; error?: string }> {
  const beachheadData: BeachheadData = {
    segmentId: String(segment.id),
    segmentName: segment.name,
    selectedAt: new Date().toISOString(),
    step0Score: segment.accessRank ?? 0,
    focusHistory: [],
  };

  const { error } = await supabase
    .from('projects')
    .update({
      beachhead_data: beachheadData,
      v2_migrated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function graduateToDiscovery(
  projectId: string,
  step0Data: Step0Data,
  selectedSegmentId?: number
): Promise<GraduationResult> {
  const errors: string[] = [];
  let beachheadSet = false;

  try {
    let focusedSegmentId = selectedSegmentId || step0Data.focusedSegmentId;

    if (!focusedSegmentId) {
      const recommended = getRecommendedBeachhead(step0Data.segments);
      if (recommended) {
        focusedSegmentId = recommended.id;
      } else {
        errors.push('No segments available for beachhead selection');
        return { success: false, beachheadSet: false, errors };
      }
    }

    const focusedSegment = step0Data.segments.find((s) => s.id === focusedSegmentId);
    if (!focusedSegment) {
      errors.push('Selected segment not found');
      return { success: false, beachheadSet: false, errors };
    }

    const beachheadResult = await storeBeachheadSegment(projectId, focusedSegment);
    if (!beachheadResult.success) {
      errors.push(`Failed to store beachhead: ${beachheadResult.error}`);
    } else {
      beachheadSet = true;
    }

    return {
      success: errors.length === 0,
      beachheadSet,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      beachheadSet,
      errors: [error instanceof Error ? error.message : 'Unknown error during graduation'],
    };
  }
}

export async function hasGraduated(projectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error checking graduation status:', error);
    return false;
  }

  const project = data as unknown as { v2_migrated_at?: string | null; beachhead_data?: unknown };
  return project.v2_migrated_at !== null || project.beachhead_data !== null;
}

export async function getBeachheadData(projectId: string): Promise<BeachheadData | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) return null;

  const project = data as unknown as { beachhead_data?: BeachheadData | null };
  return project.beachhead_data ?? null;
}
