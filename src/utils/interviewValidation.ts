/**
 * Interview Validation Utilities
 * Functions to validate interview requirements and assumption validation eligibility
 */

import type {
  Assumption,
  EnhancedInterview,
  AssumptionTag,
  ValidationStage,
  BeachheadData,
} from '../types/discovery';
import { getStageForArea } from '../types/discovery';
import { getValidationConfig, type ValidationConfig } from '../config/validationConfig';

export interface ValidationEligibility {
  canValidate: boolean;
  suggestedStatus: 'validated' | 'invalidated' | 'testing' | 'untested';
  reason: string;
  supportRatio?: number;
  supportCount?: number;
  contradictCount?: number;
  totalInterviews?: number;
  suggestPivot?: boolean;
}

export interface InterviewRequirements {
  stage1Interviews: number;
  stage1Required: number;
  stage1Complete: boolean;
  beachheadInterviews: number;
  beachheadRequired: number;
  beachheadComplete: boolean;
  totalInterviews: number;
  overallProgress: number; // 0-100
}

/**
 * Check if an assumption can be validated based on interview evidence
 */
export function canValidateAssumption(
  assumption: Assumption,
  interviews: EnhancedInterview[],
  beachheadSegmentName: string,
  config: ValidationConfig = getValidationConfig()
): ValidationEligibility {
  // Get all tags for this assumption
  const linkedTags: AssumptionTag[] = [];
  interviews.forEach((interview) => {
    interview.assumptionTags.forEach((tag) => {
      if (tag.assumptionId === assumption.id) {
        linkedTags.push(tag);
      }
    });
  });

  const stage = assumption.validationStage || getStageForArea(assumption.canvasArea);

  // Count beachhead interviews
  const beachheadInterviewCount = interviews.filter(
    (i) =>
      i.matchesBeachhead === true ||
      i.segmentName.toLowerCase() === beachheadSegmentName.toLowerCase()
  ).length;

  // Check minimum interview count
  if (linkedTags.length < config.minimumInterviewsForValidation) {
    const needed = config.minimumInterviewsForValidation - linkedTags.length;
    return {
      canValidate: false,
      suggestedStatus: linkedTags.length > 0 ? 'testing' : 'untested',
      reason: `Need ${needed} more interview${needed > 1 ? 's' : ''} addressing this assumption`,
      totalInterviews: linkedTags.length,
    };
  }

  // Check beachhead requirement for Stage 1
  if (stage === 1 && beachheadInterviewCount < config.minimumBeachheadInterviews) {
    const needed = config.minimumBeachheadInterviews - beachheadInterviewCount;
    return {
      canValidate: false,
      suggestedStatus: 'testing',
      reason: `Stage 1 requires ${needed} more beachhead interview${needed > 1 ? 's' : ''}`,
      totalInterviews: linkedTags.length,
    };
  }

  // Calculate support ratio
  const supportCount = linkedTags.filter((t) => t.validationEffect === 'supports').length;
  const contradictCount = linkedTags.filter((t) => t.validationEffect === 'contradicts').length;
  const supportRatio = supportCount / linkedTags.length;

  // Check for validation
  if (supportRatio >= config.minimumSupportRatio) {
    return {
      canValidate: true,
      suggestedStatus: 'validated',
      reason: `${Math.round(supportRatio * 100)}% of ${linkedTags.length} interviews support this assumption`,
      supportRatio,
      supportCount,
      contradictCount,
      totalInterviews: linkedTags.length,
    };
  }

  // Check for invalidation
  if (supportRatio <= config.maximumSupportRatioForInvalidation) {
    return {
      canValidate: true,
      suggestedStatus: 'invalidated',
      reason: `Only ${Math.round(supportRatio * 100)}% of ${linkedTags.length} interviews support this assumption`,
      supportRatio,
      supportCount,
      contradictCount,
      totalInterviews: linkedTags.length,
      suggestPivot: true,
    };
  }

  // Mixed evidence
  return {
    canValidate: false,
    suggestedStatus: 'testing',
    reason: `Mixed evidence (${Math.round(supportRatio * 100)}% support) - need more interviews for clarity`,
    supportRatio,
    supportCount,
    contradictCount,
    totalInterviews: linkedTags.length,
  };
}

/**
 * Calculate interview requirements for a project
 */
