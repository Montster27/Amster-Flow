// Type definitions for Admin Reports: Discovery & Sector Map

// Date range for filtering
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Filter state for reports
export interface ReportFilters {
  dateRange: DateRange;
  organizationIds: string[];  // Empty = all organizations
  userIds: string[];          // Empty = all users
}

// ============================================
// Discovery Module Types
// ============================================

export interface DiscoverySummaryMetrics {
  totalAssumptions: number;
  statusDistribution: {
    untested: number;
    testing: number;
    validated: number;
    invalidated: number;
  };
  totalInterviews: number;
  completedInterviews: number;
  draftInterviews: number;
  interviewCompletionRate: number;
  validationRate: number;
  averageConfidence: number;
  riskDistribution: {
    high: number;   // riskScore >= 15
    medium: number; // riskScore 8-14
    low: number;    // riskScore < 8
  };
}

export interface DiscoveryDetailMetrics {
  assumptionsByType: {
    customer: number;
    problem: number;
    solution: number;
  };
  assumptionsByCanvasArea: Record<string, number>;
  interviewsByType: {
    customer: number;
    partner: number;
    regulator: number;
    expert: number;
    other: number;
  };
  validationEffects: {
    supports: number;
    contradicts: number;
    neutral: number;
  };
  activityOverTime: ActivityDataPoint[];
}

export interface ActivityDataPoint {
  date: string;
  assumptions: number;
  interviews: number;
}

export interface ProjectDiscoveryDetail {
  projectId: string;
  projectName: string;
  organizationId: string;
  organizationName: string;
  creatorId: string;
  creatorName: string;
  assumptionCount: number;
  interviewCount: number;
  validatedCount: number;
  invalidatedCount: number;
  validationRate: number;
  avgConfidence: number;
  lastActivityDate: string;
}

// ============================================
// Sector Map Module Types
// ============================================

export interface SectorMapSummaryMetrics {
  totalProjects: number;
  projectsWithTarget: number;
  targetCustomerRate: number;
  averageCompetitorsPerProject: number;
  totalCompetitors: number;
  projectsWithVisualMap: number;
  visualMapRate: number;
  totalActors: number;
  actorsByCategory: Record<string, number>;
}

export interface SectorMapDetailMetrics {
  customerTypeDistribution: {
    business: number;
    consumer: number;
    unknown: number;
  };
  totalDecisionMakers: number;
  decisionMakersByInfluence: {
    'decision-maker': number;
    influencer: number;
    payer: number;
  };
  connectionsByType: Record<string, number>;
  annotationsByType: Record<string, number>;
}

export interface ProjectSectorMapDetail {
  projectId: string;
  projectName: string;
  organizationId: string;
  organizationName: string;
  creatorId: string;
  creatorName: string;
  hasTargetCustomer: boolean;
  customerType: string | null;
  competitorCount: number;
  decisionMakerCount: number;
  hasVisualMap: boolean;
  actorCount: number;
  connectionCount: number;
  lastActivityDate: string;
}

// ============================================
// Shared Types
// ============================================

export interface Organization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
}

// Sort configuration for tables
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Column definition for data tables
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  format?: (value: T[keyof T], row: T) => string | React.ReactNode;
  className?: string;
}

// Date range preset options
export type DateRangePreset =
  | 'today'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'allTime';

export interface DateRangePresetOption {
  key: DateRangePreset;
  label: string;
  getRange: () => DateRange;
}
