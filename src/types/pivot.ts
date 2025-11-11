// Type definitions for Pivot or Proceed Module
// Based on research-backed framework specification

export type DecisionPath = 'proceed' | 'patch' | 'pivot';

export type CognitiveBias =
  | 'confirmation'
  | 'sunk-cost'
  | 'overconfidence'
  | 'escalation-of-commitment'
  | 'optimism';

export type EvidenceSource = 'interview' | 'analytics' | 'experiment' | 'observation';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type HypothesisResult = 'validated' | 'invalidated' | 'inconclusive' | 'pending';

export type PivotType =
  | 'zoom-in'
  | 'zoom-out'
  | 'customer-segment'
  | 'customer-need'
  | 'platform'
  | 'business-architecture'
  | 'value-capture'
  | 'engine-of-growth'
  | 'channel'
  | 'technology';

export type PMFTrend = 'improving' | 'stable' | 'declining';

// Decision criteria for each path
export interface DecisionCriteria {
  proceed: {
    description: string;
    indicators: string[];
  };
  patch: {
    description: string;
    indicators: string[];
  };
  pivot: {
    description: string;
    indicators: string[];
  };
}

// Evidence quality score breakdown
export interface EvidenceQualityScore {
  sourceCredibility: number; // 0-100
  sampleSize: number; // 0-100
  recency: number; // 0-100
  directness: number; // 0-100
  overall: number; // Average of above
}

// Evidence quality metadata
export interface Evidence {
  id: string;
  source: EvidenceSource | string;
  type?: string; // Type of evidence
  description: string;
  sampleSize?: number;
  confidence?: ConfidenceLevel;
  recency?: string; // ISO date
  contradicts?: boolean; // Flags disconfirming evidence
  references?: string[]; // Interview IDs or data sources
  qualityScore?: EvidenceQualityScore;
}

// Product-Market Fit metrics
export interface ProductMarketFit {
  seanEllisScore?: number; // Percentage (0-100)
  pmfScore?: number; // Alias for seanEllisScore
  sampleSize?: number;
  surveyResponses?: number; // Number of survey responses
  methodology?: string; // Survey methodology used
  trend?: PMFTrend;
}

// Retention metrics
export interface RetentionMetrics {
  day1: number; // Percentage
  day7: number;
  day30: number;
  isFlattening: boolean;
}

// Unit economics
export interface UnitEconomics {
  ltv: number; // Lifetime value
  cac: number; // Customer acquisition cost
  ratio: number; // LTV:CAC ratio
  paybackPeriod: number; // Months
  monthlyBurn?: number; // Monthly cash burn
  monthsRunway?: number; // Runway in months
}

// Pain point with severity
export interface PainPoint {
  id: string;
  description: string;
  severity: number; // 1-10
  intensity?: number; // Alternative measure for severity
  frequency: string; // How often experienced
  quotes: string[]; // Supporting customer quotes
}

// Customer quote with context
export interface Quote {
  id: string;
  text: string;
  customerId: string;
  interviewId: string;
  context: string;
  source?: string; // Source of the quote
}

// Jobs-to-be-Done framework
export interface JobsToBeDone {
  functional: string[];
  emotional: string[];
  social: string[];
}

// Hypothesis tracking
export interface Hypothesis {
  id?: string;
  statement: string;
  testMethod?: 'interview' | 'prototype' | 'landing-page' | 'concierge';
  testConducted: string; // Description of test conducted
  successCriteria?: string;
  failCriteria?: string;
  result: HypothesisResult;
  evidenceIds?: string[];
  evidenceGathered: string; // Summary of evidence gathered
  lessonsLearned?: string;
  nextHypothesis?: string; // Next hypothesis to test
  createdAt?: string;
  testedAt?: string;
}

// Reframing questions (for cognitive debiasing)
export interface ReframingResponses {
  inheritanceQuestion: string; // "If you inherited this project..."
  contradictionQuestion: string; // "What evidence contradicts..."
  temporalQuestion: string; // "What would this week's version tell..."
}

