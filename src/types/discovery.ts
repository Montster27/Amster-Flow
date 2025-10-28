// Customer Discovery Module Type Definitions

export type AssumptionType = 'customer' | 'problem' | 'solution';
export type AssumptionStatus = 'untested' | 'testing' | 'validated' | 'invalidated';
export type InterviewFormat = 'in-person' | 'phone' | 'video' | 'survey';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very high

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
  format: InterviewFormat;
  duration?: number; // minutes
  notes: string;
  assumptionsAddressed: string[]; // Array of assumption IDs
  keyInsights: string[];
  surprises?: string;
  nextAction?: string;
  followUpNeeded: boolean;
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
