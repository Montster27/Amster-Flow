/**
 * Stage Evaluation Utilities
 * Functions to evaluate stage status and progression in the V2 validation workflow
 */

import type {
  Assumption,
  EnhancedInterview,
  ValidationStage,
  StageStatus,
  AssumptionTag,
} from '../types/discovery';
import { VALIDATION_STAGES, getStageForArea } from '../types/discovery';
import { getValidationConfig, type ValidationConfig } from '../config/validationConfig';

/**
 * Evaluate the status of a validation stage
 */
export function evaluateStageStatus(
  stage: ValidationStage,
  assumptions: Assumption[],
  interviews: EnhancedInterview[],
  previousStageValidated: boolean = true,
  config: ValidationConfig = getValidationConfig()
): StageStatus {
  const stageConfig = VALIDATION_STAGES[stage];

  // Get assumptions for this stage
  const stageAssumptions = assumptions.filter(
    (a) => a.validationStage === stage || stageConfig.areas.includes(a.canvasArea)
  );

  // Get interviews that address stage assumptions
  const stageInterviewIds = new Set<string>();
  interviews.forEach((interview) => {
    const addressesStage = interview.assumptionTags.some((tag) => {
      const assumption = assumptions.find((a) => a.id === tag.assumptionId);
      return assumption && (assumption.validationStage === stage || stageConfig.areas.includes(assumption.canvasArea));
    });
    if (addressesStage) {
      stageInterviewIds.add(interview.id);
    }
  });
  const stageInterviewCount = stageInterviewIds.size;

  // Calculate statistics
  const validatedAssumptions = stageAssumptions.filter((a) => a.status === 'validated');
  const invalidatedAssumptions = stageAssumptions.filter((a) => a.status === 'invalidated');
  const untestedAssumptions = stageAssumptions.filter((a) => a.status === 'untested');

  const avgConfidence =
    stageAssumptions.length > 0
      ? stageAssumptions.reduce((sum, a) => sum + a.confidence, 0) / stageAssumptions.length
      : 0;

  // Determine if stage can graduate
  const interviewsNeeded = Math.max(0, stageConfig.minimumInterviews - stageInterviewCount);
  const meetsInterviewRequirement = stageInterviewCount >= stageConfig.minimumInterviews;
  const meetsConfidenceRequirement = avgConfidence >= stageConfig.graduationCriteria.minConfidence;
  const meetsInvalidationLimit =
    invalidatedAssumptions.length <= stageConfig.graduationCriteria.maxInvalidated;

  const canGraduate =
    meetsInterviewRequirement && meetsConfidenceRequirement && meetsInvalidationLimit && stageAssumptions.length > 0;

  // Determine if stage is unlocked
  const isUnlocked = stage === 1 || previousStageValidated;

  // Generate recommendation
  const recommendation = getStageRecommendation(
    stage,
    stageAssumptions,
    stageInterviewCount,
    avgConfidence,
    invalidatedAssumptions.length,
    canGraduate,
    isUnlocked,
    config
  );

  return {
    stage,
    interviewCount: stageInterviewCount,
    interviewsNeeded,
    avgConfidence: Math.round(avgConfidence * 10) / 10,
    validatedCount: validatedAssumptions.length,
    invalidatedCount: invalidatedAssumptions.length,
    untestedCount: untestedAssumptions.length,
    totalAssumptions: stageAssumptions.length,
    canGraduate,
    isUnlocked,
    recommendation,
  };
}

/**
 * Get recommendation message for a stage
 */
function getStageRecommendation(
  stage: ValidationStage,
  assumptions: Assumption[],
  interviewCount: number,
  avgConfidence: number,
  invalidatedCount: number,
  canGraduate: boolean,
  isUnlocked: boolean,
  config: ValidationConfig
): string {
  const stageConfig = VALIDATION_STAGES[stage];

  if (!isUnlocked) {
    return `Complete Stage ${stage - 1} validation before working on Stage ${stage}.`;
  }

  if (assumptions.length === 0) {
    return `Add assumptions for ${stageConfig.name} to begin validation.`;
  }

  if (canGraduate) {
    if (stage < 3) {
      return `Stage ${stage} validated! You can now proceed to Stage ${stage + 1}.`;
    }
    return 'All stages validated! Your business model is ready for execution.';
  }

  // Provide specific guidance
  const issues: string[] = [];

  if (interviewCount < stageConfig.minimumInterviews) {
    const needed = stageConfig.minimumInterviews - interviewCount;
    issues.push(`${needed} more interview${needed > 1 ? 's' : ''} needed`);
  }

  if (avgConfidence < stageConfig.graduationCriteria.minConfidence) {
    issues.push(`average confidence too low (${avgConfidence.toFixed(1)}/5, need ${stageConfig.graduationCriteria.minConfidence})`);
  }

  if (invalidatedCount > stageConfig.graduationCriteria.maxInvalidated) {
    issues.push(
      `${invalidatedCount} invalidated assumptions (max ${stageConfig.graduationCriteria.maxInvalidated} allowed)`
    );
  }

  if (issues.length > 0) {
    return `To complete Stage ${stage}: ${issues.join(', ')}.`;
  }

  return 'Continue testing your assumptions with more interviews.';
}

/**
 * Evaluate all stages and return their statuses
 */
