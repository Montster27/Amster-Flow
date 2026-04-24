/**
 * Graduation Service
 * Handles the transition from Step 0 to Discovery module
 */

import { supabase } from '../../lib/supabase';
import type {
  Assumption,
  CanvasArea,
  ValidationStage,
  Step0AssumptionType,
  BeachheadData,
  PriorityLevel,
} from '../../types/discovery';
import type { Customer, Segment, IdeaStatement } from './step0Store';

// Internal assumption representation used by the service. Auto-generated
// assumptions for the migration use this shape before being transformed into
// Discovery `Assumption` records. It is not persisted to Step 0 — Step 0 has
// no assumptions table in the v2 schema.
interface Step0Assumption {
  id: string;
  sourceText: string;
  sourceType: 'problem' | 'benefit' | 'segment' | 'manual';
  assumption: string;
  impactIfWrong: string;
  assumptionType?: Step0AssumptionType;
  segmentId?: number;
}

export interface Step0Data {
  ideaStatement: IdeaStatement;
  customers: Customer[];
  segments: Segment[];
  assumptions: Step0Assumption[];
  focusedSegmentId?: number;
}

// Migration mapping from Step 0 types to Discovery
const MIGRATION_MAP: Record<Step0AssumptionType, { canvasArea: CanvasArea; stage: ValidationStage }> = {
  customerIdentity: { canvasArea: 'customerSegments', stage: 1 },
  problemSeverity: { canvasArea: 'problem', stage: 1 },
  solutionHypothesis: { canvasArea: 'solution', stage: 2 },
};

export interface GraduationResult {
  success: boolean;
  assumptionsCreated: number;
  beachheadSet: boolean;
  errors: string[];
  discoveryAssumptions: Assumption[];
}

/**
 * Calculate the recommended beachhead segment based on scoring.
 * The current Step 0 schema tracks `accessRank` (1-5) per segment and an
 * importance-ranked list of benefits. Benefits are all sorted with #1 being
 * the most important, so benefit rank doesn't differentiate between segments;
 * accessRank is the only meaningful differentiator. This matches the logic in
 * step0Store.getRecommendedBeachhead.
 */
export function getRecommendedBeachhead(segments: Segment[]): Segment | null {
  if (segments.length === 0) return null;

  const sorted = [...segments].sort((a, b) => (b.accessRank ?? 0) - (a.accessRank ?? 0));
  return sorted[0] ?? null;
}

/**
 * Generate customer identity assumptions for a segment
 */
function generateCustomerIdentityAssumptions(
  segment: Segment,
  ideaStatement: IdeaStatement
): Partial<Step0Assumption>[] {
  return [
    {
      id: crypto.randomUUID(),
      sourceType: 'segment',
      sourceText: segment.name,
      assumption: `${segment.name} experiences the problem of "${ideaStatement.helps}" regularly (at least weekly)`,
      impactIfWrong: 'We may be targeting the wrong customer segment',
      assumptionType: 'customerIdentity',
      segmentId: segment.id,
    },
    {
      id: crypto.randomUUID(),
      sourceType: 'segment',
      sourceText: segment.name,
      assumption: `${segment.name} is actively looking for better solutions to ${ideaStatement.helps}`,
      impactIfWrong: 'The customer may not be motivated enough to switch to our solution',
      assumptionType: 'customerIdentity',
      segmentId: segment.id,
    },
  ];
}

/**
 * Generate problem severity assumptions from customer problems
 */
function generateProblemSeverityAssumptions(
  segment: Segment,
  problems: string[]
): Partial<Step0Assumption>[] {
  return problems.map((problem) => ({
    id: crypto.randomUUID(),
    sourceType: 'problem' as const,
    sourceText: problem,
    assumption: `${segment.name} would pay to solve: "${problem}"`,
    impactIfWrong: 'The problem may not be painful enough to warrant a paid solution',
    assumptionType: 'problemSeverity' as Step0AssumptionType,
    segmentId: segment.id,
  }));
}

/**
 * Transform Step 0 assumptions to Discovery format
 */