export function calculateInterviewRequirements(
  interviews: EnhancedInterview[],
  assumptions: Assumption[],
  beachheadSegmentName: string,
  config: ValidationConfig = getValidationConfig()
): InterviewRequirements {
  // Count stage 1 interviews (interviews that address stage 1 assumptions)
  const stage1AssumptionIds = new Set(
    assumptions.filter((a) => a.validationStage === 1).map((a) => a.id)
  );

  const stage1Interviews = interviews.filter((i) =>
    i.assumptionTags.some((tag) => stage1AssumptionIds.has(tag.assumptionId))
  ).length;

  // Count beachhead interviews
  const beachheadInterviews = interviews.filter(
    (i) =>
      i.matchesBeachhead === true ||
      i.segmentName.toLowerCase() === beachheadSegmentName.toLowerCase()
  ).length;

  const stage1Complete = stage1Interviews >= config.stage1MinInterviews;
  const beachheadComplete = beachheadInterviews >= config.minimumBeachheadInterviews;

  // Calculate overall progress
  const stage1Progress = Math.min(stage1Interviews / config.stage1MinInterviews, 1);
  const beachheadProgress = Math.min(beachheadInterviews / config.minimumBeachheadInterviews, 1);
  const overallProgress = Math.round(((stage1Progress + beachheadProgress) / 2) * 100);

  return {
    stage1Interviews,
    stage1Required: config.stage1MinInterviews,
    stage1Complete,
    beachheadInterviews,
    beachheadRequired: config.minimumBeachheadInterviews,
    beachheadComplete,
    totalInterviews: interviews.length,
    overallProgress,
  };
}

/**
 * Check if interview matches beachhead segment
 */
export function doesInterviewMatchBeachhead(
  interview: EnhancedInterview,
  beachhead: BeachheadData | null
): boolean {
  if (!beachhead) return true; // No beachhead set, all interviews count
  if (interview.matchesBeachhead !== undefined) return interview.matchesBeachhead;

  // Fuzzy match on segment name
  return interview.segmentName.toLowerCase().trim() === beachhead.segmentName.toLowerCase().trim();
}

/**
 * Get prioritized assumptions for interview selection
 * Order: Stage 1 untested > Stage 1 testing > Stage 2 > Stage 3
 * Within each group: higher risk score first
 */
export function getPrioritizedAssumptionsForInterview(
  assumptions: Assumption[],
  stageStatuses: Record<ValidationStage, { canGraduate: boolean }>
): {
  stage1: Assumption[];
  stage2: Assumption[];
  stage3: Assumption[];
  recommended: Assumption[];
} {
  const statusOrder: Record<string, number> = {
    untested: 0,
    testing: 1,
    validated: 2,
    invalidated: 3,
  };

  const sortByPriority = (a: Assumption, b: Assumption) => {
    // First sort by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by risk score (higher first)
    const riskA = a.riskScore || (6 - a.confidence) * a.importance;
    const riskB = b.riskScore || (6 - b.confidence) * b.importance;
    return riskB - riskA;
  };

  const stage1 = assumptions.filter((a) => a.validationStage === 1).sort(sortByPriority);
  const stage2 = assumptions.filter((a) => a.validationStage === 2).sort(sortByPriority);
  const stage3 = assumptions.filter((a) => a.validationStage === 3).sort(sortByPriority);

  // Recommended: untested stage 1 first, then testing stage 1, then stage 2 if stage 1 complete
  let recommended: Assumption[] = [];

  // Always include untested/testing stage 1 assumptions
  const stage1Untested = stage1.filter((a) => a.status === 'untested' || a.status === 'testing');
  recommended = [...stage1Untested];

  // If stage 1 is complete, add stage 2
  if (stageStatuses[1].canGraduate) {
    const stage2Untested = stage2.filter((a) => a.status === 'untested' || a.status === 'testing');
    recommended = [...recommended, ...stage2Untested];
  }

  // If stage 2 is complete, add stage 3
  if (stageStatuses[2].canGraduate) {
    const stage3Untested = stage3.filter((a) => a.status === 'untested' || a.status === 'testing');
    recommended = [...recommended, ...stage3Untested];
  }

  // Limit recommended to top 5
  recommended = recommended.slice(0, 5);

  return { stage1, stage2, stage3, recommended };
}

/**
 * Generate validation suggestion message
 */
export function getValidationSuggestionMessage(eligibility: ValidationEligibility): string {
  if (eligibility.canValidate) {
    if (eligibility.suggestedStatus === 'validated') {
      return `✅ Strong evidence (${Math.round((eligibility.supportRatio || 0) * 100)}% support). Consider marking as validated.`;
    }
    if (eligibility.suggestedStatus === 'invalidated') {
      return `⚠️ Weak evidence (${Math.round((eligibility.supportRatio || 0) * 100)}% support). Consider pivoting or revising this assumption.`;
    }
  }
  return eligibility.reason;
}