// Confidence assessment for different areas
export interface ConfidenceAssessment {
  marketConfidence: number; // 0-100
  productConfidence: number;
  teamConfidence: number;
  resourceConfidence: number;
  timingConfidence: number;
  overallConfidence?: number;
}

// PIVOT readiness checklist
export interface PIVOTReadiness {
  proof: number; // Score 1-5
  insight: number; // Score 1-5
  viability: number; // Score 1-5
  organization: number; // Score 1-5
  timing: number; // Score 1-5
  overallScore?: number; // Calculated average
}

// Main pivot decision data structure
export interface PivotDecision {
  id: string;
  projectId: string;
  mode: 'easy' | 'detailed';
  iterationId?: string;
  decision: DecisionPath | null;

  // Cognitive debiasing
  preMortemInsights: string[];
  contradictoryEvidence: Evidence[];
  reframingResponses: ReframingResponses;

  // Quantitative metrics (optional for easy mode)
  productMarketFit?: ProductMarketFit;
  retentionMetrics?: RetentionMetrics;
  unitEconomics?: UnitEconomics;

  // Qualitative insights (optional for easy mode)
  jobsToBeDone?: JobsToBeDone;
  painPoints?: PainPoint[];
  customerQuotes?: Quote[];

  // Decision rationale
  hypothesisTested?: Hypothesis;
  decisionRationale: string;
  nextActions: string[];

  // Confidence assessment (easy mode)
  confidenceAssessment?: ConfidenceAssessment;

  // PIVOT readiness (for pivot decisions)
  pivotReadiness?: PIVOTReadiness;
  recommendedPivotType?: PivotType;

  // Reflection
  lessonsLearned: string[];
  biasesIdentified: CognitiveBias[];
  confidenceLevel: number; // Overall confidence in decision (0-100)

  // Meta-data
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  timeSpentMinutes: number;
  externalAdvisorsConsulted: string[];
}

// Progress summary auto-generated from discovery data
export interface ProgressSummary {
  interviewsCount: number;
  interviewsBenchmark: number; // e.g., 50
  assumptionsTotal: number;
  assumptionsValidated: number;
  assumptionsInvalidated: number;
  validationRate: number; // Percentage
  pmfScore?: number; // If calculated
  pmfBenchmark: number; // 40
}

// Decision guidance messages
export interface DecisionGuidance {
  decision: DecisionPath;
  message: string;
  followUpQuestion: string;
  psychologicalSafety: string;
}

// PMF trajectory prediction
export interface PMFTrajectory {
  currentPMF: number;
  trajectoryPerMonth: number;
  estimatedMonthsTo40: number;
  confidence: ConfidenceLevel;
  warningMessage?: string;
}

// Pivot type details
export interface PivotTypeDetail {
  type: PivotType;
  label: string;
  name: string; // Human-readable name
  description: string;
  examples: string[];
  whenToUse: string;
  whatChanges?: string; // What changes with this pivot
  whatStays?: string; // What remains the same
  risks?: string[]; // Associated risks
}

// Constants for decision criteria
export const DECISION_CRITERIA: DecisionCriteria = {
  proceed: {
    description: 'Continue with incremental improvements',
    indicators: [
      'PMF score >40%',
      'Retention curves flattening',
      'LTV:CAC >3:1'
    ]
  },
  patch: {
    description: 'Make structural changes without abandoning core',
    indicators: [
      'PMF 25-40%',
      'Single channel/segment issues',
      'Feature gaps identified'
    ]
  },
  pivot: {
    description: 'Fundamental strategic change',
    indicators: [
      'PMF <25%',
      'Declining retention',
      'No viable unit economics'
    ]
  }
};

