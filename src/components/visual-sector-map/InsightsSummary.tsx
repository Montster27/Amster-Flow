import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  LayerType,
  LAYER_LABELS,
  LAYER_DESCRIPTIONS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';
import { exportPdfFromElement } from '../../utils/pdfExport';
import { ReportLayout } from '../reports/ReportLayout';
import { ReportSection } from '../reports/ReportSection';
import { MetricGrid } from '../reports/MetricGrid';

interface InsightsSummaryProps {
  onBack: () => void;
}

export const InsightsSummary = ({ onBack }: InsightsSummaryProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const {
    scope,
    actors,
    connections,
    annotations,
    activeLayers,
    toggleLayer,
  } = useVisualSectorMap();

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

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      await exportPdfFromElement('sector-map-report-print', 'sector-map-report.pdf');
    } catch (error) {
      console.error('Error exporting Sector Map PDF', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
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

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Export Options:</h3>
            <div className="space-y-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isExporting ? 'Exporting PDF...' : 'Download PDF'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                PDF includes scope, insights, key stats, and a snapshot-ready layout.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            ← Back to Annotations
          </button>
        </div>
      </div>

      {/* Right Panel - Visual Canvas */}
      <div className="flex-1 overflow-hidden">
        <VisualCanvas
          selectedCategory="customer"
          showConnections={true}
          readOnly={true}
        />
      </div>

      {/* Hidden print-friendly report for PDF export */}
      <div id="sector-map-report-print" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ReportLayout
          title="Sector Map Report"
          subtitle={scope?.question || 'Sector mapping insights'}
          footerNote="Sector map summary · PivotKit"
        >
          <ReportSection title="Snapshot">
            <MetricGrid
              metrics={[
                { label: 'Actors', value: actors.length },
                { label: 'Connections', value: connections.length },
                { label: 'Pain points', value: painPoints.length, tone: 'danger' },
                { label: 'Opportunities', value: opportunities.length, tone: 'success' },
                { label: 'Needs interview', value: needsInterview.length, tone: 'warning' },
              ]}
            />
          </ReportSection>

          <ReportSection title="Top Actors" description="Most connected actors">
            {topActors.length === 0 ? (
              <p style={{ fontSize: 12, color: '#6b7280' }}>No actors yet.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {topActors.map(({ actor, connections: count }) => (
                  <li
                    key={actor.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 8,
                      marginBottom: 8,
                      background: '#f9fafb',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#111827' }}>{actor.name}</strong>
                      <span style={{ fontSize: 12, color: '#4b5563' }}>{count} connections</span>
                    </div>
                    {actor.description && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#374151' }}>
                        {actor.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ReportSection>

          <ReportSection title="Key Insights">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: 8, padding: 8 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#991b1b', fontSize: 12 }}>Pain Points</p>
                {painPoints.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>None captured.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 16, color: '#991b1b', fontSize: 12 }}>
                    {painPoints.slice(0, 5).map((ann) => (
                      <li key={ann.id}>{ann.content}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 8, padding: 8 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#166534', fontSize: 12 }}>Opportunities</p>
                {opportunities.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>None captured.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 16, color: '#166534', fontSize: 12 }}>
                    {opportunities.slice(0, 5).map((ann) => (
                      <li key={ann.id}>{ann.content}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Validation Needs"
            description="Items marked as needing interviews"
          >
            {needsInterview.length === 0 ? (
              <p style={{ fontSize: 12, color: '#6b7280' }}>No pending interviews.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, color: '#92400e', fontSize: 12 }}>
                {needsInterview.slice(0, 10).map((ann) => (
                  <li key={ann.id}>{ann.content}</li>
                ))}
              </ul>
            )}
          </ReportSection>

          <ReportSection
            title="Layers"
            description="Visibility of value/information/regulation layers"
          >
            <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 12 }}>
              {layers.map((layer) => (
                <li key={layer}>
                  {LAYER_LABELS[layer]} — {activeLayers.includes(layer) ? 'On' : 'Off'}
                </li>
              ))}
            </ul>
          </ReportSection>
        </ReportLayout>
      </div>
    </div>
  );
};
