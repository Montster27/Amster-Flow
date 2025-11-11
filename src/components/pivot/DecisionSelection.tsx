import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { BENCHMARKS } from '../../types/pivot';
import type { DecisionPath } from '../../types/pivot';

interface DecisionSelectionProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Decision Selection Component (Easy Mode)
 *
 * Purpose: Guide users to choose between Proceed, Patch, or Pivot
 * Shows decision framework with benchmark context and collects rationale
 *
 * Three paths:
 * - Proceed: Strong PMF (40%+), continue with incremental improvements
 * - Patch: Mid-range PMF (25-40%), structural changes needed
 * - Pivot: Low PMF (<25%), strategic shift required
 */
export function DecisionSelection({ onContinue, onBack }: DecisionSelectionProps) {
  const { currentDecision, setDecision, updateDecisionRationale, updateNextActions } = usePivot();
  const { interviews, assumptions } = useDiscovery();

  const [selectedDecision, setSelectedDecision] = useState<DecisionPath | null>(null);
  const [rationale, setRationale] = useState('');
  const [action1, setAction1] = useState('');
  const [action2, setAction2] = useState('');
  const [action3, setAction3] = useState('');

  // Calculate current metrics for guidance
  const interviewsCount = interviews?.filter(i => i.status === 'completed').length || 0;
  const assumptionsTotal = assumptions?.length || 0;
  const assumptionsValidated = assumptions?.filter(a => a.status === 'validated').length || 0;
  const validationRate = assumptionsTotal > 0
    ? Math.round(((assumptionsValidated) / assumptionsTotal) * 100)
    : 0;

  // Load existing decision if available
  useEffect(() => {
    if (currentDecision?.decision) {
      setSelectedDecision(currentDecision.decision);
    }
    if (currentDecision?.decisionRationale) {
      setRationale(currentDecision.decisionRationale);
    }
    if (currentDecision?.nextActions) {
      setAction1(currentDecision.nextActions[0] || '');
      setAction2(currentDecision.nextActions[1] || '');
      setAction3(currentDecision.nextActions[2] || '');
    }
  }, [currentDecision]);

  const handleContinue = () => {
    if (!selectedDecision) return;

    setDecision(selectedDecision);
    updateDecisionRationale(rationale);
    const actions = [action1, action2, action3].filter(a => a.trim());
    updateNextActions(actions);
    onContinue();
  };

  const canContinue = selectedDecision && rationale.trim() && action1.trim() && action2.trim() && action3.trim();

  const getDecisionCardClass = (decision: DecisionPath) => {
    const isSelected = selectedDecision === decision;
    const baseClass = "relative p-6 rounded-lg border-3 cursor-pointer transition-all duration-200";

    if (decision === 'proceed') {
      return `${baseClass} ${isSelected
        ? 'border-green-500 bg-green-50 shadow-lg ring-4 ring-green-200'
        : 'border-green-300 bg-white hover:border-green-400 hover:shadow-md'}`;
    }
    if (decision === 'patch') {
      return `${baseClass} ${isSelected
        ? 'border-yellow-500 bg-yellow-50 shadow-lg ring-4 ring-yellow-200'
        : 'border-yellow-300 bg-white hover:border-yellow-400 hover:shadow-md'}`;
    }
    return `${baseClass} ${isSelected
      ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-200'
      : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md'}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Make Your Decision
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Three paths, not two:</strong> Research shows that binary (pivot/persevere)
            decisions miss the middle ground where most ventures actually exist.
          </p>
          <p className="text-sm text-blue-800">
            Based on your progress summary and reflection, choose the path that best fits your situation.
          </p>
        </div>
      </div>

      {/* Current Metrics Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 border-2 border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          📊 Your Current Metrics (for reference):
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Interviews Completed</p>
            <p className="text-2xl font-bold text-gray-800">
              {interviewsCount} <span className="text-sm text-gray-500">/ {BENCHMARKS.INTERVIEWS_TARGET} target</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Validation Rate</p>
            <p className="text-2xl font-bold text-gray-800">
              {validationRate}% <span className="text-sm text-gray-500">/ {BENCHMARKS.VALIDATION_RATE_MIN}% target</span>
            </p>
          </div>
        </div>
      </div>

      {/* Decision Options */}
      <div className="space-y-6 mb-8">
        {/* PROCEED */}
        <div
          className={getDecisionCardClass('proceed')}
          onClick={() => setSelectedDecision('proceed')}
        >
          {selectedDecision === 'proceed' && (
            <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
              ✓
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Proceed</h3>
              <p className="text-gray-700 mb-3">
                Continue with incremental improvements. You have strong evidence of product-market fit
                and should focus on scaling and optimizing.
              </p>
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">Choose this when:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>PMF score ≥40% or strong qualitative validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>High confidence across most dimensions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Clear path to growth and profitability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Issues are tactical, not strategic</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 italic">
                Example next actions: Optimize conversion funnel, hire for scale, expand to adjacent segments
              </p>
            </div>
          </div>
        </div>

        {/* PATCH */}
        <div
          className={getDecisionCardClass('patch')}
          onClick={() => setSelectedDecision('patch')}
        >
          {selectedDecision === 'patch' && (
            <div className="absolute -top-3 -right-3 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
              ✓
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              🔧
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Patch</h3>
              <p className="text-gray-700 mb-3">
                Make structural changes to business model, pricing, or positioning. You have some validation
                but need targeted improvements before scaling.
              </p>
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">Choose this when:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>PMF score 25-40% or mixed validation signals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Core idea works but execution needs fixes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Specific dimensions have low confidence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Unit economics or pricing need rework</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 italic">
                Example next actions: Revise pricing model, reposition for different segment, overhaul onboarding
              </p>
            </div>
          </div>
        </div>

        {/* PIVOT */}
        <div
          className={getDecisionCardClass('pivot')}
          onClick={() => setSelectedDecision('pivot')}
        >
          {selectedDecision === 'pivot' && (
            <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
              ✓
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              ↻
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Pivot</h3>
              <p className="text-gray-700 mb-3">
                Make a strategic shift in product, market, or business model. Current approach isn't
                working and incremental changes won't fix fundamental issues.
              </p>
              <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">Choose this when:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>PMF score &lt;25% or consistent negative feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Low confidence across multiple dimensions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Core assumptions have been invalidated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Strategic issues, not just execution problems</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 italic">
                Example next actions: Explore zoom-in pivot, test new customer segment, validate different value proposition
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rationale Section */}
      {selectedDecision && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Explain Your Reasoning
          </h3>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why is <strong className="capitalize">{selectedDecision}</strong> the right choice for your venture right now?
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Be specific about the evidence and reasoning behind your decision. Reference your metrics, reflection insights, and confidence assessment."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              required
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Next Actions (Minimum 3)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            What are the specific, concrete steps you'll take in the next 2-4 weeks?
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1. First action:
              </label>
              <input
                type="text"
                value={action1}
                onChange={(e) => setAction1(e.target.value)}
                placeholder="e.g., Conduct 10 more customer interviews focused on enterprise buyers"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Second action:
              </label>
              <input
                type="text"
                value={action2}
                onChange={(e) => setAction2(e.target.value)}
                placeholder="e.g., Build pricing calculator to test willingness to pay"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3. Third action:
              </label>
              <input
                type="text"
                value={action3}
                onChange={(e) => setAction3(e.target.value)}
                placeholder="e.g., Run 2-week experiment with new onboarding flow"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Validation message */}
      {selectedDecision && !canContinue && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📝 Please complete your rationale and all three next actions before continuing
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Confidence Assessment
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            canContinue
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canContinue ? 'Complete Decision →' : 'Select decision and complete all fields'}
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Three-path decision framework • Based on First Round Capital's analysis of 100+ startups
        </p>
      </div>
    </div>
  );
}