// Pivot type descriptions
export const PIVOT_TYPES: Record<PivotType, PivotTypeDetail> = {
  'zoom-in': {
    type: 'zoom-in',
    label: 'Zoom-in Pivot',
    name: 'Zoom-in Pivot',
    description: 'One feature becomes the whole product',
    examples: ['Instagram (photo filters from Burbn)', 'YouTube (dating site video feature)'],
    whenToUse: 'When one feature has significantly higher engagement than others'
  },
  'zoom-out': {
    type: 'zoom-out',
    label: 'Zoom-out Pivot',
    name: 'Zoom-out Pivot',
    description: 'Product becomes a single feature of a larger product',
    examples: ['Groupon (The Point activism platform)', 'Slack (gaming company internal tool)'],
    whenToUse: 'When the product is too narrow and needs broader value proposition'
  },
  'customer-segment': {
    type: 'customer-segment',
    label: 'Customer Segment Pivot',
    name: 'Customer Segment Pivot',
    description: 'Same problem, different customer segment',
    examples: ['Dropbox (consumers to enterprise)', 'Slack (gaming to business)'],
    whenToUse: 'When a different segment shows much stronger product-market fit'
  },
  'customer-need': {
    type: 'customer-need',
    label: 'Customer Need Pivot',
    name: 'Customer Need Pivot',
    description: 'Same customer, different problem',
    examples: ['Twitter (podcasting to microblogging)', 'Pinterest (shopping to inspiration)'],
    whenToUse: 'When you discover a more urgent problem for the same customer'
  },
  'platform': {
    type: 'platform',
    label: 'Platform Pivot',
    name: 'Platform Pivot',
    description: 'Application to platform or vice versa',
    examples: ['Shopify (store to platform)', 'Flickr (gaming to photo sharing)'],
    whenToUse: 'When enabling others creates more value than doing it yourself'
  },
  'business-architecture': {
    type: 'business-architecture',
    label: 'Business Architecture Pivot',
    name: 'Business Architecture Pivot',
    description: 'High margin/low volume ↔ Low margin/high volume',
    examples: ['Amazon (books to everything)', 'Netflix (DVD to streaming)'],
    whenToUse: 'When unit economics require different business model'
  },
  'value-capture': {
    type: 'value-capture',
    label: 'Value Capture Pivot',
    name: 'Value Capture Pivot',
    description: 'Change in monetization model',
    examples: ['LinkedIn (subscriptions to freemium)', 'Evernote (paid to freemium)'],
    whenToUse: 'When current monetization doesn\'t match value delivered'
  },
  'engine-of-growth': {
    type: 'engine-of-growth',
    label: 'Engine of Growth Pivot',
    name: 'Engine of Growth Pivot',
    description: 'Viral ↔ Sticky ↔ Paid growth strategy',
    examples: ['Facebook (viral growth)', 'Salesforce (paid growth)'],
    whenToUse: 'When current growth engine is not scalable'
  },
  'channel': {
    type: 'channel',
    label: 'Channel Pivot',
    name: 'Channel Pivot',
    description: 'Change in distribution strategy',
    examples: ['Dell (retail to direct)', 'Dollar Shave Club (retail to DTC)'],
    whenToUse: 'When a different channel has better unit economics'
  },
  'technology': {
    type: 'technology',
    label: 'Technology Pivot',
    name: 'Technology Pivot',
    description: 'Same solution via different technology',
    examples: ['Netflix (DVD to streaming)', 'Apple (hardware to services)'],
    whenToUse: 'When new technology enables better solution delivery'
  }
};

// Benchmarks for progress summary
export const BENCHMARKS = {
  INTERVIEWS_TARGET: 50,
  PMF_PROCEED_THRESHOLD: 40,
  PMF_PATCH_MIN: 25,
  PMF_PATCH_MAX: 40,
  VALIDATION_RATE_MIN: 50,
  LTV_CAC_RATIO_MIN: 3.0,
  RETENTION_DAY1_GOOD: 40,
  RETENTION_DAY30_GOOD: 20
};

// Cognitive bias descriptions
export const BIAS_DESCRIPTIONS: Record<CognitiveBias, string> = {
  'confirmation': 'Seeking evidence that confirms existing beliefs while ignoring contradictory data',
  'sunk-cost': 'Continuing a course of action due to past investment rather than future value',
  'overconfidence': 'Overestimating the accuracy of your predictions and assessments',
  'escalation-of-commitment': 'Increasing commitment to a decision despite negative feedback',
  'optimism': 'Systematic underestimation of risks and overestimation of success probability'
};
