import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { captureException } from '../lib/sentry';
import type {
  ReportFilters,
  DiscoverySummaryMetrics,
  DiscoveryDetailMetrics,
  ProjectDiscoveryDetail,
  ActivityDataPoint,
  Organization,
  User,
} from '../types/adminReports';

interface UseAdminDiscoveryReportsResult {
  loading: boolean;
  error: string | null;
  summary: DiscoverySummaryMetrics | null;
  details: DiscoveryDetailMetrics | null;
  projectDetails: ProjectDiscoveryDetail[];
  organizations: Organization[];
  users: User[];
  refresh: () => void;
}

export function useAdminDiscoveryReports(filters: ReportFilters): UseAdminDiscoveryReportsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DiscoverySummaryMetrics | null>(null);
  const [details, setDetails] = useState<DiscoveryDetailMetrics | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDiscoveryDetail[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch all data
      const [
        { data: assumptions, error: assumptionsError },
        { data: interviews, error: interviewsError },
        { data: assumptionTags, error: tagsError },
        { data: projects, error: projectsError },
        { data: orgs, error: orgsError },
        { data: profiles, error: profilesError },
      ] = await Promise.all([
        supabase.from('project_assumptions').select('*'),
        supabase.from('project_interviews_enhanced').select('*'),
        supabase.from('interview_assumption_tags').select('*'),
        supabase.from('projects').select('*').is('deleted_at', null),
        supabase.from('organizations').select('id, name'),
        supabase.from('profiles').select('id, email, full_name'),
      ]);

      if (assumptionsError) throw assumptionsError;
      if (interviewsError) throw interviewsError;
      if (tagsError) throw tagsError;
      if (projectsError) throw projectsError;
      if (orgsError) throw orgsError;
      if (profilesError) throw profilesError;

      // Store organizations and users for filter dropdowns
      setOrganizations(orgs?.map(o => ({ id: o.id, name: o.name })) || []);
      setUsers(profiles?.map(p => ({ id: p.id, email: p.email, fullName: p.full_name })) || []);

      // Apply organization filter to projects
      let filteredProjects = projects || [];
      if (filters.organizationIds.length > 0) {
        filteredProjects = filteredProjects.filter(p =>
          filters.organizationIds.includes(p.organization_id)
        );
      }
      if (filters.userIds.length > 0) {
        filteredProjects = filteredProjects.filter(p =>
          filters.userIds.includes(p.created_by || '')
        );
      }

      const projectIds = new Set(filteredProjects.map(p => p.id));

      // Filter assumptions by project and date
      let filteredAssumptions = (assumptions || []).filter(a =>
        projectIds.has(a.project_id)
      );
      if (filters.dateRange.startDate) {
        filteredAssumptions = filteredAssumptions.filter(a =>
          a.created_at && new Date(a.created_at) >= filters.dateRange.startDate!
        );
      }
      if (filters.dateRange.endDate) {
        const endDatePlusOne = new Date(filters.dateRange.endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        filteredAssumptions = filteredAssumptions.filter(a =>
          a.created_at && new Date(a.created_at) < endDatePlusOne
        );
      }

      // Filter interviews by project and date
      let filteredInterviews = (interviews || []).filter(i =>
        projectIds.has(i.project_id)
      );
      if (filters.dateRange.startDate) {
        filteredInterviews = filteredInterviews.filter(i =>
          i.interview_date && new Date(i.interview_date) >= filters.dateRange.startDate!
        );
      }
      if (filters.dateRange.endDate) {
        const endDatePlusOne = new Date(filters.dateRange.endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        filteredInterviews = filteredInterviews.filter(i =>
          i.interview_date && new Date(i.interview_date) < endDatePlusOne
        );
      }

      // Filter assumption tags by filtered interviews
      const interviewIds = new Set(filteredInterviews.map(i => i.id));
      const filteredTags = (assumptionTags || []).filter(t =>
        interviewIds.has(t.interview_id)
      );

      // Calculate Summary Metrics
      const summaryMetrics: DiscoverySummaryMetrics = {
        totalAssumptions: filteredAssumptions.length,
        statusDistribution: {
          untested: filteredAssumptions.filter(a => a.status === 'untested').length,
          testing: filteredAssumptions.filter(a => a.status === 'testing').length,
          validated: filteredAssumptions.filter(a => a.status === 'validated').length,
          invalidated: filteredAssumptions.filter(a => a.status === 'invalidated').length,
        },
        totalInterviews: filteredInterviews.length,
        completedInterviews: filteredInterviews.filter(i => i.status === 'completed').length,
        draftInterviews: filteredInterviews.filter(i => i.status === 'draft').length,
        interviewCompletionRate: filteredInterviews.length > 0
          ? (filteredInterviews.filter(i => i.status === 'completed').length / filteredInterviews.length) * 100
          : 0,
        validationRate: filteredAssumptions.length > 0
          ? ((filteredAssumptions.filter(a => a.status === 'validated' || a.status === 'invalidated').length) / filteredAssumptions.length) * 100
          : 0,
        averageConfidence: filteredAssumptions.length > 0
          ? filteredAssumptions.reduce((sum, a) => sum + (a.confidence || 3), 0) / filteredAssumptions.length
          : 0,
        riskDistribution: calculateRiskDistribution(filteredAssumptions),
      };

      // Calculate Detail Metrics
      const detailMetrics: DiscoveryDetailMetrics = {
        assumptionsByType: {
          customer: filteredAssumptions.filter(a => a.type === 'customer').length,
          problem: filteredAssumptions.filter(a => a.type === 'problem').length,
          solution: filteredAssumptions.filter(a => a.type === 'solution').length,
        },
        assumptionsByCanvasArea: calculateCanvasAreaCoverage(filteredAssumptions),
        interviewsByType: {
          customer: filteredInterviews.filter(i => i.interviewee_type === 'customer').length,
          partner: filteredInterviews.filter(i => i.interviewee_type === 'partner').length,
          regulator: filteredInterviews.filter(i => i.interviewee_type === 'regulator').length,
          expert: filteredInterviews.filter(i => i.interviewee_type === 'expert').length,
          other: filteredInterviews.filter(i => i.interviewee_type === 'other').length,
        },
        validationEffects: {
          supports: filteredTags.filter(t => t.validation_effect === 'supports').length,
          contradicts: filteredTags.filter(t => t.validation_effect === 'contradicts').length,
          neutral: filteredTags.filter(t => t.validation_effect === 'neutral').length,
        },
        activityOverTime: calculateActivityOverTime(filteredAssumptions, filteredInterviews),
      };

      // Calculate Project-level Details
      const projectDetailsList: ProjectDiscoveryDetail[] = filteredProjects.map(project => {
        const projectAssumptions = filteredAssumptions.filter(a => a.project_id === project.id);
        const projectInterviews = filteredInterviews.filter(i => i.project_id === project.id);
        const org = orgs?.find(o => o.id === project.organization_id);
        const creator = profiles?.find(p => p.id === project.created_by);

        return {
          projectId: project.id,
          projectName: project.name,
          organizationId: project.organization_id,
          organizationName: org?.name || 'Unknown',
          creatorId: project.created_by || '',
          creatorName: creator?.full_name || creator?.email || 'Unknown',
          assumptionCount: projectAssumptions.length,
          interviewCount: projectInterviews.length,
          validatedCount: projectAssumptions.filter(a => a.status === 'validated').length,
          invalidatedCount: projectAssumptions.filter(a => a.status === 'invalidated').length,
          validationRate: projectAssumptions.length > 0
            ? ((projectAssumptions.filter(a => a.status === 'validated' || a.status === 'invalidated').length) / projectAssumptions.length) * 100
            : 0,
          avgConfidence: projectAssumptions.length > 0
            ? projectAssumptions.reduce((sum, a) => sum + (a.confidence || 3), 0) / projectAssumptions.length
            : 0,
          lastActivityDate: getLatestDate([
            ...projectAssumptions.map(a => a.created_at),
            ...projectInterviews.map(i => i.interview_date),
          ]),
        };
      });

      // Sort by last activity date (most recent first)
      projectDetailsList.sort((a, b) => {
        if (!a.lastActivityDate) return 1;
        if (!b.lastActivityDate) return -1;
        return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime();
      });

      setSummary(summaryMetrics);
      setDetails(detailMetrics);
      setProjectDetails(projectDetailsList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error loading discovery reports');
      captureException(error, { extra: { context: 'useAdminDiscoveryReports' } });
      setError('Failed to load discovery reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { loading, error, summary, details, projectDetails, organizations, users, refresh: loadData };
}

// Helper function to calculate risk distribution
function calculateRiskDistribution(assumptions: Array<{ confidence: number | null; type: string }>): {
  high: number;
  medium: number;
  low: number;
} {
  const result = { high: 0, medium: 0, low: 0 };

  assumptions.forEach(a => {
    const confidence = a.confidence || 3;
    // Simple risk score: lower confidence = higher risk
    // Using importance of 3 as default since we don't have it in the schema
    const riskScore = (6 - confidence) * 3;

    if (riskScore >= 15) {
      result.high++;
    } else if (riskScore >= 8) {
      result.medium++;
    } else {
      result.low++;
    }
  });

  return result;
}

// Helper function to calculate canvas area coverage
function calculateCanvasAreaCoverage(assumptions: Array<Record<string, unknown>>): Record<string, number> {
  const coverage: Record<string, number> = {};

  assumptions.forEach(a => {
    // Canvas area might be stored in different ways
    const canvasArea = (a.canvas_area as string) || (a.canvasArea as string) || 'unknown';
    coverage[canvasArea] = (coverage[canvasArea] || 0) + 1;
  });

  return coverage;
}

// Helper function to calculate activity over time
function calculateActivityOverTime(
  assumptions: Array<{ created_at: string | null }>,
  interviews: Array<{ interview_date: string }>
): ActivityDataPoint[] {
  const dateMap: Record<string, { assumptions: number; interviews: number }> = {};

  assumptions.forEach(a => {
    if (!a.created_at) return;
    const date = a.created_at.split('T')[0];
    if (!dateMap[date]) dateMap[date] = { assumptions: 0, interviews: 0 };
    dateMap[date].assumptions++;
  });

  interviews.forEach(i => {
    if (!i.interview_date) return;
    const date = i.interview_date.split('T')[0];
    if (!dateMap[date]) dateMap[date] = { assumptions: 0, interviews: 0 };
    dateMap[date].interviews++;
  });

  return Object.entries(dateMap)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Helper function to get latest date from array
function getLatestDate(dates: (string | null)[]): string {
  const validDates = dates.filter((d): d is string => d != null);
  if (validDates.length === 0) return '';
  return validDates.sort().reverse()[0];
}
