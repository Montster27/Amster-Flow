import type { Discovery2Assumption, CanvasArea, PriorityLevel } from '../../types/discovery';

interface AssumptionFrameworkTableProps {
  assumptions: Discovery2Assumption[];
  onEdit: (assumption: Discovery2Assumption) => void;
  onDelete: (id: string) => void;
}

// Canvas area display names
const CANVAS_AREA_LABELS: Record<CanvasArea, string> = {
  problem: 'Problem',
  existingAlternatives: 'Existing Alternatives',
  customerSegments: 'Customer Segments',
  earlyAdopters: 'Early Adopters',
  solution: 'Solution',
  uniqueValueProposition: 'UVP',
  channels: 'Channels',
  revenueStreams: 'Revenue',
  costStructure: 'Costs',
  keyMetrics: 'Metrics',
  unfairAdvantage: 'Unfair Advantage',
};

// Priority badge colors
const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export function AssumptionFrameworkTable({
  assumptions,
  onEdit,
  onDelete,
}: AssumptionFrameworkTableProps) {
  // Sort by risk score (highest first)
  const sortedAssumptions = [...assumptions].sort((a, b) => {
    const riskA = a.riskScore || 0;
    const riskB = b.riskScore || 0;
    return riskB - riskA;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              LBMC Area
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assumption
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Risk Score
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Importance
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Interviews
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAssumptions.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-500">
                No assumptions yet. Create your first assumption to get started.
              </td>
            </tr>
          ) : (
            sortedAssumptions.map((assumption) => (
              <tr key={assumption.id} className="hover:bg-gray-50">
                {/* Priority */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[assumption.priority]}`}>
                    {assumption.priority}
                  </span>
                </td>

                {/* LBMC Area */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-900">
                    {CANVAS_AREA_LABELS[assumption.canvasArea]}
                  </span>
                </td>

                {/* Description */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-md truncate">
                    {assumption.description}
                  </div>
                </td>

                {/* Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 capitalize">
                    {assumption.type}
                  </span>
                </td>

                {/* Risk Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {assumption.riskScore || 0}
                    </span>
                    {(assumption.riskScore || 0) >= 15 && (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </td>

                {/* Importance */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-4 rounded ${
                          level <= assumption.importance ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </td>

                {/* Confidence */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-4 rounded ${
                          level <= assumption.confidence ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </td>

                {/* Interview Count */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {assumption.interviewCount || 0}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded capitalize ${
                    assumption.status === 'validated' ? 'bg-green-100 text-green-800' :
                    assumption.status === 'invalidated' ? 'bg-red-100 text-red-800' :
                    assumption.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {assumption.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(assumption)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(assumption.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Summary Stats */}
      {sortedAssumptions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {sortedAssumptions.length}
            </div>
            <div className="text-sm text-gray-500">Total Assumptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {sortedAssumptions.filter(a => a.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {sortedAssumptions.filter(a => a.status === 'validated').length}
            </div>
            <div className="text-sm text-gray-500">Validated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sortedAssumptions.reduce((sum, a) => sum + (a.interviewCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Interviews</div>
          </div>
        </div>
      )}
    </div>
  );
}
