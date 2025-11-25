// Customer Discovery Module Type Definitions

export type AssumptionType = 'customer' | 'problem' | 'solution';
export type AssumptionStatus = 'untested' | 'testing' | 'validated' | 'invalidated';
export type InterviewFormat = 'in-person' | 'phone' | 'video' | 'survey';
export type IntervieweeType = 'potential-buyer' | 'competitor' | 'substitute' | 'knowledgeable';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very high

// ============================================================================
// DISCOVERY 2.0 TYPES (Lean Business Model Canvas Integration)
// ============================================================================

// Lean Business Model Canvas (LBMC) areas
export type CanvasArea =
  | 'problem'
  | 'existingAlternatives'
  | 'customerSegments'
  | 'earlyAdopters'
  | 'solution'
  | 'uniqueValueProposition'
  | 'channels'
  | 'revenueStreams'
  | 'costStructure'
  | 'keyMetrics'
  | 'unfairAdvantage';

// Progressive validation groups (staged approach)
export type ValidationGroup = 'group1' | 'group2' | 'group3';

// Group definitions for progressive validation workflow
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

// Helper to get validation group for a canvas area
export function getValidationGroup(area: CanvasArea): ValidationGroup {
  if (VALIDATION_GROUPS.group1.areas.includes(area)) return 'group1';
  if (VALIDATION_GROUPS.group2.areas.includes(area)) return 'group2';
  return 'group3';
}

// Priority level for assumption testing
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Assumption {
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
}

export interface Interview {
  id: string;
  date: string; // ISO date string
  customerSegment: string;
  interviewee?: string;
  intervieweeType?: IntervieweeType; // Type of person being interviewed
  format: InterviewFormat;
  duration?: number; // minutes
  notes: string;
  assumptionsAddressed: string[]; // Array of assumption IDs
  keyInsights: string[];
  surprises?: string;
  nextAction?: string;
  followUpNeeded: boolean;
  status?: 'draft' | 'completed'; // Interview status
}

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

// ============================================================================
// ENHANCED INTERVIEW SYSTEM (New Structured Approach)
// ============================================================================

export type IntervieweeTypeEnhanced = 'customer' | 'partner' | 'regulator' | 'expert' | 'other';
export type ValidationEffect = 'supports' | 'contradicts' | 'neutral';
export type InterviewStatus = 'draft' | 'completed';

// Enhanced Assumption with additional tracking fields
export interface EnhancedAssumption extends Assumption {
  category: 'problem' | 'solution' | 'customer' | 'price' | 'channel';
  evidenceCount: number;
  supportingCount: number;
  contradictingCount: number;
  lastInterviewDate?: string;
}

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

// ============================================================================
// DISCOVERY 2.0 ASSUMPTION (Extended with LBMC Integration)
// ============================================================================

export interface Discovery2Assumption extends Assumption {
  // LBMC Integration
  canvasArea: CanvasArea; // Which LBMC area this assumption relates to

  // Risk-based prioritization
  importance: ConfidenceLevel; // 1-5: How critical is this assumption?
  priority: PriorityLevel; // Calculated or manually set: high/medium/low
  riskScore?: number; // Calculated: (6 - confidence) * importance

  // Enhanced tracking
  interviewCount?: number; // Number of interviews that addressed this
  lastTestedDate?: string; // ISO date of most recent interview
}
