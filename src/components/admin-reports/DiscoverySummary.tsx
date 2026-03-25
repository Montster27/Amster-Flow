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
      {/* Discovery Quality Score */}
      {summary && details && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Discovery Quality Score</h3>
          {(() => {
            // Calculate quality score components
            const avgInterviewsPerAssumption = summary.totalAssumptions > 0
              ? summary.totalInterviews / summary.totalAssumptions
              : 0;
            const interviewScore = Math.min(1, avgInterviewsPerAssumption / 5) * 25;

            // Segment diversity: check if all interviews are from same type
            const uniqueInterviewTypes = new Set(
              Object.entries(details.interviewsByType)
                .filter(([, count]) => count > 0)
                .map(([type]) => type)
            ).size;
            const diversityScore = Math.min(1, uniqueInterviewTypes / 3) * 15;

            // Confidence movement: check if any assumptions have been invalidated
            const hasNegativeSignal = summary.statusDistribution.invalidated > 0;
            const confidenceScore = hasNegativeSignal ? 20 : (summary.totalInterviews > 0 ? 5 : 0);

            // Stage progression time (approximate — check if validated quickly)
            const progressionScore = summary.validationRate < 100 || summary.totalInterviews >= 5 ? 15 : 5;

            // Pivot/patch audit
            const redAssumptions = summary.statusDistribution.invalidated;
            const pivotScore = redAssumptions >= 2 ? 10 : 25;

            const totalScore = interviewScore + diversityScore + confidenceScore + progressionScore + pivotScore;
            const rating = totalScore >= 70 ? 'Strong' : totalScore >= 50 ? 'Adequate' : totalScore >= 30 ? 'Concerning' : 'Insufficient Evidence';
            const ratingColor = totalScore >= 70 ? 'text-green-700 bg-green-100' : totalScore >= 50 ? 'text-blue-700 bg-blue-100' : totalScore >= 30 ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100';

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${ratingColor}`}>
                    {rating}
                  </span>
                  <span className="text-sm text-gray-500">{totalScore.toFixed(0)}/100</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Interview depth (avg per assumption)</span>
                    <span className="font-medium">{interviewScore.toFixed(0)}/25</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Segment diversity</span>
                    <span className="font-medium">{diversityScore.toFixed(0)}/15</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Confidence movement {!hasNegativeSignal && summary.totalInterviews > 0 ? '(no negative signal — suspicious)' : ''}</span>
                    <span className="font-medium">{confidenceScore.toFixed(0)}/20</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Stage progression pace</span>
                    <span className="font-medium">{progressionScore.toFixed(0)}/15</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Pivot/patch audit {redAssumptions >= 2 ? '(2+ red — needs pivot review)' : ''}</span>
                    <span className="font-medium">{pivotScore.toFixed(0)}/25</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
