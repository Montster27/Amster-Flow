import { useDiscovery } from '../../contexts/DiscoveryContext';
import { BENCHMARKS } from '../../types/pivot';
import type { ProgressSummary as ProgressSummaryType } from '../../types/pivot';

interface ProgressSummaryProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Progress Summary Component
 *
 * Purpose: Show auto-generated metrics from Discovery module with benchmark context
 * Helps students understand where they stand relative to research-backed thresholds
 *
 * Data pulled from: useDiscovery context (assumptions, interviews)
 */
export function ProgressSummary({ onContinue, onBack }: ProgressSummaryProps) {
  const { assumptions, interviews } = useDiscovery();

  // Calculate progress metrics
  const interviewsCount = interviews?.filter(i => i.status === 'completed').length || 0;
  const assumptionsTotal = assumptions?.length || 0;
  const assumptionsValidated = assumptions?.filter(a => a.status === 'validated').length || 0;
  const assumptionsInvalidated = assumptions?.filter(a => a.status === 'invalidated').length || 0;
  const validationRate = assumptionsTotal > 0
    ? Math.round(((assumptionsValidated + assumptionsInvalidated) / assumptionsTotal) * 100)
    : 0;

  // Calculate PMF score if available (placeholder - would need actual survey data)
  const pmfScore: number | undefined = undefined; // TODO: Calculate from actual PMF survey

  const summary: ProgressSummaryType = {
    interviewsCount,
    interviewsBenchmark: BENCHMARKS.INTERVIEWS_TARGET,
    assumptionsTotal,
    assumptionsValidated,
    assumptionsInvalidated,
    validationRate,
    pmfScore,
    pmfBenchmark: BENCHMARKS.PMF_PROCEED_THRESHOLD,
  };

  const getStatusIcon = (value: number, threshold: number, higher

IsBetter: boolean = true) => {
    const meetsThreshold = higherIsBetter ? value >= threshold : value <= threshold;
    if (meetsThreshold) return '✅';
    if (higherIsBetter && value >= threshold * 0.7) return '🔶';
    return '⚠️';
  };

  const getStatusColor = (value: number, threshold: number, higherIsBetter: boolean = true) => {
    const meetsThreshold = higherIsBetter ? value >= threshold : value <= threshold;
    if (meetsThreshold) return 'bg-green-50 border-green-200 text-green-800';
    if (higherIsBetter && value >= threshold * 0.7) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Your Progress Summary
        </h1>
        <p className="text-gray-600">
          Here's what you've accomplished so far, compared to research-backed benchmarks
          for successful ventures.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-6 mb-8">
        {/* Interviews Conducted */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(interviewsCount, summary.interviewsBenchmark)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getStatusIcon(interviewsCount, summary.interviewsBenchmark)}</span>
                <h3 className="text-lg font-semibold">Interviews Conducted</h3>
              </div>
              <div className="mb-3">
                <p className="text-4xl font-bold">{summary.interviewsCount}</p>
                <p className="text-sm mt-1">
                  Benchmark: {summary.interviewsBenchmark}+ correlates with success
                </p>
              </div>
              {interviewsCount < summary.interviewsBenchmark && (
                <p className="text-sm font-medium">
                  ⚠️ Consider conducting {summary.interviewsBenchmark - interviewsCount} more interviews
                </p>
              )}
              {interviewsCount >= summary.interviewsBenchmark && (
                <p className="text-sm font-medium">
                  ✅ Great! You've met the benchmark for interview volume
                </p>
              )}
            </div>
          </div>
        </div>

        {/* PMF Score (if available) */}
        {summary.pmfScore !== undefined && (
          <div className={`p-6 rounded-lg border-2 ${
            summary.pmfScore >= BENCHMARKS.PMF_PROCEED_THRESHOLD
              ? 'bg-green-50 border-green-200 text-green-800'
              : summary.pmfScore >= BENCHMARKS.PMF_PATCH_MIN
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {summary.pmfScore >= BENCHMARKS.PMF_PROCEED_THRESHOLD ? '✅' :
                     summary.pmfScore >= BENCHMARKS.PMF_PATCH_MIN ? '🔶' : '⚠️'}
                  </span>
                  <h3 className="text-lg font-semibold">Product-Market Fit Score</h3>
                </div>
                <div className="mb-3">
                  <p className="text-4xl font-bold">{summary.pmfScore}%</p>
                  <p className="text-sm mt-1">
                    Benchmark: {summary.pmfBenchmark}% indicates product-market fit
                  </p>
                </div>
                {summary.pmfScore >= BENCHMARKS.PMF_PROCEED_THRESHOLD && (
                  <p className="text-sm font-medium">
                    ✅ Strong PMF signal - ready to proceed with scaling
                  </p>
                )}
                {summary.pmfScore >= BENCHMARKS.PMF_PATCH_MIN && summary.pmfScore < BENCHMARKS.PMF_PROCEED_THRESHOLD && (
                  <p className="text-sm font-medium">
                    🔶 In "patch" zone ({BENCHMARKS.PMF_PATCH_MIN}-{BENCHMARKS.PMF_PATCH_MAX}%) - targeted improvements may help
                  </p>
                )}
                {summary.pmfScore < BENCHMARKS.PMF_PATCH_MIN && (
                  <p className="text-sm font-medium">
                    ⚠️ Below patch threshold - consider pivot or major strategic changes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Validation Rate */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(validationRate, BENCHMARKS.VALIDATION_RATE_MIN)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getStatusIcon(validationRate, BENCHMARKS.VALIDATION_RATE_MIN)}</span>
                <h3 className="text-lg font-semibold">Assumption Validation Rate</h3>
              </div>
              <div className="mb-3">
                <p className="text-4xl font-bold">{validationRate}%</p>
                <p className="text-sm mt-1">
                  {assumptionsValidated + assumptionsInvalidated} of {assumptionsTotal} assumptions tested
                </p>
                <p className="text-sm">
                  Benchmark: &gt;{BENCHMARKS.VALIDATION_RATE_MIN}% suggests strong validation process
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-white bg-opacity-50 rounded p-3">
                  <p className="text-sm text-gray-600">Validated</p>
                  <p className="text-2xl font-bold">{assumptionsValidated}</p>
                </div>
                <div className="bg-white bg-opacity-50 rounded p-3">
                  <p className="text-sm text-gray-600">Invalidated</p>
                  <p className="text-2xl font-bold">{assumptionsInvalidated}</p>
                </div>
              </div>
              {validationRate < BENCHMARKS.VALIDATION_RATE_MIN && (
                <p className="text-sm font-medium mt-3">
                  ⚠️ Low validation rate (&lt;{BENCHMARKS.VALIDATION_RATE_MIN}%) suggests more testing needed
                </p>
              )}
              {validationRate >= BENCHMARKS.VALIDATION_RATE_MIN && (
                <p className="text-sm font-medium mt-3">
                  ✅ Strong validation process - you're testing your assumptions rigorously
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insight Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded mb-8">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📊 What these metrics mean:
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          These benchmarks come from research on 100+ successful and failed startups.
          They provide context, not absolute rules - your specific situation may differ.
        </p>
        <p className="text-sm text-blue-800">
          <strong>Key insight:</strong> If multiple metrics are below threshold, consider
          whether you need more validation work before making a major decision.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Pre-Mortem
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Continue to Reflection →
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Benchmarks based on First Round Capital analysis of 100+ startups • Sean Ellis PMF methodology
        </p>
      </div>
    </div>
  );
}
