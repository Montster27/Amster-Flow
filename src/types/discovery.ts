// Customer Discovery Module Type Definitions

export type AssumptionType = 'customer' | 'problem' | 'solution';
export type AssumptionStatus = 'untested' | 'testing' | 'validated' | 'invalidated';
export type InterviewFormat = 'in-person' | 'phone' | 'video' | 'survey';
export type IntervieweeType = 'potential-buyer' | 'competitor' | 'substitute' | 'knowledgeable';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very high

// ============================================================================
// V2 TYPES: VALIDATION STAGES (Replaces VALIDATION_GROUPS)
// ============================================================================

// V2 Validation Stage numbers
export type ValidationStage = 1 | 2 | 3;

// V2 Stage definitions with progression requirements
export const VALIDATION_STAGES = {
  1: {
    name: 'Customer-Problem Fit',
    question: 'WHO has this problem and HOW BAD is it?',
    description: 'Validate that your customer exists and their problem is worth solving',
    color: 'blue',
    areas: ['customerSegments', 'problem'] as CanvasArea[],
    minimumInterviews: 5,
    graduationCriteria: {
      minConfidence: 4,
      maxInvalidated: 0,
    },
  },
  2: {
    name: 'Problem-Solution Fit',
    question: 'HOW should we solve it and for WHOM specifically?',
    description: 'Validate your solution approach and early adopter profile',
    color: 'purple',
    areas: ['existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters'] as CanvasArea[],
    minimumInterviews: 5,
    graduationCriteria: {
      minConfidence: 4,
      maxInvalidated: 1,
    },
  },
  3: {
    name: 'Business Model Viability',
    question: 'Can we BUILD and SCALE this profitably?',
    description: 'Validate the business model can sustain growth',
    color: 'green',
    areas: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage'] as CanvasArea[],
    minimumInterviews: 3,
    graduationCriteria: {
      minConfidence: 3,
      maxInvalidated: 2,
    },
  },
} as const;

// V2 Stage group mapping (for compatibility and quick lookups)
export const VALIDATION_STAGE_GROUPS = {
  1: ['customerSegments', 'problem'],
  2: ['existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters'],
  3: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage'],
} as const;

// ============================================================================
// LEAN BUSINESS MODEL CANVAS TYPES
// ============================================================================

// Lean Business Model Canvas (LBMC) areas
export type CanvasArea =
  // Stage 1: Customer-Problem Fit
  | 'customerSegments'
  | 'problem'
  // Stage 2: Problem-Solution Fit
  | 'existingAlternatives'
  | 'solution'
  | 'uniqueValueProposition'
  | 'earlyAdopters'
  // Stage 3: Business Model Viability
  | 'channels'
  | 'revenueStreams'
  | 'costStructure'
  | 'keyMetrics'
  | 'unfairAdvantage';

// Canvas area display labels
export const CANVAS_AREA_LABELS: Record<CanvasArea, string> = {
  customerSegments: 'Customer Segments',
  problem: 'Problem',
  existingAlternatives: 'Existing Alternatives',
  solution: 'Solution',
  uniqueValueProposition: 'Unique Value Proposition',
  earlyAdopters: 'Early Adopters',
  channels: 'Channels',
  revenueStreams: 'Revenue Streams',
  costStructure: 'Cost Structure',
  keyMetrics: 'Key Metrics',
  unfairAdvantage: 'Unfair Advantage',
};

// Helper to get validation stage for a canvas area
export function getStageForArea(area: CanvasArea): ValidationStage {
  if (VALIDATION_STAGE_GROUPS[1].includes(area as typeof VALIDATION_STAGE_GROUPS[1][number])) return 1;
  if (VALIDATION_STAGE_GROUPS[2].includes(area as typeof VALIDATION_STAGE_GROUPS[2][number])) return 2;
  return 3;
}

// ============================================================================
// LEGACY COMPATIBILITY (V1 - Deprecated but kept for migration)
// ============================================================================

// @deprecated Use ValidationStage instead
export type ValidationGroup = 'group1' | 'group2' | 'group3';

// @deprecated Use VALIDATION_STAGES instead
export const VALIDATION_GROUPS = {
  group1: {
    name: 'Problem-Solution Fit',
    description: 'Start here: Validate the core problem and solution',
    color: 'blue',
    areas: ['problem', 'customerSegments', 'solution'] as CanvasArea[],
  },
  group2: {
    name: 'Product-Market Fit',
    description: 'If Group 1 looks good, validate market positioning',
    color: 'purple',
    areas: ['existingAlternatives', 'earlyAdopters', 'uniqueValueProposition'] as CanvasArea[],
  },
  group3: {
    name: 'Business Viability',
    description: 'Finally, validate the business model',
    color: 'green',
    areas: ['channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage'] as CanvasArea[],
  },
} as const;

// @deprecated Use getStageForArea instead
export function getValidationGroup(area: CanvasArea): ValidationGroup {
  if (VALIDATION_GROUPS.group1.areas.includes(area)) return 'group1';
  if (VALIDATION_GROUPS.group2.areas.includes(area)) return 'group2';
  return 'group3';
}

// ============================================================================
// ASSUMPTION TYPES
// ============================================================================

// Priority level for assumption testing
export type PriorityLevel = 'high' | 'medium' | 'low';

// Step 0 assumption types (for graduation migration)
export type Step0AssumptionType = 'customerIdentity' | 'problemSeverity' | 'solutionHypothesis';

