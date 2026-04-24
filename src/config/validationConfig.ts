/**
 * V2 Validation Configuration
 * Configurable thresholds for interview validation and stage progression
 */

export interface ValidationConfig {
  // Minimum interviews before any assumption can be marked "validated"
  minimumInterviewsForValidation: number;

  // Minimum interviews with beachhead segment for Stage 1
  minimumBeachheadInterviews: number;

  // Support ratio requirements
  minimumSupportRatio: number; // 60% of interviews must support for validation
  maximumSupportRatioForInvalidation: number; // If only 30% support, suggest invalidation

  // Confidence thresholds (1-5 scale)
  confidenceToValidate: number; // "Likely True" or higher
  confidenceToInvalidate: number; // "Unlikely True" or lower

  // Stage-specific requirements
  stage1MinInterviews: number;
  stage2MinInterviews: number;
  stage3MinInterviews: number;

  // Graduation criteria
  stage1MinConfidence: number;
  stage1MaxInvalidated: number;
  stage2MinConfidence: number;
  stage2MaxInvalidated: number;
  stage3MinConfidence: number;
  stage3MaxInvalidated: number;
}

// Default configuration
const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minimumInterviewsForValidation: 3,
  minimumBeachheadInterviews: 5,
  minimumSupportRatio: 0.6,
  maximumSupportRatioForInvalidation: 0.3,
  confidenceToValidate: 4,
  confidenceToInvalidate: 2,
  stage1MinInterviews: 5,
  stage2MinInterviews: 5,
  stage3MinInterviews: 3,
  stage1MinConfidence: 4,
  stage1MaxInvalidated: 0,
  stage2MinConfidence: 4,
  stage2MaxInvalidated: 1,
  stage3MinConfidence: 3,
  stage3MaxInvalidated: 2,
};

/**
 * Get validation configuration
 * Can be extended to load from environment variables or project settings
 */
export function getValidationConfig(projectOverrides?: Partial<ValidationConfig>): ValidationConfig {
  // Start with defaults
  let config = { ...DEFAULT_VALIDATION_CONFIG };

  // Apply environment variable overrides if available
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_MIN_INTERVIEWS_FOR_VALIDATION) {
      config.minimumInterviewsForValidation = parseInt(process.env.VITE_MIN_INTERVIEWS_FOR_VALIDATION, 10);
    }
    if (process.env.VITE_MIN_BEACHHEAD_INTERVIEWS) {
      config.minimumBeachheadInterviews = parseInt(process.env.VITE_MIN_BEACHHEAD_INTERVIEWS, 10);
    }
    if (process.env.VITE_MIN_SUPPORT_RATIO) {
      config.minimumSupportRatio = parseFloat(process.env.VITE_MIN_SUPPORT_RATIO);
    }
  }

  // Apply project-specific overrides
  if (projectOverrides) {
    config = { ...config, ...projectOverrides };
  }

  return config;
}

/**
 * Export default config for direct import
 */
export const VALIDATION_CONFIG = getValidationConfig();

/**
 * Scoring guidance for Pain/Access/Willingness ratings
 */
export const SCORING_GUIDANCE = {
  pain: {
    1: 'Mild inconvenience - they can live with it',
    2: 'Noticeable problem - they complain but don\'t act',
    3: 'Significant issue - they\'ve tried workarounds',
    4: 'Severe problem - actively searching for solutions',
    5: 'Desperate - will pay almost anything to solve it',
  },
  access: {
    1: 'Very hard to reach - no clear channels',
    2: 'Difficult - requires significant effort',
    3: 'Moderate - some connections or channels exist',
    4: 'Good access - clear path to reach them',
    5: 'Immediate access - can contact within 48 hours',
  },
  willingness: {
    1: 'Unlikely to talk - very private or busy',
    2: 'Hesitant - would need strong incentive',
    3: 'Neutral - might talk if approached well',
    4: 'Open - generally willing to share experiences',
    5: 'Eager - enjoys discussing challenges and solutions',
  },
} as const;

/**
 * Calculate beachhead readiness score.
 *
 * The Step 0 v2 schema captures `accessRank` (1-5) per segment — how easy the
 * segment is to reach — and a ranked list of need-categorized benefits. There
 * is no separate pain or willingness score on the segment record, so readiness
 * is driven by accessRank alone. A well-ranked segment has rank >= 4.
 */
export function calculateBeachheadReadiness(segment: {
  accessRank: number;
  benefits?: { text: string }[];
}): {
  score: number;
  isReady: boolean;
  guidance: string;
} {
  const accessRank = segment.accessRank ?? 0;
  const benefitCount = segment.benefits?.length ?? 0;

  // Score uses a 0-10 range so downstream UI can display it consistently.
  // Access rank contributes up to 5 points (the rank itself), benefits
  // contribute up to 5 points (1 per benefit, capped) — having articulated
  // benefits signals the user has thought through what the segment gets.
  const score = accessRank + Math.min(benefitCount, 5);

  const isReady = accessRank >= 4 && benefitCount > 0;

  let guidance: string;
  if (isReady) {
    guidance = 'Great beachhead candidate! Easy to reach and benefits articulated.';
  } else if (accessRank < 4) {
    guidance = 'Hard to reach this segment. Consider whether you have a direct channel.';
  } else if (benefitCount === 0) {
    guidance = 'Good access, but no benefits articulated yet. What does this segment get?';
  } else {
    guidance = 'Moderate candidate. Consider if there\'s a better starting point.';
  }

  return {
    score,
    isReady,
    guidance,
  };
}