export function evaluateAllStages(
  assumptions: Assumption[],
  interviews: EnhancedInterview[],
  config: ValidationConfig = getValidationConfig()
): Record<ValidationStage, StageStatus> {
  const stage1Status = evaluateStageStatus(1, assumptions, interviews, true, config);
  const stage2Status = evaluateStageStatus(2, assumptions, interviews, stage1Status.canGraduate, config);
  const stage3Status = evaluateStageStatus(3, assumptions, interviews, stage2Status.canGraduate, config);

  return {
    1: stage1Status,
    2: stage2Status,
    3: stage3Status,
  };
}

/**
 * Get the highest unlocked stage
 */
export function getHighestUnlockedStage(stageStatuses: Record<ValidationStage, StageStatus>): ValidationStage {
  if (stageStatuses[3].isUnlocked) return 3;
  if (stageStatuses[2].isUnlocked) return 2;
  return 1;
}

/**
 * Get assumptions sorted by priority for a stage
 * Priority: untested > testing > validated > invalidated
 * Within each status: higher risk score first
 */
export function getSortedAssumptionsForStage(
  assumptions: Assumption[],
  stage: ValidationStage
): Assumption[] {
  const stageConfig = VALIDATION_STAGES[stage];
  const stageAssumptions = assumptions.filter(
    (a) => a.validationStage === stage || stageConfig.areas.includes(a.canvasArea)
  );

  const statusOrder: Record<string, number> = {
    untested: 0,
    testing: 1,
    validated: 2,
    invalidated: 3,
  };

  return [...stageAssumptions].sort((a, b) => {
    // First sort by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by risk score (higher first)
    const riskA = a.riskScore || (6 - a.confidence) * a.importance;
    const riskB = b.riskScore || (6 - b.confidence) * b.importance;
    return riskB - riskA;
  });
}

/**
 * Count beachhead interviews for a project
 */
export function countBeachheadInterviews(
  interviews: EnhancedInterview[],
  beachheadSegmentName: string
): number {
  return interviews.filter(
    (i) =>
      i.matchesBeachhead === true ||
      i.segmentName.toLowerCase() === beachheadSegmentName.toLowerCase()
  ).length;
}

/**
 * Check if an assumption can be validated based on interview evidence
 */
export interface ValidationEligibility {
  canValidate: boolean;
  suggestedStatus: 'validated' | 'invalidated' | 'testing' | 'untested';
  reason: string;
  supportRatio?: number;
  suggestPivot?: boolean;
}

export function checkValidationEligibility(
  assumption: Assumption,
  linkedTags: AssumptionTag[],
  beachheadInterviewCount: number,
  config: ValidationConfig = getValidationConfig()
): ValidationEligibility {
  const stage = assumption.validationStage || getStageForArea(assumption.canvasArea);

  // Check minimum interview count
  if (linkedTags.length < config.minimumInterviewsForValidation) {
    return {
      canValidate: false,
      suggestedStatus: linkedTags.length > 0 ? 'testing' : 'untested',
      reason: `Need ${config.minimumInterviewsForValidation - linkedTags.length} more interviews`,
    };
  }

  // Check beachhead requirement for Stage 1
  if (stage === 1 && beachheadInterviewCount < config.minimumBeachheadInterviews) {
    return {
      canValidate: false,
      suggestedStatus: 'testing',
      reason: `Stage 1 requires ${config.minimumBeachheadInterviews} beachhead interviews (have ${beachheadInterviewCount})`,
    };
  }

  // Calculate support ratio
  const supportingCount = linkedTags.filter((t) => t.validationEffect === 'supports').length;
  const contradictingCount = linkedTags.filter((t) => t.validationEffect === 'contradicts').length;
  const supportRatio = supportingCount / linkedTags.length;

  if (supportRatio >= config.minimumSupportRatio) {
    return {
      canValidate: true,
      suggestedStatus: 'validated',
      reason: `${Math.round(supportRatio * 100)}% of interviews support this assumption`,
      supportRatio,
    };
  }

  if (supportRatio <= config.maximumSupportRatioForInvalidation) {
    return {
      canValidate: true,
      suggestedStatus: 'invalidated',
      reason: `Only ${Math.round(supportRatio * 100)}% of interviews support this assumption`,
      supportRatio,
      suggestPivot: true,
    };
  }

  return {
    canValidate: false,
    suggestedStatus: 'testing',
    reason: `Mixed evidence (${Math.round(supportRatio * 100)}% support) - need more interviews for clarity`,
    supportRatio,
  };
}

/**
 * Calculate overall progress percentage across all stages
 */
export function calculateOverallProgress(stageStatuses: Record<ValidationStage, StageStatus>): number {
  let totalWeight = 0;
  let completedWeight = 0;

  // Stage 1 is worth 40%, Stage 2 is worth 40%, Stage 3 is worth 20%
  const stageWeights: Record<ValidationStage, number> = {
    1: 40,
    2: 40,
    3: 20,
  };

  for (const stage of [1, 2, 3] as ValidationStage[]) {
    const status = stageStatuses[stage];
    const weight = stageWeights[stage];
    totalWeight += weight;

    if (status.canGraduate) {
      completedWeight += weight;
    } else if (status.totalAssumptions > 0) {
      // Partial credit based on progress
      const stageProgress = Math.min(
        (status.validatedCount / status.totalAssumptions) * 0.7 +
          (status.interviewCount / VALIDATION_STAGES[stage].minimumInterviews) * 0.3,
        0.99
      );
      completedWeight += weight * stageProgress;
    }
  }

  return Math.round((completedWeight / totalWeight) * 100);
}