export function transformStep0ToDiscovery(
  step0Data: Step0Data,
  focusedSegmentId: number,
  _projectId: string
): Assumption[] {
  const focusedSegment = step0Data.segments.find((s) => s.id === focusedSegmentId);
  if (!focusedSegment) {
    throw new Error('Focused segment not found');
  }

  const discoveryAssumptions: Assumption[] = [];
  const now = new Date().toISOString();

  // Problems for the focused segment come directly from its ranked benefits.
  // In Step 0, each segment is seeded from a customer's benefits list with need
  // categories. The top-ranked benefit is also the segment's `need`. Every
  // benefit text represents a value claim that can become a problem-severity
  // assumption when graduated ("would the customer pay to achieve this?").
  const segmentProblems: string[] = focusedSegment.benefits
    .map((b) => b.text.trim())
    .filter((text) => text.length > 0);

  // Generate auto-assumptions if Step 0 doesn't have typed assumptions
  let assumptionsToMigrate = step0Data.assumptions;

  // Check if we have typed assumptions
  const hasTypedAssumptions = assumptionsToMigrate.some((a) => a.assumptionType);

  if (!hasTypedAssumptions) {
    // Generate typed assumptions
    const customerIdentity = generateCustomerIdentityAssumptions(focusedSegment, step0Data.ideaStatement);
    const problemSeverity = generateProblemSeverityAssumptions(focusedSegment, segmentProblems);

    // Convert existing assumptions to solution hypotheses
    const solutionHypotheses = assumptionsToMigrate.map((a) => ({
      ...a,
      assumptionType: 'solutionHypothesis' as Step0AssumptionType,
      segmentId: focusedSegmentId,
    }));

    assumptionsToMigrate = [...customerIdentity, ...problemSeverity, ...solutionHypotheses] as Step0Assumption[];
  }

  // Transform each assumption — track testOrder for locked assumptions
  let nextTestOrder = 1;

  for (const step0Assumption of assumptionsToMigrate) {
    // Only include assumptions for the focused segment
    if (step0Assumption.segmentId && step0Assumption.segmentId !== focusedSegmentId) {
      continue;
    }

    const assumptionType = step0Assumption.assumptionType || 'solutionHypothesis';
    const mapping = MIGRATION_MAP[assumptionType];

    // Customer identity and problem severity assumptions are locked (must be tested first)
    const shouldLock = assumptionType === 'customerIdentity' || assumptionType === 'problemSeverity';

    const discoveryAssumption: Assumption = {
      id: crypto.randomUUID(),
      type: assumptionType === 'customerIdentity' ? 'customer' : assumptionType === 'problemSeverity' ? 'problem' : 'solution',
      description: step0Assumption.assumption,
      created: now,
      lastUpdated: now,
      status: 'untested',
      confidence: 2, // Start at "Unknown"
      evidence: [],

      // LBMC Integration
      canvasArea: mapping.canvasArea,
      validationStage: mapping.stage,

      // Risk-based prioritization
      importance: assumptionType === 'customerIdentity' ? 5 : 4, // WHO assumptions are highest priority
      priority: 'high' as PriorityLevel,
      riskScore: (6 - 2) * (assumptionType === 'customerIdentity' ? 5 : 4), // (6 - confidence) * importance

      // V2 Migration tracking
      migratedFromStep0: true,
      sourceSegment: focusedSegment.name,
      step0AssumptionType: assumptionType,

      // V2 Locked assumptions (auto-generated WHO/WHAT assumptions)
      isLocked: shouldLock,
      testOrder: shouldLock ? nextTestOrder++ : undefined,
    };

    discoveryAssumptions.push(discoveryAssumption);
  }

  return discoveryAssumptions;
}

/**
 * Store beachhead selection in project
 */
