import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import type { ConfidenceAssessment as ConfidenceAssessmentType } from '../../types/pivot';

interface ConfidenceAssessmentProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Confidence Assessment Component (Easy Mode)
 *
 * Purpose: Multi-dimensional confidence assessment to avoid false precision
 * Breaks down overall confidence into 5 key dimensions:
 * - Market: Customer demand and market size validation
 * - Product: Solution quality and product-market fit
 * - Team: Capabilities and execution ability
 * - Resources: Runway, funding, and resource adequacy
 * - Timing: Market timing and competitive positioning
 *
 * Research: Prevents anchoring on single confidence metric
 */
export function ConfidenceAssessment({ onContinue, onBack }: ConfidenceAssessmentProps) {
  const { currentDecision, updateConfidenceAssessment } = usePivot();

  const [marketConfidence, setMarketConfidence] = useState(50);
  const [productConfidence, setProductConfidence] = useState(50);
  const [teamConfidence, setTeamConfidence] = useState(50);
  const [resourceConfidence, setResourceConfidence] = useState(50);
  const [timingConfidence, setTimingConfidence] = useState(50);

  // Load existing assessment if available
  useEffect(() => {
    if (currentDecision?.confidenceAssessment) {
      const assessment = currentDecision.confidenceAssessment;
      setMarketConfidence(assessment.marketConfidence ?? 50);
      setProductConfidence(assessment.productConfidence ?? 50);
      setTeamConfidence(assessment.teamConfidence ?? 50);
      setResourceConfidence(assessment.resourceConfidence ?? 50);
      setTimingConfidence(assessment.timingConfidence ?? 50);
    }
  }, [currentDecision]);

  // Calculate overall confidence (weighted average)
  const overallConfidence = Math.round(
    (marketConfidence * 0.3 +
      productConfidence * 0.25 +
      teamConfidence * 0.2 +
      resourceConfidence * 0.15 +
      timingConfidence * 0.1)
  );

  const handleContinue = () => {
    const assessment: ConfidenceAssessmentType = {
      marketConfidence,
      productConfidence,
      teamConfidence,
      resourceConfidence,
      timingConfidence,
      overallConfidence,
    };
    updateConfidenceAssessment(assessment);
    onContinue();
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (value: number) => {
    if (value >= 80) return 'Very High';
    if (value >= 60) return 'High';
    if (value >= 40) return 'Medium';
    if (value >= 20) return 'Low';
    return 'Very Low';
  };

  const getSliderBackground = (value: number) => {
    const percent = value;
    if (value >= 70) return `linear-gradient(to right, #10b981 0%, #10b981 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
    if (value >= 40) return `linear-gradient(to right, #f59e0b 0%, #f59e0b ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
    return `linear-gradient(to right, #ef4444 0%, #ef4444 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Confidence Assessment
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why break this down?</strong> Research shows that asking for confidence across
            multiple dimensions leads to more accurate self-assessment than a single overall rating.
          </p>
          <p className="text-sm text-blue-800">
            Be honest about each area. Low confidence in one dimension doesn't mean failure—it helps
            you identify exactly what needs attention.
          </p>
        </div>
      </div>

      {/* Overall Confidence Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-1">Overall Confidence</h2>
            <p className="text-xs text-gray-500">Weighted average across all dimensions</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold ${getConfidenceColor(overallConfidence)}`}>
              {overallConfidence}%
            </p>
            <p className={`text-sm font-medium ${getConfidenceColor(overallConfidence)}`}>
              {getConfidenceLabel(overallConfidence)}
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Dimensions */}
      <div className="space-y-6 mb-8">
        {/* Market Confidence - 30% weight */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Market Confidence</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Customer demand validation, market size, willingness to pay
                </p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-3xl font-bold ${getConfidenceColor(marketConfidence)}`}>
                  {marketConfidence}%
                </p>
                <p className="text-xs text-gray-500 font-medium">30% weight</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={marketConfidence}
              onChange={(e) => setMarketConfidence(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{ background: getSliderBackground(marketConfidence) }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>No validation</span>
              <span>Strong evidence</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-700">
              <strong>Consider:</strong> Interview results, survey data, LOIs, pilot conversions, PMF score
            </p>
          </div>
        </div>

        {/* Product Confidence - 25% weight */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Product Confidence</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Solution quality, feature completeness, technical feasibility
                </p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-3xl font-bold ${getConfidenceColor(productConfidence)}`}>
                  {productConfidence}%
                </p>
                <p className="text-xs text-gray-500 font-medium">25% weight</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={productConfidence}
              onChange={(e) => setProductConfidence(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{ background: getSliderBackground(productConfidence) }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Concept only</span>
              <span>Proven solution</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-700">
              <strong>Consider:</strong> Product usage data, NPS, customer satisfaction, retention metrics
            </p>
          </div>
        </div>

        {/* Team Confidence - 20% weight */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Team Confidence</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Capabilities, domain expertise, execution velocity
                </p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-3xl font-bold ${getConfidenceColor(teamConfidence)}`}>
                  {teamConfidence}%
                </p>
                <p className="text-xs text-gray-500 font-medium">20% weight</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={teamConfidence}
              onChange={(e) => setTeamConfidence(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{ background: getSliderBackground(teamConfidence) }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Major gaps</span>
              <span>Exceptional fit</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-700">
              <strong>Consider:</strong> Technical skills, industry experience, complementary strengths, past execution
            </p>
          </div>
        </div>

        {/* Resource Confidence - 15% weight */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Resource Confidence</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Runway, funding access, unit economics sustainability
                </p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-3xl font-bold ${getConfidenceColor(resourceConfidence)}`}>
                  {resourceConfidence}%
                </p>
                <p className="text-xs text-gray-500 font-medium">15% weight</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={resourceConfidence}
              onChange={(e) => setResourceConfidence(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{ background: getSliderBackground(resourceConfidence) }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Critical shortage</span>
              <span>Well-funded</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-700">
              <strong>Consider:</strong> Months of runway, CAC/LTV ratio, burn rate, funding pipeline
            </p>
          </div>
        </div>

        {/* Timing Confidence - 10% weight */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Timing Confidence</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Market readiness, competitive positioning, external tailwinds
                </p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-3xl font-bold ${getConfidenceColor(timingConfidence)}`}>
                  {timingConfidence}%
                </p>
                <p className="text-xs text-gray-500 font-medium">10% weight</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={timingConfidence}
              onChange={(e) => setTimingConfidence(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{ background: getSliderBackground(timingConfidence) }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Too early/late</span>
              <span>Perfect timing</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-700">
              <strong>Consider:</strong> Market trends, regulatory changes, competitive intensity, customer readiness
            </p>
          </div>
        </div>
      </div>

      {/* Insight Box */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          📊 Interpreting your confidence scores:
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>
              <strong>70-100%:</strong> High confidence - strong evidence supporting this dimension
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold">•</span>
            <span>
              <strong>40-69%:</strong> Medium confidence - some validation but gaps remain
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-bold">•</span>
            <span>
              <strong>0-39%:</strong> Low confidence - significant concerns or lack of validation
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-4">
          <strong>Remember:</strong> Low scores aren't failures—they're clarity about where you need to focus.
          A venture with uneven confidence scores often needs targeted work rather than a complete pivot.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Reflection
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Continue to Decision →
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Multi-dimensional confidence assessment reduces anchoring bias • Prevents false precision in decision-making
        </p>
      </div>
    </div>
  );
}
