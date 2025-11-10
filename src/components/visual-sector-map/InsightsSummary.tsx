import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  LayerType,
  LAYER_LABELS,
  LAYER_DESCRIPTIONS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';

interface InsightsSummaryProps {
  onBack: () => void;
}

export const InsightsSummary = ({ onBack }: InsightsSummaryProps) => {
  const {
    scope,
    actors,
    connections,
    annotations,
    activeLayers,
    toggleLayer,
    exportData,
  } = useVisualSectorMap();

  const [showMentorComments, setShowMentorComments] = useState(false);

  const layers: LayerType[] = ['value', 'information', 'regulation'];

  // Analytics
  const painPoints = annotations.filter((a) => a.type === 'pain-point');
  const opportunities = annotations.filter((a) => a.type === 'opportunity');
  const needsInterview = annotations.filter((a) => a.status === 'needs-interview');

  // Find most connected actors
  const actorConnectionCounts = actors.map((actor) => ({
    actor,
    connections: connections.filter(
      (c) => c.sourceActorId === actor.id || c.targetActorId === actor.id
    ).length,
  }));
  const topActors = actorConnectionCounts
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 3);

  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sector-map-${scope.sector.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Insights */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Step 5: Insights & Analysis
          </h1>
          <p className="text-sm text-gray-600">
            Review your sector map and identify key insights.
          </p>
        </div>

        {/* Insights Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Scope Reminder */}
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm font-medium text-blue-900 mb-1">Your Question:</p>
            <p className="text-sm text-blue-800">{scope.question}</p>
          </div>

          {/* Layer Controls */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Layer Visibility:</h3>
            <div className="space-y-2">
              {layers.map((layer) => {
                const isActive = activeLayers.includes(layer);
                return (
                  <button
                    key={layer}
                    onClick={() => toggleLayer(layer)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all border-2 ${
                      isActive
                        ? 'bg-indigo-100 border-indigo-400'
                        : 'bg-white border-gray-300 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleLayer(layer)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-800">
                          {LAYER_LABELS[layer]}
                        </p>
                        <p className="text-xs text-gray-600">
                          {LAYER_DESCRIPTIONS[layer]}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analytics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Map Statistics:</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-800">{actors.length}</p>
                <p className="text-xs text-gray-600">Actors</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-800">{connections.length}</p>
                <p className="text-xs text-gray-600">Connections</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-700">{painPoints.length}</p>
                <p className="text-xs text-red-700">Pain Points</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">{opportunities.length}</p>
                <p className="text-xs text-green-700">Opportunities</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Key Insights:</h3>

            {/* Most Connected Actors */}
            {topActors.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-medium text-purple-900 mb-2">
                  🎯 Most Connected Actors:
                </p>
                <ul className="space-y-1 text-xs text-purple-800">
                  {topActors.map(({ actor, connections: count }) => (
                    <li key={actor.id}>
                      • <strong>{actor.name}</strong> ({count} connections)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pain Points Summary */}
            {painPoints.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-medium text-red-900 mb-2">
                  ⚠️ Critical Pain Points:
                </p>
                <ul className="space-y-1 text-xs text-red-800">
                  {painPoints.slice(0, 3).map((ann) => (
                    <li key={ann.id}>• {ann.content}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities Summary */}
            {opportunities.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-medium text-green-900 mb-2">
                  💡 Key Opportunities:
                </p>
                <ul className="space-y-1 text-xs text-green-800">
                  {opportunities.slice(0, 3).map((ann) => (
                    <li key={ann.id}>• {ann.content}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {needsInterview.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-medium text-yellow-900 mb-2">
                  📋 Needs Validation ({needsInterview.length}):
                </p>
                <p className="text-xs text-yellow-800">
                  You have {needsInterview.length} item{needsInterview.length !== 1 ? 's' : ''}{' '}
                  that need interview validation.
                </p>
              </div>
            )}
          </div>

          {/* Mentor Comments Toggle */}
          <div>
            <button
              onClick={() => setShowMentorComments(!showMentorComments)}
              className="w-full px-4 py-3 rounded-lg font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              {showMentorComments ? '👁️ Hide' : '💬'} Mentor Comments
            </button>

            {showMentorComments && (
              <div className="mt-3 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded">
                <p className="text-xs text-indigo-900 font-medium mb-2">Mentor Feedback:</p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Great progress! Your map shows {actors.length} key actors and{' '}
                  {connections.length} relationships. Consider exploring:
                  <br />
                  <br />
                  • Which actors have the most influence on your target customer?
                  <br />
                  • What blockers prevent value from flowing smoothly?
                  <br />
                  • Where are the biggest opportunities for innovation?
                  <br />
                  <br />
                  Next: Validate your {needsInterview.length > 0 ? needsInterview.length : 0}{' '}
                  hypotheses through customer interviews.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <button
            onClick={handleExportJSON}
            className="w-full px-4 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            📥 Export as JSON
          </button>
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            ← Back to Annotations
          </button>
        </div>
      </div>

      {/* Right Panel - Visual Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <VisualCanvas
          selectedCategory="customer"
          showConnections={true}
          readOnly={true}
        />

        {/* Floating Export Button */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Export Options:</p>
          <div className="space-y-2">
            <button
              onClick={handleExportJSON}
              className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all"
            >
              📄 Export JSON
            </button>
            <button
              className="w-full px-3 py-2 bg-gray-200 border-2 border-gray-300 rounded-lg text-xs font-medium cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              🖼️ Export Image (Soon)
            </button>
            <button
              className="w-full px-3 py-2 bg-gray-200 border-2 border-gray-300 rounded-lg text-xs font-medium cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              📑 Export PDF (Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