// Base assumption interface
export interface LegacyAssumption {
  id: string;
  type: AssumptionType;
  description: string;
  created: string; // ISO date string
  lastUpdated: string; // ISO date string
  status: AssumptionStatus;
  confidence: ConfidenceLevel;
  evidence: string[]; // Array of notes or links to interviews
  linkedModule?: string; // e.g., "problem", "customerSegments", "solution"
  linkedQuestionIndex?: number;
  validationNotes?: string;

  // System Structure integration (Phase 1)
  linkedActorIds?: string[]; // Links to actors in Visual Sector Map
  linkedConnectionIds?: string[]; // Links to connections in Visual Sector Map
}

// V2 Discovery Assumption (primary type used throughout the module)
export interface Assumption extends LegacyAssumption {
  // LBMC Integration
  canvasArea: CanvasArea;

  // V2: Validation stage (1, 2, or 3)
  validationStage: ValidationStage;

  // Risk-based prioritization
  importance: ConfidenceLevel; // 1-5: How critical is this assumption?
  priority: PriorityLevel; // Calculated or manually set: high/medium/low
  riskScore?: number; // Calculated: (6 - confidence) * importance

  // Enhanced tracking
  interviewCount?: number; // Number of interviews that addressed this
  lastTestedDate?: string; // ISO date of most recent interview

  // V2: Migration tracking
  migratedFromStep0?: boolean; // True if created during graduation
  sourceSegment?: string; // Name of the segment this relates to
  step0AssumptionType?: Step0AssumptionType; // Original type from Step 0
}

// Alias for backward compatibility
export type Discovery2Assumption = Assumption;

// ============================================================================
// INTERVIEW TYPES
// ============================================================================

export type IntervieweeTypeEnhanced = 'customer' | 'partner' | 'regulator' | 'expert' | 'other';
export type ValidationEffect = 'supports' | 'contradicts' | 'neutral';
export type InterviewStatus = 'draft' | 'completed';

// Tag linking interview insights to assumptions
export interface AssumptionTag {
  assumptionId: string;
  validationEffect: ValidationEffect;
  confidenceChange: number; // -2 to +2
  quote?: string; // Optional supporting quote
}

// Enhanced Interview with structured fields
export interface EnhancedInterview {
  id: string;

  // Metadata
  intervieweeType: IntervieweeTypeEnhanced;
  segmentName: string;
  date: string; // ISO date string
  context: string;
  status: InterviewStatus;

  // Key Findings
  mainPainPoints: string;
  problemImportance: ConfidenceLevel; // 1-5 Likert scale
  problemImportanceQuote?: string;
  currentAlternatives: string;
  memorableQuotes: string[];
  surprisingFeedback: string;

  // Assumption Tags
  assumptionTags: AssumptionTag[];

  // Reflection
  studentReflection: string;
  mentorFeedback?: string;

  // System fields
  created: string; // ISO date string
  lastUpdated: string;

  // V2: Beachhead tracking
  matchesBeachhead?: boolean; // True if interviewee matches beachhead segment
  deviationAcknowledged?: boolean; // True if user acknowledged deviation
  deviationReason?: string; // Why interviewing outside beachhead
}

// ============================================================================
// BEACHHEAD & PROJECT TYPES
// ============================================================================

// Beachhead segment selection stored in project
export interface BeachheadData {
  segmentId: string;
  segmentName: string;
  selectedAt: string; // ISO timestamp
  step0Score: number;
  focusHistory: {
    segmentId: string;
    segmentName: string;
    changedAt: string;
    reason?: string;
  }[];
}

// ============================================================================
// STAGE STATUS TYPES
// ============================================================================

export interface StageStatus {
  stage: ValidationStage;
  interviewCount: number;
  interviewsNeeded: number;
  avgConfidence: number;
  validatedCount: number;
  invalidatedCount: number;
  untestedCount: number;
  totalAssumptions: number;
  canGraduate: boolean;
  isUnlocked: boolean;
  recommendation: string;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface Iteration {
  id: string;
  date: string; // ISO date string
  version: number;
  changes: string;
  reasoning: string;
  assumptionsAffected: string[]; // Array of assumption IDs
  patternsObserved?: string;
  riskiestAssumption?: string; // assumption ID
  nextExperiment?: string;
}

export interface AssumptionTemplate {
  type: AssumptionType;
  prompts: string[];
}

export interface InterviewTemplate {
  category: string;
  questions: string[];
}

// Synthesis result from multiple interviews
export interface InterviewSynthesis {
  interviewIds: string[];
  dateRange: {
    start: string;
    end: string;
  };
  patterns: {
    mostMentionedPainPoint: string;
    mostInvalidatedAssumption?: string;
    mostDiscussedSegments: string[];
  };
  assumptionSummaries: {
    assumptionId: string;
    supportingEvidence: string[];
    contradictingEvidence: string[];
    netEffect: ValidationEffect;
  }[];
}

// Legacy interview type (kept for reference)
export interface LegacyInterview {
  id: string;
  date: string;
  customerSegment: string;
  interviewee?: string;
  intervieweeType?: IntervieweeType;
  format: InterviewFormat;
  duration?: number;
  notes: string;
  assumptionsAddressed: string[];
  keyInsights: string[];
  surprises?: string;
  nextAction?: string;
  followUpNeeded: boolean;
  status?: 'draft' | 'completed';
}

// Enhanced Assumption (legacy - extends old base)
export interface EnhancedAssumption extends LegacyAssumption {
  category: 'problem' | 'solution' | 'customer' | 'price' | 'channel';
  evidenceCount: number;
  supportingCount: number;
  contradictingCount: number;
  lastInterviewDate?: string;
}