async function storeBeachheadSegment(
  projectId: string,
  segment: Segment
): Promise<{ success: boolean; error?: string }> {
  const beachheadData: BeachheadData = {
    // BeachheadData.segmentId is a string in the JSONB payload; coerce from numeric id.
    segmentId: String(segment.id),
    segmentName: segment.name,
    selectedAt: new Date().toISOString(),
    // Step 0 v2 ranks segments by `accessRank` (1-5) — how easy they are to
    // reach. That's the only numeric score carried on the segment record.
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

/**
 * Insert assumptions into Discovery
 */
async function insertDiscoveryAssumptions(
  projectId: string,
  assumptions: Assumption[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (assumptions.length === 0) {
    return { success: true, count: 0 };
  }

  // Transform to database format
  const dbAssumptions = assumptions.map((a) => ({
    id: a.id,
    project_id: projectId,
    type: a.type,
    description: a.description,
    created: a.created,
    last_updated: a.lastUpdated,
    status: a.status,
    confidence: a.confidence,
    evidence: a.evidence,
    canvas_area: a.canvasArea,
    validation_stage: a.validationStage,
    importance: a.importance,
    priority: a.priority,
    risk_score: a.riskScore,
    migrated_from_step0: a.migratedFromStep0,
    source_segment: a.sourceSegment,
    is_locked: a.isLocked || false,
    test_order: a.testOrder || null,
  }));

  const { error } = await supabase.from('project_assumptions').insert(dbAssumptions);

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  return { success: true, count: assumptions.length };
}

/**
 * Main graduation function - migrates Step 0 data to Discovery
 */
export async function graduateToDiscovery(
  projectId: string,
  step0Data: Step0Data,
  selectedSegmentId?: number
): Promise<GraduationResult> {
  const errors: string[] = [];
  let assumptionsCreated = 0;
  let beachheadSet = false;
  let discoveryAssumptions: Assumption[] = [];

  try {
    // 1. Determine the beachhead segment
    let focusedSegmentId = selectedSegmentId || step0Data.focusedSegmentId;

    if (!focusedSegmentId) {
      // Auto-select recommended segment
      const recommended = getRecommendedBeachhead(step0Data.segments);
      if (recommended) {
        focusedSegmentId = recommended.id;
      } else {
        errors.push('No segments available for beachhead selection');
        return { success: false, assumptionsCreated: 0, beachheadSet: false, errors, discoveryAssumptions: [] };
      }
    }

    const focusedSegment = step0Data.segments.find((s) => s.id === focusedSegmentId);
    if (!focusedSegment) {
      errors.push('Selected segment not found');
      return { success: false, assumptionsCreated: 0, beachheadSet: false, errors, discoveryAssumptions: [] };
    }

    // 2. Store beachhead selection
    const beachheadResult = await storeBeachheadSegment(projectId, focusedSegment);
    if (!beachheadResult.success) {
      errors.push(`Failed to store beachhead: ${beachheadResult.error}`);
    } else {
      beachheadSet = true;
    }

    // 3. Transform Step 0 assumptions to Discovery format
    discoveryAssumptions = transformStep0ToDiscovery(step0Data, focusedSegmentId, projectId);

    // 4. Insert assumptions into Discovery
    const insertResult = await insertDiscoveryAssumptions(projectId, discoveryAssumptions);
    if (!insertResult.success) {
      errors.push(`Failed to create assumptions: ${insertResult.error}`);
    } else {
      assumptionsCreated = insertResult.count;
    }

    return {
      success: errors.length === 0,
      assumptionsCreated,
      beachheadSet,
      errors,
      discoveryAssumptions,
    };
  } catch (error) {
    return {
      success: false,
      assumptionsCreated,
      beachheadSet,
      errors: [error instanceof Error ? error.message : 'Unknown error during graduation'],
      discoveryAssumptions,
    };
  }
}

/**
 * Check if a project has already graduated to Discovery
 */
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

  // Type assertion for V2 columns not in generated types
  const project = data as unknown as { v2_migrated_at?: string | null; beachhead_data?: unknown };
  return project.v2_migrated_at !== null || project.beachhead_data !== null;
}

/**
 * Get beachhead data for a project
 */
export async function getBeachheadData(projectId: string): Promise<BeachheadData | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    return null;
  }

  // Type assertion for V2 columns not in generated types
  const project = data as unknown as { beachhead_data?: BeachheadData | null };
  if (!project.beachhead_data) {
    return null;
  }

  return project.beachhead_data;
}
