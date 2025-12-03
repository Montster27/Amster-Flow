import { ReportLayout } from '../reports/ReportLayout';
import { ReportSection } from '../reports/ReportSection';
import { MetricGrid } from '../reports/MetricGrid';
import type { Assumption } from '../../types/discovery';

interface DiscoveryReportTemplateProps {
    assumptions: Assumption[];
    interviews: any[]; // Using any[] for now as Interview type isn't strictly needed for the count
    statusCounts: Record<string, number>;
    topRiskAssumptions: Assumption[];
}

export function DiscoveryReportTemplate({
    assumptions,
    interviews,
    statusCounts,
    topRiskAssumptions,
}: DiscoveryReportTemplateProps) {
    return (
        <div id="discovery-report-print" style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
            <ReportLayout
                title="Discovery Report"
                subtitle="Assumptions, risks, and validation progress"
                footerNote="Discovery summary · PivotKit"
            >
                <ReportSection title="Snapshot">
                    <MetricGrid
                        metrics={[
                            { label: 'Total assumptions', value: assumptions.length || 0 },
                            { label: 'Validated', value: statusCounts.validated || 0, tone: 'success' },
                            { label: 'Testing', value: statusCounts.testing || 0, tone: 'warning' },
                            { label: 'Invalidated', value: statusCounts.invalidated || 0, tone: 'danger' },
                            { label: 'Untested', value: statusCounts.untested || 0 },
                            { label: 'Interviews linked', value: interviews.length || 0 },
                        ]}
                    />
                </ReportSection>

                <ReportSection
                    title="Top Risks"
                    description="Highest risk assumptions ranked by risk score"
                >
                    {topRiskAssumptions.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#6b7280' }}>No assumptions yet.</p>
                    ) : (
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                            {topRiskAssumptions.map((assumption, idx) => (
                                <li
                                    key={assumption.id}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 8,
                                        padding: 8,
                                        marginBottom: 8,
                                        background: '#f9fafb',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, color: '#111827' }}>
                                            {idx + 1}. {assumption.canvasArea?.replace(/([A-Z])/g, ' $1').trim() || 'Assumption'}
                                        </span>
                                        <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 700 }}>
                                            Risk {assumption.riskScore ?? 0}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.4 }}>
                                        {assumption.description}
                                    </p>
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
                                        Priority: {assumption.priority} · Status: {assumption.status}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </ReportSection>

                <ReportSection
                    title="Assumptions Appendix"
                    description="Full list with status and priority"
                >
                    {assumptions.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#6b7280' }}>No assumptions yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead>
                                <tr>
                                    {['Description', 'Canvas Area', 'Status', 'Priority', 'Risk'].map((heading) => (
                                        <th
                                            key={heading}
                                            style={{
                                                textAlign: 'left',
                                                borderBottom: '1px solid #e5e7eb',
                                                padding: '6px 4px',
                                                color: '#374151',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {assumptions.map((assumption) => (
                                    <tr key={assumption.id} style={{ pageBreakInside: 'avoid' }}>
                                        <td style={{ padding: '6px 4px', color: '#111827', lineHeight: 1.4 }}>
                                            {assumption.description}
                                        </td>
                                        <td style={{ padding: '6px 4px', color: '#4b5563' }}>
                                            {assumption.canvasArea?.replace(/([A-Z])/g, ' $1').trim() || '-'}
                                        </td>
                                        <td style={{ padding: '6px 4px', color: '#4b5563' }}>{assumption.status}</td>
                                        <td style={{ padding: '6px 4px', color: '#4b5563' }}>{assumption.priority}</td>
                                        <td style={{ padding: '6px 4px', color: '#991b1b' }}>{assumption.riskScore ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </ReportSection>
            </ReportLayout>
        </div>
    );
}
