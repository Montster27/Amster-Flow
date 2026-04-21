import { useMemo } from 'react';
import type { Assumption, EnhancedInterview } from '../../types/discovery';
import { getContent } from '../../lib/pivotKitContent';
import { MentorVoice } from '../ui/MentorVoice';

interface DiscoveryDashboardProps {
  assumptions: Assumption[];
  interviews: EnhancedInterview[];
}

function MetricCard({
  kicker,
  value,
  trend,
}: {
  kicker: string;
  value: string | number;
  trend?: string;
}) {
  return (
    <div className="pk-surface-card" style={{ padding: 16 }}>
      <div className="pk-kicker" style={{ marginBottom: 8 }}>
        {kicker}
      </div>
      <div
        className="pk-mono"
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: 'var(--fg-1)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 6 }}>{trend}</div>
      )}
    </div>
  );
}

function StatusRow({
  status,
  label,
  count,
  total,
}: {
  status: 'untested' | 'testing' | 'validated' | 'invalidated';
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const barColor =
    status === 'validated'
      ? 'var(--success-600)'
      : status === 'testing'
      ? 'var(--warm)'
      : status === 'invalidated'
      ? 'var(--danger-600)'
      : 'var(--slate-400)';
  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 6, fontSize: 13 }}
      >
        <div className="flex items-center gap-2">
          <span className={`pk-dot ${status}`} />
          <span style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{label}</span>
        </div>
        <span className="pk-mono" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>
          {count}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: 'var(--slate-100)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

