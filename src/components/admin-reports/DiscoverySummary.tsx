import { StatCard, ProgressStatCard } from './StatCard';
import type { DiscoverySummaryMetrics, DiscoveryDetailMetrics } from '../../types/adminReports';

interface DiscoverySummaryProps {
  summary: DiscoverySummaryMetrics | null;
  details: DiscoveryDetailMetrics | null;
  loading: boolean;
}

export function DiscoverySummary({ summary, details, loading }: DiscoverySummaryProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8 text-gray-500">
        No discovery data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assumptions"
          value={summary.totalAssumptions}
          subtitle="across all projects"
          color="blue"
        />
        <StatCard
          title="Total Interviews"
          value={summary.totalInterviews}
          subtitle={`${summary.completedInterviews} completed, ${summary.draftInterviews} drafts`}
          color="green"
        />
        <StatCard
          title="Validation Rate"
          value={`${summary.validationRate.toFixed(0)}%`}
          subtitle="assumptions tested"
          color={summary.validationRate >= 50 ? 'green' : summary.validationRate >= 25 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Avg Confidence"
          value={summary.averageConfidence.toFixed(1)}
          subtitle="out of 5"
          color={summary.averageConfidence >= 3.5 ? 'green' : summary.averageConfidence >= 2.5 ? 'yellow' : 'red'}
        />
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressStatCard
          title="Assumption Status Distribution"
          items={[
            { label: 'Validated', value: summary.statusDistribution.validated, color: 'green' },
            { label: 'Invalidated', value: summary.statusDistribution.invalidated, color: 'red' },
            { label: 'Testing', value: summary.statusDistribution.testing, color: 'yellow' },
            { label: 'Untested', value: summary.statusDistribution.untested, color: 'gray' },
          ]}
        />
        <ProgressStatCard
          title="Risk Distribution"
          items={[
            { label: 'High Risk', value: summary.riskDistribution.high, color: 'red' },
            { label: 'Medium Risk', value: summary.riskDistribution.medium, color: 'yellow' },
            { label: 'Low Risk', value: summary.riskDistribution.low, color: 'green' },
          ]}
        />
        <ProgressStatCard
          title="Interview Completion"
          items={[
            { label: 'Completed', value: summary.completedInterviews, color: 'green' },
            { label: 'Draft', value: summary.draftInterviews, color: 'gray' },
          ]}
        />
      </div>

      {/* Detail Analytics */}
      {details && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProgressStatCard
            title="Assumptions by Type"
            items={[
              { label: 'Customer', value: details.assumptionsByType.customer, color: 'blue' },
              { label: 'Problem', value: details.assumptionsByType.problem, color: 'yellow' },
              { label: 'Solution', value: details.assumptionsByType.solution, color: 'green' },
            ]}
          />
          <ProgressStatCard
            title="Interview Types"
            items={[
              { label: 'Customer', value: details.interviewsByType.customer, color: 'blue' },
              { label: 'Expert', value: details.interviewsByType.expert, color: 'green' },
              { label: 'Partner', value: details.interviewsByType.partner, color: 'yellow' },
              { label: 'Regulator', value: details.interviewsByType.regulator, color: 'red' },
            ]}
          />
          <ProgressStatCard
            title="Validation Effects"
            items={[
              { label: 'Supports', value: details.validationEffects.supports, color: 'green' },
              { label: 'Contradicts', value: details.validationEffects.contradicts, color: 'red' },
              { label: 'Neutral', value: details.validationEffects.neutral, color: 'gray' },
            ]}
          />
        </div>
      )}

      {/* Canvas Area Coverage */}
      {details && Object.keys(details.assumptionsByCanvasArea).length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Canvas Area Coverage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(details.assumptionsByCanvasArea)
              .filter(([key]) => key !== 'unknown')
              .sort((a, b) => b[1] - a[1])
              .map(([area, count]) => (
                <div key={area} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 capitalize truncate">
                    {area.replace(/-/g, ' ')}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
