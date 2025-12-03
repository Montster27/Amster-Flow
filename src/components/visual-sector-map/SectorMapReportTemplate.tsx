import { ReportLayout } from '../reports/ReportLayout';
import { ReportSection } from '../reports/ReportSection';
import { MetricGrid } from '../reports/MetricGrid';
import {
    LayerType,
    LAYER_LABELS,
} from '../../types/visualSectorMap';

interface SectorMapReportTemplateProps {
    scope: any; // Using any for now as Scope type isn't strictly needed for display
    actors: any[];
    connections: any[];
    painPoints: any[];
    opportunities: any[];
    needsInterview: any[];
    activeLayers: LayerType[];
    topActors: { actor: any; connections: number }[];
}

export function SectorMapReportTemplate({
    scope,
    actors,
    connections,
    painPoints,
    opportunities,
    needsInterview,
    activeLayers,
    topActors,
}: SectorMapReportTemplateProps) {
    return (
        <div id="sector-map-report-print" style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
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
                        {activeLayers.map((layer) => (
                            <li key={layer}>
                                {LAYER_LABELS[layer]} — {activeLayers.includes(layer) ? 'On' : 'Off'}
                            </li>
                        ))}
                    </ul>
                </ReportSection>
            </ReportLayout>
        </div>
    );
}
