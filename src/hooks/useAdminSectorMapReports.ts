import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { captureException } from '../lib/sentry';
import type {
  ReportFilters,
  SectorMapSummaryMetrics,
  SectorMapDetailMetrics,
  ProjectSectorMapDetail,
  Organization,
  User,
} from '../types/adminReports';

interface VisualSectorMapData {
  actors?: Array<{ id: string; type: string; name?: string }>;
  connections?: Array<{ id: string; type?: string; from: string; to: string }>;
  annotations?: Array<{ id: string; type: string; text: string }>;
}

interface UseAdminSectorMapReportsResult {
  loading: boolean;
  error: string | null;
  summary: SectorMapSummaryMetrics | null;
  details: SectorMapDetailMetrics | null;
  projectDetails: ProjectSectorMapDetail[];
  organizations: Organization[];
  users: User[];
  refresh: () => void;
}

export function useAdminSectorMapReports(filters: ReportFilters): UseAdminSectorMapReportsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SectorMapSummaryMetrics | null>(null);
  const [details, setDetails] = useState<SectorMapDetailMetrics | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectSectorMapDetail[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch all data
      const [
        { data: firstTargets, error: firstTargetError },
        { data: competitors, error: competitorsError },
        { data: decisionMakers, error: decisionMakersError },
        { data: visualMaps, error: visualMapsError },
        { data: projects, error: projectsError },
        { data: orgs, error: orgsError },
        { data: profiles, error: profilesError },
      ] = await Promise.all([
        supabase.from('project_first_target').select('*'),
        supabase.from('project_competitors').select('*'),
        supabase.from('project_decision_makers').select('*'),
        supabase.from('project_visual_sector_map').select('*'),
        supabase.from('projects').select('*').is('deleted_at', null),
        supabase.from('organizations').select('id, name'),
        supabase.from('profiles').select('id, email, full_name'),
      ]);

      if (firstTargetError) throw firstTargetError;
      if (competitorsError) throw competitorsError;
      if (decisionMakersError) throw decisionMakersError;
      if (visualMapsError) throw visualMapsError;
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

      // Apply date filter to projects
      if (filters.dateRange.startDate) {
        filteredProjects = filteredProjects.filter(p =>
          p.created_at && new Date(p.created_at) >= filters.dateRange.startDate!
        );
      }
      if (filters.dateRange.endDate) {
        const endDatePlusOne = new Date(filters.dateRange.endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        filteredProjects = filteredProjects.filter(p =>
          p.created_at && new Date(p.created_at) < endDatePlusOne
        );
      }

      const projectIds = new Set(filteredProjects.map(p => p.id));

      // Filter sector map data by project
      const filteredFirstTargets = (firstTargets || []).filter(ft => projectIds.has(ft.project_id));
      const filteredCompetitors = (competitors || []).filter(c => projectIds.has(c.project_id));
      const filteredDecisionMakers = (decisionMakers || []).filter(dm => projectIds.has(dm.project_id));
      const filteredVisualMaps = (visualMaps || []).filter(vm => projectIds.has(vm.project_id));

      // Calculate Summary Metrics
      const projectsWithTarget = filteredFirstTargets.filter(ft =>
        ft.description && ft.description.trim() !== ''
      ).length;

      // Parse visual map data for actor/connection counts
      let totalActors = 0;
      const actorsByCategory: Record<string, number> = {};
      const connectionsByType: Record<string, number> = {};
      const annotationsByType: Record<string, number> = {};

      filteredVisualMaps.forEach(vm => {
        const data = vm.data as VisualSectorMapData | null;
        if (data) {
          if (data.actors) {
            totalActors += data.actors.length;
            data.actors.forEach(actor => {
              const type = actor.type || 'unknown';
              actorsByCategory[type] = (actorsByCategory[type] || 0) + 1;
            });
          }
          if (data.connections) {
            data.connections.forEach(conn => {
              const type = conn.type || 'unknown';
              connectionsByType[type] = (connectionsByType[type] || 0) + 1;
            });
          }
          if (data.annotations) {
            data.annotations.forEach(ann => {
              const type = ann.type || 'unknown';
              annotationsByType[type] = (annotationsByType[type] || 0) + 1;
            });
          }
        }
      });

      const summaryMetrics: SectorMapSummaryMetrics = {
        totalProjects: filteredProjects.length,
        projectsWithTarget,
        targetCustomerRate: filteredProjects.length > 0
          ? (projectsWithTarget / filteredProjects.length) * 100
          : 0,
        averageCompetitorsPerProject: filteredProjects.length > 0
          ? filteredCompetitors.length / filteredProjects.length
          : 0,
        totalCompetitors: filteredCompetitors.length,
        projectsWithVisualMap: filteredVisualMaps.length,
        visualMapRate: filteredProjects.length > 0
          ? (filteredVisualMaps.length / filteredProjects.length) * 100
          : 0,
        totalActors,
        actorsByCategory,
      };

      // Calculate Detail Metrics
      const customerTypeDistribution = {
        business: filteredFirstTargets.filter(ft => ft.customer_type === 'business').length,
        consumer: filteredFirstTargets.filter(ft => ft.customer_type === 'consumer').length,
        unknown: filteredFirstTargets.filter(ft => !ft.customer_type || (ft.customer_type !== 'business' && ft.customer_type !== 'consumer')).length,
      };

      const decisionMakersByInfluence = {
        'decision-maker': filteredDecisionMakers.filter(dm => dm.influence === 'decision-maker').length,
        influencer: filteredDecisionMakers.filter(dm => dm.influence === 'influencer').length,
        payer: filteredDecisionMakers.filter(dm => dm.influence === 'payer').length,
      };

      const detailMetrics: SectorMapDetailMetrics = {
        customerTypeDistribution,
        totalDecisionMakers: filteredDecisionMakers.length,
        decisionMakersByInfluence,
        connectionsByType,
        annotationsByType,
      };

      // Calculate Project-level Details
      const projectDetailsList: ProjectSectorMapDetail[] = filteredProjects.map(project => {
        const target = filteredFirstTargets.find(ft => ft.project_id === project.id);
        const projectCompetitors = filteredCompetitors.filter(c => c.project_id === project.id);
        const projectDecisionMakers = filteredDecisionMakers.filter(dm => dm.project_id === project.id);
        const visualMap = filteredVisualMaps.find(vm => vm.project_id === project.id);
        const org = orgs?.find(o => o.id === project.organization_id);
        const creator = profiles?.find(p => p.id === project.created_by);

        // Parse visual map for counts
        let actorCount = 0;
        let connectionCount = 0;
        if (visualMap?.data) {
          const data = visualMap.data as VisualSectorMapData;
          actorCount = data.actors?.length || 0;
          connectionCount = data.connections?.length || 0;
        }

        // Get latest activity date
        const activityDates = [
          target?.updated_at,
          ...projectCompetitors.map(c => c.created_at),
          ...projectDecisionMakers.map(dm => dm.created_at),
          visualMap?.updated_at,
        ].filter((d): d is string => d != null);

        return {
          projectId: project.id,
          projectName: project.name,
          organizationId: project.organization_id,
          organizationName: org?.name || 'Unknown',
          creatorId: project.created_by || '',
          creatorName: creator?.full_name || creator?.email || 'Unknown',
          hasTargetCustomer: !!(target?.description && target.description.trim() !== ''),
          customerType: target?.customer_type || null,
          competitorCount: projectCompetitors.length,
          decisionMakerCount: projectDecisionMakers.length,
          hasVisualMap: !!visualMap,
          actorCount,
          connectionCount,
          lastActivityDate: activityDates.length > 0 ? activityDates.sort().reverse()[0] : '',
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
      const error = err instanceof Error ? err : new Error('Error loading sector map reports');
      captureException(error, { extra: { context: 'useAdminSectorMapReports' } });
      setError('Failed to load sector map reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { loading, error, summary, details, projectDetails, organizations, users, refresh: loadData };
}
