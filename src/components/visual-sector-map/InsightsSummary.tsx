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
import {
  TEAL, TEAL_LITE, TEAL_SOFT, INK, SLATE_FG, MUTED, TAN, STONE, HAIR, PAPER,
  AMBER_FG, AMBER_SOFT, AMBER_LINE, ERROR_FG,
} from '../../features/v3/lib/tokens';

const ERROR_SOFT = 'rgba(190,18,60,0.08)';
const ERROR_LINE = 'rgba(190,18,60,0.3)';

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
    <div className="h-screen flex" style={{ background: PAPER }}>
      {/* Left Panel - Insights */}
      <div className="w-96 bg-white border-r flex flex-col" style={{ borderColor: TAN }}>
        {/* Header */}
        <div className="px-6 py-6 border-b" style={{ borderColor: TAN }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: INK }}>
            Step 5: Insights & Analysis
          </h1>
          <p className="text-sm" style={{ color: SLATE_FG }}>
            Review your sector map and identify key insights.
          </p>
        </div>

        {/* Insights Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Scope Reminder */}
          <div className="p-4 rounded" style={{ background: TEAL_SOFT, borderLeft: `4px solid ${TEAL}` }}>
            <p className="text-sm font-medium mb-1" style={{ color: INK }}>Your Question:</p>
            <p className="text-sm" style={{ color: SLATE_FG }}>{scope.question}</p>
          </div>

          {/* Layer Controls */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: INK }}>Layer Visibility:</h3>
            <div className="space-y-2">
              {layers.map((layer) => {
                const isActive = activeLayers.includes(layer);
                return (
                  <button
                    key={layer}
                    onClick={() => toggleLayer(layer)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all border-2 ${
                      isActive ? '' : 'bg-white opacity-50'
                    }`}
                    style={isActive
                      ? { background: TEAL_LITE, borderColor: TEAL }
                      : { borderColor: STONE }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleLayer(layer)}
                        className="h-4 w-4"
                        style={{ accentColor: TEAL }}
                      />
                      <div>
                        <p className="font-medium text-sm" style={{ color: INK }}>
                          {LAYER_LABELS[layer]}
                        </p>
                        <p className="text-xs" style={{ color: SLATE_FG }}>
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
            <h3 className="text-sm font-semibold" style={{ color: INK }}>Map Statistics:</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border" style={{ background: HAIR, borderColor: TAN }}>
                <p className="text-2xl font-bold" style={{ color: INK }}>{actors.length}</p>
                <p className="text-xs" style={{ color: SLATE_FG }}>Actors</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ background: HAIR, borderColor: TAN }}>
                <p className="text-2xl font-bold" style={{ color: INK }}>{connections.length}</p>
                <p className="text-xs" style={{ color: SLATE_FG }}>Connections</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ background: ERROR_SOFT, borderColor: ERROR_LINE }}>
                <p className="text-2xl font-bold" style={{ color: ERROR_FG }}>{painPoints.length}</p>
                <p className="text-xs" style={{ color: ERROR_FG }}>Pain Points</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ background: TEAL_LITE, borderColor: TEAL }}>
                <p className="text-2xl font-bold" style={{ color: TEAL }}>{opportunities.length}</p>
                <p className="text-xs" style={{ color: TEAL }}>Opportunities</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: INK }}>Key Insights:</h3>

            {/* Most Connected Actors */}
            {topActors.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: TEAL_SOFT, borderColor: TEAL }}>
                <p className="text-xs font-medium mb-2" style={{ color: INK }}>
                  🎯 Most Connected Actors:
                </p>
                <ul className="space-y-1 text-xs" style={{ color: SLATE_FG }}>
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
              <div className="p-3 rounded-lg border" style={{ background: ERROR_SOFT, borderColor: ERROR_LINE }}>
                <p className="text-xs font-medium mb-2" style={{ color: ERROR_FG }}>
                  ⚠️ Critical Pain Points:
                </p>
                <ul className="space-y-1 text-xs" style={{ color: ERROR_FG }}>
                  {painPoints.slice(0, 3).map((ann) => (
                    <li key={ann.id}>• {ann.content}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities Summary */}
            {opportunities.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: TEAL_LITE, borderColor: TEAL }}>
                <p className="text-xs font-medium mb-2" style={{ color: TEAL }}>
                  💡 Key Opportunities:
                </p>
                <ul className="space-y-1 text-xs" style={{ color: TEAL }}>
                  {opportunities.slice(0, 3).map((ann) => (
                    <li key={ann.id}>• {ann.content}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {needsInterview.length > 0 && (
              <div className="p-3 rounded-lg border" style={{ background: AMBER_SOFT, borderColor: AMBER_LINE }}>
                <p className="text-xs font-medium mb-2" style={{ color: AMBER_FG }}>
                  📋 Needs Validation ({needsInterview.length}):
                </p>
                <p className="text-xs" style={{ color: AMBER_FG }}>
                  You have {needsInterview.length} item{needsInterview.length !== 1 ? 's' : ''}{' '}
                  that need interview validation.
                </p>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: INK }}>Export Options:</h3>
            <div className="space-y-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="w-full px-4 py-3 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                style={{ background: TEAL }}
                onMouseEnter={(e) => { if (!isExporting) e.currentTarget.style.background = '#0d5c56'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = TEAL; }}
              >
                {isExporting ? 'Exporting PDF...' : 'Download PDF'}
              </button>
              <p className="text-xs text-center" style={{ color: MUTED }}>
                PDF includes scope, insights, key stats, and a snapshot-ready layout.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: TAN }}>
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium bg-white border-2 transition-all"
            style={{ color: SLATE_FG, borderColor: STONE }}
            onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
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
