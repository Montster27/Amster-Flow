import { useMemo } from 'react';
import type { Discovery2Assumption, EnhancedInterview } from '../../types/discovery';

interface DiscoveryDashboardProps {
  assumptions: Discovery2Assumption[];
  interviews: EnhancedInterview[];
}

export function DiscoveryDashboard({ assumptions, interviews }: DiscoveryDashboardProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const totalAssumptions = assumptions.length;
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.status === 'completed').length;

    // Assumption status breakdown
    const untested = assumptions.filter(a => a.status === 'untested').length;
    const testing = assumptions.filter(a => a.status === 'testing').length;
    const validated = assumptions.filter(a => a.status === 'validated').length;
    const invalidated = assumptions.filter(a => a.status === 'invalidated').length;

    // Priority breakdown
    const highPriority = assumptions.filter(a => a.priority === 'high').length;
    const mediumPriority = assumptions.filter(a => a.priority === 'medium').length;
    const lowPriority = assumptions.filter(a => a.priority === 'low').length;

    // Canvas area coverage
    const canvasAreaCounts: Record<string, number> = {};
    assumptions.forEach(a => {
      canvasAreaCounts[a.canvasArea] = (canvasAreaCounts[a.canvasArea] || 0) + 1;
    });

    // Interview coverage
    const testedAssumptions = assumptions.filter(a => (a.interviewCount || 0) > 0).length;
    const coverageRate = totalAssumptions > 0 ? (testedAssumptions / totalAssumptions) * 100 : 0;

    // Average confidence
    const avgConfidence = totalAssumptions > 0
      ? assumptions.reduce((sum, a) => sum + a.confidence, 0) / totalAssumptions
      : 0;

    // Risk distribution
    const highRisk = assumptions.filter(a => (a.riskScore || 0) >= 15).length;
    const mediumRisk = assumptions.filter(a => (a.riskScore || 0) >= 8 && (a.riskScore || 0) < 15).length;
    const lowRisk = assumptions.filter(a => (a.riskScore || 0) < 8).length;

    // Validation rate
    const validationRate = totalAssumptions > 0
      ? ((validated + invalidated) / totalAssumptions) * 100
      : 0;

    // Get most tested assumptions
    const mostTested = [...assumptions]
      .sort((a, b) => (b.interviewCount || 0) - (a.interviewCount || 0))
      .slice(0, 5);

    // Get highest risk untested
    const highRiskUntested = assumptions
      .filter(a => a.status === 'untested')
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 5);

    // Recent interviews
    const recentInterviews = [...interviews]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalAssumptions,
      totalInterviews,
      completedInterviews,
      untested,
      testing,
      validated,
      invalidated,
      highPriority,
      mediumPriority,
      lowPriority,
      canvasAreaCounts,
      coverageRate,
      avgConfidence,
      highRisk,
      mediumRisk,
      lowRisk,
      validationRate,
      mostTested,
      highRiskUntested,
      recentInterviews,
    };
  }, [assumptions, interviews]);

  const getCanvasAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      problem: 'Problem',
      existingAlternatives: 'Existing Alternatives',
      customerSegments: 'Customer Segments',
      earlyAdopters: 'Early Adopters',
      solution: 'Solution',
      uniqueValueProposition: 'Unique Value Prop',
      channels: 'Channels',
      revenueStreams: 'Revenue Streams',
      costStructure: 'Cost Structure',
      keyMetrics: 'Key Metrics',
      unfairAdvantage: 'Unfair Advantage',
    };
    return labels[area] || area;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Discovery Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your discovery progress, insights, and next steps
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Assumptions */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assumptions</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalAssumptions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">{metrics.highPriority} high priority</span>
          </div>
        </div>

        {/* Total Interviews */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalInterviews}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">{metrics.completedInterviews} completed</span>
          </div>
        </div>

        {/* Validation Rate */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validation Rate</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.validationRate.toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">{metrics.validated} validated</span>
            <span className="mx-1">·</span>
            <span className="text-red-600 font-medium">{metrics.invalidated} invalidated</span>
          </div>
        </div>

        {/* Coverage Rate */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interview Coverage</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.coverageRate.toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">Avg confidence: {metrics.avgConfidence.toFixed(1)}/5</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Assumption Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assumption Status</h3>
          <div className="space-y-3">
            {/* Untested */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Untested</span>
                <span className="text-sm font-bold text-gray-900">{metrics.untested}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.untested / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Testing */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Testing</span>
                <span className="text-sm font-bold text-gray-900">{metrics.testing}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.testing / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Validated */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Validated</span>
                <span className="text-sm font-bold text-gray-900">{metrics.validated}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.validated / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Invalidated */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Invalidated</span>
                <span className="text-sm font-bold text-gray-900">{metrics.invalidated}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.invalidated / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            {/* High Risk */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">High Risk (15+)</span>
                <span className="text-sm font-bold text-red-600">{metrics.highRisk}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.highRisk / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Risk */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Medium Risk (8-14)</span>
                <span className="text-sm font-bold text-yellow-600">{metrics.mediumRisk}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.mediumRisk / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low Risk */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Low Risk (&lt;8)</span>
                <span className="text-sm font-bold text-blue-600">{metrics.lowRisk}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${metrics.totalAssumptions > 0 ? (metrics.lowRisk / metrics.totalAssumptions) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Untested */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">High-Risk Untested</h3>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
              Action Required
            </span>
          </div>
          {metrics.highRiskUntested.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              🎉 All high-risk assumptions have been tested!
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.highRiskUntested.map((assumption) => (
                <div key={assumption.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-red-600">
                          🎯 {assumption.riskScore}
                        </span>
                        <span className="text-xs text-gray-600">
                          {getCanvasAreaLabel(assumption.canvasArea)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {assumption.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Interviews */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Interviews</h3>
          {metrics.recentInterviews.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No interviews yet. Start conducting interviews!
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.recentInterviews.map((interview) => (
                <div key={interview.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {interview.segmentName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          interview.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {interview.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatDate(interview.date)} · {interview.assumptionTags.length} assumptions tested
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next Steps Recommendations */}
      {(metrics.highRiskUntested.length > 0 || metrics.untested > 0 || metrics.totalInterviews < 5) && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recommended Next Steps
          </h3>
          <ul className="space-y-2">
            {metrics.highRiskUntested.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>
                  <strong>Priority:</strong> Test {metrics.highRiskUntested.length} high-risk untested assumption{metrics.highRiskUntested.length > 1 ? 's' : ''} through customer interviews
                </span>
              </li>
            )}
            {metrics.totalInterviews < 5 && (
              <li className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>
                  Conduct {5 - metrics.totalInterviews} more interview{5 - metrics.totalInterviews > 1 ? 's' : ''} to reach minimum validation threshold (5 interviews)
                </span>
              </li>
            )}
            {metrics.invalidated > 0 && (
              <li className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>
                  Review {metrics.invalidated} invalidated assumption{metrics.invalidated > 1 ? 's' : ''} and consider pivoting your approach
                </span>
              </li>
            )}
            {metrics.coverageRate < 80 && metrics.totalAssumptions > 0 && (
              <li className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>
                  Increase interview coverage to 80%+ (currently {metrics.coverageRate.toFixed(0)}%) by testing more assumptions
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