export function DiscoveryDashboard({ assumptions, interviews }: DiscoveryDashboardProps) {
  const metrics = useMemo(() => {
    const totalAssumptions = assumptions.length;
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter((i) => i.status === 'completed').length;

    const untested = assumptions.filter((a) => a.status === 'untested').length;
    const testing = assumptions.filter((a) => a.status === 'testing').length;
    const validated = assumptions.filter((a) => a.status === 'validated').length;
    const invalidated = assumptions.filter((a) => a.status === 'invalidated').length;

    const highPriority = assumptions.filter((a) => a.priority === 'high').length;

    const testedAssumptions = assumptions.filter((a) => (a.interviewCount || 0) > 0).length;
    const coverageRate =
      totalAssumptions > 0 ? (testedAssumptions / totalAssumptions) * 100 : 0;

    const avgConfidence =
      totalAssumptions > 0
        ? assumptions.reduce((sum, a) => sum + a.confidence, 0) / totalAssumptions
        : 0;

    const highRisk = assumptions.filter((a) => (a.riskScore || 0) >= 15).length;
    const mediumRisk = assumptions.filter(
      (a) => (a.riskScore || 0) >= 8 && (a.riskScore || 0) < 15
    ).length;
    const lowRisk = assumptions.filter((a) => (a.riskScore || 0) < 8).length;

    const validationRate =
      totalAssumptions > 0 ? ((validated + invalidated) / totalAssumptions) * 100 : 0;

    const highRiskUntested = assumptions
      .filter((a) => a.status === 'untested')
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 5);

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
      coverageRate,
      avgConfidence,
      highRisk,
      mediumRisk,
      lowRisk,
      validationRate,
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
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="pk-kicker" style={{ marginBottom: 4 }}>
          Discovery
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--fg-1)',
            margin: '0 0 4px',
            letterSpacing: '-0.01em',
          }}
        >
          Dashboard
        </h2>
        <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: 0 }}>
          Overview of your discovery progress, insights, and next steps.
        </p>
      </div>

      {/* Metric strip */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 12, marginBottom: 24 }}
      >
        <MetricCard
          kicker="Assumptions"
          value={metrics.totalAssumptions}
          trend={`${metrics.highPriority} high priority`}
        />
        <MetricCard
          kicker="Interviews"
          value={metrics.totalInterviews}
          trend={`${metrics.completedInterviews} completed`}
        />
        <MetricCard
          kicker="Validation rate"
          value={`${metrics.validationRate.toFixed(0)}%`}
          trend={`${metrics.validated} validated · ${metrics.invalidated} invalidated`}
        />
        <MetricCard
          kicker="Coverage"
          value={`${metrics.coverageRate.toFixed(0)}%`}
          trend={`Avg confidence ${metrics.avgConfidence.toFixed(1)}/5`}
        />
      </div>

      {/* Status + Risk */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ gap: 16, marginBottom: 24 }}
      >
        <div className="pk-surface-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--fg-1)',
                margin: 0,
                letterSpacing: '-0.005em',
              }}
            >
              Assumption status
            </h3>
            <span className="pk-kicker">{metrics.totalAssumptions} total</span>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <StatusRow
              status="untested"
              label="Untested"
              count={metrics.untested}
              total={metrics.totalAssumptions}
            />
            <StatusRow
              status="testing"
              label="Testing"
              count={metrics.testing}
              total={metrics.totalAssumptions}
            />
            <StatusRow
              status="validated"
              label="Validated"
              count={metrics.validated}
              total={metrics.totalAssumptions}
            />
            <StatusRow
              status="invalidated"
              label="Invalidated"
              count={metrics.invalidated}
              total={metrics.totalAssumptions}
            />
          </div>
        </div>

        <div className="pk-surface-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--fg-1)',
                margin: 0,
                letterSpacing: '-0.005em',
              }}
            >
              Risk distribution
            </h3>
            <span className="pk-kicker">Risk = confidence × importance</span>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 6, fontSize: 13 }}
              >
                <div className="flex items-center gap-2">
                  <span className="pk-pill rose">High · 15+</span>
                </div>
                <span className="pk-mono" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>
                  {metrics.highRisk}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--slate-100)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${
                      metrics.totalAssumptions > 0
                        ? (metrics.highRisk / metrics.totalAssumptions) * 100
                        : 0
                    }%`,
                    background: 'var(--danger-600)',
                  }}
                />
              </div>
            </div>
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 6, fontSize: 13 }}
              >
                <span className="pk-pill amber">Medium · 8–14</span>
                <span className="pk-mono" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>
                  {metrics.mediumRisk}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--slate-100)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${
                      metrics.totalAssumptions > 0
                        ? (metrics.mediumRisk / metrics.totalAssumptions) * 100
                        : 0
                    }%`,
                    background: 'var(--warm)',
                  }}
                />
              </div>
            </div>
            <div>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 6, fontSize: 13 }}
              >
                <span className="pk-pill emerald">Low · &lt;8</span>
                <span className="pk-mono" style={{ color: 'var(--fg-1)', fontWeight: 600 }}>
                  {metrics.lowRisk}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--slate-100)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${
                      metrics.totalAssumptions > 0
                        ? (metrics.lowRisk / metrics.totalAssumptions) * 100
                        : 0
                    }%`,
                    background: 'var(--success-600)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-risk untested + Recent interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
        <div className="pk-surface-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--fg-1)',
                margin: 0,
              }}
            >
              High-risk untested
            </h3>
            {metrics.highRiskUntested.length > 0 && (
              <span className="pk-pill rose">Action required</span>
            )}
          </div>
          {metrics.highRiskUntested.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--fg-4)',
                textAlign: 'center',
                padding: '20px 0',
                margin: 0,
              }}
            >
              All high-risk assumptions have been tested.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {metrics.highRiskUntested.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: 12,
                    border: '1px solid var(--border-1)',
                    borderRadius: 10,
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div
                    className="flex items-center gap-2"
                    style={{ marginBottom: 6 }}
                  >
                    <span
                      className="pk-pill rose pk-mono"
                      style={{ fontSize: 11 }}
                    >
                      {a.riskScore}
                    </span>
                    <span className="pk-kicker">{getCanvasAreaLabel(a.canvasArea)}</span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--fg-2)',
                      margin: 0,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pk-surface-card">
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--fg-1)',
              margin: '0 0 16px',
            }}
          >
            Recent interviews
          </h3>
          {metrics.recentInterviews.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--fg-4)',
                textAlign: 'center',
                padding: '20px 0',
                margin: 0,
              }}
            >
              No interviews yet. Start conducting interviews.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {metrics.recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  style={{
                    padding: 12,
                    border: '1px solid var(--border-1)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 4 }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}
                    >
                      {interview.segmentName}
                    </span>
                    <span
                      className={`pk-pill ${
                        interview.status === 'completed' ? 'emerald' : 'amber'
                      }`}
                    >
                      {interview.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                    {formatDate(interview.date)} · {interview.assumptionTags.length} assumptions tested
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(metrics.highRiskUntested.length > 0 ||
        metrics.untested > 0 ||
        metrics.totalInterviews < 5) && (
        <div
          className="pk-surface-card"
          style={{
            marginTop: 16,
            background: 'var(--sky-50)',
            borderColor: 'var(--sky-200)',
          }}
        >
          <div className="pk-kicker" style={{ color: 'var(--sky-700)', marginBottom: 8 }}>
            Recommended next steps
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
            {metrics.highRiskUntested.length > 0 && (
              <li
                style={{
                  fontSize: 13,
                  color: 'var(--fg-2)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--sky-600)', fontWeight: 600 }}>→</span>
                <span>
                  <strong>Priority:</strong> Test {metrics.highRiskUntested.length} high-risk
                  untested assumption{metrics.highRiskUntested.length > 1 ? 's' : ''} through customer
                  interviews.
                </span>
              </li>
            )}
            {metrics.totalInterviews < 5 && (
              <li
                style={{
                  fontSize: 13,
                  color: 'var(--fg-2)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--sky-600)', fontWeight: 600 }}>→</span>
                <span>
                  Conduct {5 - metrics.totalInterviews} more interview
                  {5 - metrics.totalInterviews > 1 ? 's' : ''} to reach the minimum validation
                  threshold.
                </span>
              </li>
            )}
            {metrics.invalidated > 0 && (
              <li
                style={{
                  fontSize: 13,
                  color: 'var(--fg-2)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--sky-600)', fontWeight: 600 }}>→</span>
                <span>
                  Review {metrics.invalidated} invalidated assumption
                  {metrics.invalidated > 1 ? 's' : ''} and consider pivoting your approach.
                </span>
              </li>
            )}
            {metrics.coverageRate < 80 && metrics.totalAssumptions > 0 && (
              <li
                style={{
                  fontSize: 13,
                  color: 'var(--fg-2)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--sky-600)', fontWeight: 600 }}>→</span>
                <span>
                  Increase interview coverage to 80%+ (currently{' '}
                  {metrics.coverageRate.toFixed(0)}%) by testing more assumptions.
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {(() => {
        const uvpAssumptions = assumptions.filter(
          (a) =>
            a.canvasArea === 'uniqueValueProposition' || a.canvasArea === 'solution'
        );
        const resistanceSignals: { assumption: Assumption; contradictions: number }[] = [];

        uvpAssumptions.forEach((assumption) => {
          const linkedInterviews = interviews.filter((interview) =>
            interview.assumptionTags.some(
              (tag) =>
                tag.assumptionId === assumption.id &&
                tag.validationEffect === 'contradicts'
            )
          );
          if (linkedInterviews.length >= 3 && assumption.confidence >= 3) {
            resistanceSignals.push({
              assumption,
              contradictions: linkedInterviews.length,
            });
          }
        });

        const redAssumptions = assumptions.filter(
          (a) =>
            a.status === 'invalidated' ||
            ((a.interviewCount || 0) >= 3 && a.confidence <= 2)
        );

        if (resistanceSignals.length === 0 && redAssumptions.length < 2) return null;

        return (
          <div
            className="pk-surface-card"
            style={{
              marginTop: 16,
              background: 'var(--danger-50)',
              borderColor: 'var(--danger-300)',
            }}
          >
            <div
              className="pk-kicker"
              style={{ color: 'var(--danger-700)', marginBottom: 10 }}
            >
              Pivot resistance check
            </div>
            {resistanceSignals.length > 0 && (
              <MentorVoice
                text={getContent('assumption_pivot_resistance')}
                type="mentor_voice_flag"
                className="mb-3"
              />
            )}
            {redAssumptions.length >= 2 && (
              <MentorVoice
                text={getContent('assumption_confidence_never_drops')}
                type="mentor_voice_flag"
              />
            )}
          </div>
        );
      })()}

      {metrics.totalInterviews >= 5 && metrics.totalAssumptions > 0 && (
        <div
          className="pk-surface-card"
          style={{
            marginTop: 16,
            background: '#f5f3ff',
            borderColor: '#ddd6fe',
          }}
        >
          <div className="pk-kicker" style={{ color: '#6d28d9', marginBottom: 6 }}>
            Ready to decide?
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--fg-1)',
              margin: '0 0 8px',
            }}
          >
            Bring your learning together
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'var(--fg-2)',
              margin: '0 0 8px',
              lineHeight: 1.55,
            }}
          >
            You've done {metrics.totalInterviews} interviews and tested{' '}
            {metrics.totalAssumptions} assumptions. Next, decide whether to{' '}
            <strong>proceed</strong>, <strong>patch</strong> a specific weakness, or{' '}
            <strong>pivot</strong> to follow what your customers are telling you.
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--fg-4)',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            Navigate to the Decide module from the sidebar when you're ready.
          </p>
        </div>
      )}
    </div>
  );
}
