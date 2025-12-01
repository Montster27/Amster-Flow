import { useState } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import type { Assumption, AssumptionStatus } from '../../types/discovery';

interface ValidationBoardProps {
  assumptions: Assumption[];
}

const STATUS_COLUMNS: { status: AssumptionStatus; title: string; color: string }[] = [
  { status: 'untested', title: 'Untested', color: 'bg-gray-50 border-gray-200' },
  { status: 'testing', title: 'Testing', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'validated', title: 'Validated', color: 'bg-green-50 border-green-200' },
  { status: 'invalidated', title: 'Invalidated', color: 'bg-red-50 border-red-200' },
];

export function ValidationBoard({ assumptions }: ValidationBoardProps) {
  const { updateAssumption } = useDiscovery();
  const [draggedAssumption, setDraggedAssumption] = useState<Assumption | null>(null);

  const handleDragStart = (assumption: Assumption) => {
    setDraggedAssumption(assumption);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: AssumptionStatus) => {
    if (draggedAssumption && draggedAssumption.status !== newStatus) {
      updateAssumption(draggedAssumption.id, {
        ...draggedAssumption,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        ...(newStatus === 'testing' && !draggedAssumption.lastTestedDate
          ? { lastTestedDate: new Date().toISOString() }
          : {}),
      });
    }
    setDraggedAssumption(null);
  };

  const getAssumptionsByStatus = (status: AssumptionStatus) => {
    return assumptions.filter((a) => a.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCanvasAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      problem: 'Problem',
      existingAlternatives: 'Alternatives',
      customerSegments: 'Customers',
      earlyAdopters: 'Early Adopters',
      solution: 'Solution',
      uniqueValueProposition: 'UVP',
      channels: 'Channels',
      revenueStreams: 'Revenue',
      costStructure: 'Costs',
      keyMetrics: 'Metrics',
      unfairAdvantage: 'Advantage',
    };
    return labels[area] || area;
  };

  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Validation Board</h2>
        <p className="mt-1 text-sm text-gray-500">
          Drag assumptions across columns to update their validation status
        </p>
      </div>

      {assumptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assumptions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create assumptions in the Assumptions Framework tab first
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((column) => {
            const columnAssumptions = getAssumptionsByStatus(column.status);
            return (
              <div
                key={column.status}
                className="flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.status)}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-t-lg border-2 ${column.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-600 bg-white rounded-full">
                      {columnAssumptions.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className={`flex-1 p-3 border-2 border-t-0 rounded-b-lg ${column.color} min-h-[400px]`}>
                  <div className="space-y-3">
                    {columnAssumptions.map((assumption) => (
                      <div
                        key={assumption.id}
                        draggable
                        onDragStart={() => handleDragStart(assumption)}
                        className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                      >
                        {/* Priority & Canvas Area */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 border rounded ${getPriorityColor(assumption.priority)}`}>
                            {assumption.priority}
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {getCanvasAreaLabel(assumption.canvasArea)}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-800 mb-2 line-clamp-3">
                          {assumption.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span title="Risk Score">
                              🎯 {assumption.riskScore || 0}
                            </span>
                            <span title="Interview Count">
                              💬 {assumption.interviewCount}
                            </span>
                          </div>
                          <span className="capitalize text-gray-600">
                            {assumption.type}
                          </span>
                        </div>
                      </div>
                    ))}

                    {columnAssumptions.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Drop assumptions here
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {assumptions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">How to use:</h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• Drag assumptions to different columns to update their validation status</li>
            <li>• <strong>Untested:</strong> New assumptions that haven't been tested yet</li>
            <li>• <strong>Testing:</strong> Currently gathering evidence through interviews</li>
            <li>• <strong>Validated:</strong> Evidence supports the assumption</li>
            <li>• <strong>Invalidated:</strong> Evidence contradicts the assumption - consider pivoting</li>
          </ul>
        </div>
      )}
    </div>
  );
}
