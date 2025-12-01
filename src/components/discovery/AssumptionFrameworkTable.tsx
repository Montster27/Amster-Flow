import type { Assumption, CanvasArea, PriorityLevel, ValidationGroup } from '../../types/discovery';
import { VALIDATION_GROUPS, getValidationGroup } from '../../types/discovery';

interface AssumptionFrameworkTableProps {
  assumptions: Assumption[];
  onEdit: (assumption: Assumption) => void;
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

// Group color themes
const GROUP_COLORS = {
  group1: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-600',
  },
  group2: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    badge: 'bg-purple-600',
  },
  group3: {
    border: 'border-green-400',
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'bg-green-600',
  },
};

export function AssumptionFrameworkTable({
  assumptions,
  onEdit,
  onDelete,
}: AssumptionFrameworkTableProps) {
  // Group assumptions by validation group
  const groupedAssumptions = {
    group1: assumptions.filter(a => getValidationGroup(a.canvasArea) === 'group1'),
    group2: assumptions.filter(a => getValidationGroup(a.canvasArea) === 'group2'),
    group3: assumptions.filter(a => getValidationGroup(a.canvasArea) === 'group3'),
  };

  // Sort within each group by risk score (highest first)
  Object.keys(groupedAssumptions).forEach(key => {
    const group = key as ValidationGroup;
    groupedAssumptions[group].sort((a, b) => {
      const riskA = a.riskScore || 0;
      const riskB = b.riskScore || 0;
      return riskB - riskA;
    });
  });

  // Calculate group completion stats
  const getGroupStats = (group: ValidationGroup) => {
    const groupAssumptions = groupedAssumptions[group];
    if (groupAssumptions.length === 0) return { total: 0, tested: 0, validated: 0, invalidated: 0, percentage: 0 };

    const tested = groupAssumptions.filter(a => a.status !== 'untested').length;
    const validated = groupAssumptions.filter(a => a.status === 'validated').length;
    const invalidated = groupAssumptions.filter(a => a.status === 'invalidated').length;
    const percentage = Math.round((tested / groupAssumptions.length) * 100);

    return { total: groupAssumptions.length, tested, validated, invalidated, percentage };
  };

  const renderAssumptionRow = (assumption: Assumption) => (
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

      {/* Assumption */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-md">
          {assumption.description}
        </div>
      </td>

      {/* Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-xs text-gray-500 capitalize">{assumption.type}</span>
      </td>

      {/* Risk Score */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
          (assumption.riskScore || 0) >= 15
            ? 'bg-red-100 text-red-800'
            : (assumption.riskScore || 0) >= 8
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {assumption.riskScore || 0}
        </span>
      </td>

      {/* Importance */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {assumption.importance}/5
      </td>

      {/* Confidence */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {assumption.confidence}/5
      </td>

      {/* Interviews */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {assumption.interviewCount || 0}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          assumption.status === 'validated'
            ? 'bg-green-100 text-green-800'
            : assumption.status === 'invalidated'
            ? 'bg-red-100 text-red-800'
            : assumption.status === 'testing'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {assumption.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(assumption)}
          className="text-blue-600 hover:text-blue-900 mr-4"
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
  );

  const renderGroupSection = (group: ValidationGroup, groupNumber: number) => {
    const groupInfo = VALIDATION_GROUPS[group];
    const colors = GROUP_COLORS[group];
    const stats = getGroupStats(group);
    const groupAssumptions = groupedAssumptions[group];

    return (
      <div key={group} className="mb-8">
        {/* Group Header */}
        <div className={`${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`${colors.badge} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                  Stage {groupNumber}
                </span>
                <h3 className={`text-xl font-bold ${colors.text}`}>
                  {groupInfo.name}
                </h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">{groupInfo.description}</p>

              {/* Progress Bar */}
              {stats.total > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors.badge} h-2 rounded-full transition-all`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.percentage}% tested
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Total: {stats.total}</span>
                    <span>✅ Validated: {stats.validated}</span>
                    <span>❌ Invalidated: {stats.invalidated}</span>
                    <span>🔬 Testing: {stats.tested - stats.validated - stats.invalidated}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Decision Guidance */}
            {groupNumber === 1 && stats.total > 0 && stats.tested > 0 && (
              <div className="ml-4 text-right">
                {stats.invalidated > stats.validated ? (
                  <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                    <p className="text-xs font-semibold text-red-800">⚠️ Consider pivoting</p>
                    <p className="text-xs text-red-700">More assumptions invalidated</p>
                  </div>
                ) : stats.percentage >= 70 ? (
                  <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2">
                    <p className="text-xs font-semibold text-green-800">✅ Ready for Stage 2</p>
                    <p className="text-xs text-green-700">Core validated</p>
                  </div>
                ) : (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
                    <p className="text-xs font-semibold text-yellow-800">🔬 Keep testing</p>
                    <p className="text-xs text-yellow-700">More validation needed</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assumptions Table for this Group */}
        {groupAssumptions.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                {groupAssumptions.map(renderAssumptionRow)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No assumptions in this stage yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Create assumptions for: {groupInfo.areas.map(a => CANVAS_AREA_LABELS[a]).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Workflow Overview */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 Progressive Validation Workflow</h3>
        <p className="text-xs text-gray-700 mb-3">
          Validate your idea in stages. If Stage 1 fails, pivot before investing in later stages.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="text-gray-600">Stage 1: Problem-Solution</span>
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-600"></span>
            <span className="text-gray-600">Stage 2: Market Fit</span>
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-600"></span>
            <span className="text-gray-600">Stage 3: Business Model</span>
          </div>
        </div>
      </div>

      {/* Render each group */}
      {renderGroupSection('group1', 1)}
      {renderGroupSection('group2', 2)}
      {renderGroupSection('group3', 3)}
    </div>
  );
}
