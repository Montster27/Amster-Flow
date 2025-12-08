import { StatCard, ProgressStatCard } from './StatCard';
import type { SectorMapSummaryMetrics, SectorMapDetailMetrics } from '../../types/adminReports';

interface SectorMapSummaryProps {
  summary: SectorMapSummaryMetrics | null;
  details: SectorMapDetailMetrics | null;
  loading: boolean;
}

export function SectorMapSummary({ summary, details, loading }: SectorMapSummaryProps) {
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
        No sector map data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Target Customer Rate"
          value={`${summary.targetCustomerRate.toFixed(0)}%`}
          subtitle={`${summary.projectsWithTarget} of ${summary.totalProjects} projects`}
          color={summary.targetCustomerRate >= 75 ? 'green' : summary.targetCustomerRate >= 50 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Avg Competitors"
          value={summary.averageCompetitorsPerProject.toFixed(1)}
          subtitle={`${summary.totalCompetitors} total competitors tracked`}
          color="blue"
        />
        <StatCard
          title="Visual Map Rate"
          value={`${summary.visualMapRate.toFixed(0)}%`}
          subtitle={`${summary.projectsWithVisualMap} projects with visual maps`}
          color={summary.visualMapRate >= 50 ? 'green' : summary.visualMapRate >= 25 ? 'yellow' : 'gray'}
        />
        <StatCard
          title="Total Actors"
          value={summary.totalActors}
          subtitle="in visual sector maps"
          color="purple"
        />
      </div>

      {/* Detail Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {details && (
          <>
            <ProgressStatCard
              title="Customer Type Distribution"
              items={[
                { label: 'Business (B2B)', value: details.customerTypeDistribution.business, color: 'blue' },
                { label: 'Consumer (B2C)', value: details.customerTypeDistribution.consumer, color: 'green' },
                { label: 'Not Specified', value: details.customerTypeDistribution.unknown, color: 'gray' },
              ]}
            />
            {details.totalDecisionMakers > 0 && (
              <ProgressStatCard
                title="Decision Makers by Influence"
                items={[
                  { label: 'Decision Maker', value: details.decisionMakersByInfluence['decision-maker'], color: 'blue' },
                  { label: 'Influencer', value: details.decisionMakersByInfluence.influencer, color: 'yellow' },
                  { label: 'Payer', value: details.decisionMakersByInfluence.payer, color: 'green' },
                ]}
              />
            )}
          </>
        )}

        {/* Actor Categories */}
        {summary.totalActors > 0 && Object.keys(summary.actorsByCategory).length > 0 && (
          <ProgressStatCard
            title="Actors by Category"
            items={Object.entries(summary.actorsByCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([category, count], index) => ({
                label: formatCategoryLabel(category),
                value: count,
                color: getCategoryColor(index),
              }))}
          />
        )}
      </div>

      {/* Connection Types */}
      {details && Object.keys(details.connectionsByType).length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Connection Types in Visual Maps</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(details.connectionsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 capitalize truncate">
                    {formatCategoryLabel(type)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Annotation Types */}
      {details && Object.keys(details.annotationsByType).length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Map Annotations</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(details.annotationsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  className={`px-3 py-2 rounded-lg ${getAnnotationColor(type)}`}
                >
                  <span className="font-semibold">{count}</span>
                  <span className="ml-1 text-sm capitalize">{type}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCategoryLabel(category: string): string {
  return category
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getCategoryColor(index: number): 'blue' | 'green' | 'yellow' | 'red' | 'gray' {
  const colors: Array<'blue' | 'green' | 'yellow' | 'red' | 'gray'> = [
    'blue', 'green', 'yellow', 'red', 'gray', 'blue'
  ];
  return colors[index % colors.length];
}

function getAnnotationColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'insight':
      return 'bg-green-100 text-green-800';
    case 'question':
      return 'bg-blue-100 text-blue-800';
    case 'risk':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
