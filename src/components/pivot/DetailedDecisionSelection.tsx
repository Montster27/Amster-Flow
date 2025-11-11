import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import type { DecisionPath, PIVOTReadiness } from '../../types/pivot';

interface DetailedDecisionSelectionProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Detailed Mode Decision Selection (with PIVOT Readiness)
 *
 * Purpose: Make evidence-backed decision with readiness assessment
 * Includes PIVOT checklist to evaluate if pivot/patch is well-prepared
 *
 * PIVOT Framework:
 * P - Proof: Strength of validation evidence
 * I - Insight: Unique learnings that inform strategy
 * V - Viability: Unit economics and resource sustainability
 * O - Organization: Team capability for execution
 * T - Timing: Market readiness and competitive positioning
 *
 * Research: Readiness assessment reduces pivot failure rate by 30%
 */
export function DetailedDecisionSelection({ onContinue, onBack }: DetailedDecisionSelectionProps) {
  const {
    currentDecision,
    setDecision,
    updateDecisionRationale,
    updateNextActions,
    updatePIVOTReadiness,
  } = usePivot();

  const [selectedDecision, setSelectedDecision] = useState<DecisionPath | null>(null);
  const [rationale, setRationale] = useState('');
  const [action1, setAction1] = useState('');
  const [action2, setAction2] = useState('');
  const [action3, setAction3] = useState('');

  // PIVOT readiness scores (1-5)
  const [proofScore, setProofScore] = useState(3);
  const [insightScore, setInsightScore] = useState(3);
  const [viabilityScore, setViabilityScore] = useState(3);
  const [organizationScore, setOrganizationScore] = useState(3);
  const [timingScore, setTimingScore] = useState(3);

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
    if (currentDecision?.pivotReadiness) {
      setProofScore(currentDecision.pivotReadiness.proof ?? 3);
      setInsightScore(currentDecision.pivotReadiness.insight ?? 3);
      setViabilityScore(currentDecision.pivotReadiness.viability ?? 3);
      setOrganizationScore(currentDecision.pivotReadiness.organization ?? 3);
      setTimingScore(currentDecision.pivotReadiness.timing ?? 3);
    }
  }, [currentDecision]);

  const calculateOverallReadiness = () => {
    return Math.round((proofScore + insightScore + viabilityScore + organizationScore + timingScore) / 5);
  };

  const overallReadiness = calculateOverallReadiness();

  const getReadinessLevel = () => {
    if (overallReadiness >= 4) return { level: 'High', color: 'text-green-600', bg: 'bg-green-50' };
    if (overallReadiness >= 3) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const readinessInfo = getReadinessLevel();

  const handleContinue = () => {
    if (!selectedDecision) return;

    setDecision(selectedDecision);
    updateDecisionRationale(rationale);
    const actions = [action1, action2, action3].filter(a => a.trim());
    updateNextActions(actions);

    // Save PIVOT readiness if Pivot or Patch
    if (selectedDecision === 'pivot' || selectedDecision === 'patch') {
      const readiness: PIVOTReadiness = {
        proof: proofScore,
        insight: insightScore,
        viability: viabilityScore,
        organization: organizationScore,
        timing: timingScore,
        overallScore: overallReadiness,
      };
      updatePIVOTReadiness(readiness);
    }

    onContinue();
  };

  const canContinue = selectedDecision && rationale.trim() && action1.trim() && action2.trim() && action3.trim();

  const showPivotReadiness = selectedDecision === 'pivot' || selectedDecision === 'patch';

  const getScoreLabel = (value: number) => {
    const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return labels[value] || 'Medium';
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
            <strong>Evidence-based decision:</strong> You've analyzed the data, assessed trajectories,
            and identified pivot types. Now synthesize everything into a clear decision.
          </p>
          <p className="text-sm text-blue-800">
            If choosing Pivot or Patch, complete the PIVOT readiness checklist to ensure you're
            prepared to execute successfully.
          </p>
        </div>
      </div>

      {/* Decision Options (same as Easy Mode) */}
      <div className="space-y-6 mb-8">
        {/* PROCEED */}
        <div
          onClick={() => setSelectedDecision('proceed')}
          className={`relative p-6 rounded-lg border-3 cursor-pointer transition-all ${
            selectedDecision === 'proceed'
              ? 'border-green-500 bg-green-50 shadow-lg ring-4 ring-green-200'
              : 'border-green-300 bg-white hover:border-green-400 hover:shadow-md'
          }`}
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
                Continue with incremental improvements. Strong evidence of product-market fit supports scaling.
              </p>
              <p className="text-sm text-gray-600 italic">
                PMF ≥40%, improving trajectory, clear growth path
              </p>
            </div>
          </div>
        </div>

        {/* PATCH */}
        <div
          onClick={() => setSelectedDecision('patch')}
          className={`relative p-6 rounded-lg border-3 cursor-pointer transition-all ${
            selectedDecision === 'patch'
              ? 'border-yellow-500 bg-yellow-50 shadow-lg ring-4 ring-yellow-200'
              : 'border-yellow-300 bg-white hover:border-yellow-400 hover:shadow-md'
          }`}
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
                Make structural changes to business model, pricing, or positioning. Core idea works but needs fixes.
              </p>
              <p className="text-sm text-gray-600 italic">
                PMF 25-40%, mixed signals, specific improvement areas identified
              </p>
            </div>
          </div>
        </div>

        {/* PIVOT */}
        <div
          onClick={() => setSelectedDecision('pivot')}
          className={`relative p-6 rounded-lg border-3 cursor-pointer transition-all ${
            selectedDecision === 'pivot'
              ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-200'
              : 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-md'
          }`}
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
                Make strategic shift in product, market, or business model. Current approach isn't working.
              </p>
              <p className="text-sm text-gray-600 italic">
                PMF &lt;25% or declining trajectory, core assumptions invalidated
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PIVOT Readiness Checklist (only shown for Pivot/Patch) */}
      {showPivotReadiness && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-4 border-orange-400">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 PIVOT Readiness Checklist
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Before executing a {selectedDecision}, assess your readiness across 5 critical dimensions.
            Research shows this reduces failure rate by 30%.
          </p>

          {/* Overall Readiness Score */}
          <div className={`p-6 rounded-lg border-2 mb-6 ${readinessInfo.bg} border-gray-300`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Overall Readiness Score</h3>
                <p className="text-xs text-gray-500">Average across all PIVOT dimensions</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${readinessInfo.color}`}>
                  {overallReadiness}/5
                </p>
                <p className={`text-sm font-medium ${readinessInfo.color}`}>
                  {readinessInfo.level}
                </p>
              </div>
            </div>
          </div>

          {/* P - Proof */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  <span className="text-blue-600">P</span> - Proof
                </h3>
                <p className="text-sm text-gray-600">
                  How strong is your validation evidence?
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{proofScore}/5</p>
                <p className="text-xs text-gray-500">{getScoreLabel(proofScore)}</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={proofScore}
              onChange={(e) => setProofScore(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-300"
            />
            <p className="text-xs text-gray-600 mt-2">
              Consider: Number of interviews, PMF score, retention data, experiment results
            </p>
          </div>

          {/* I - Insight */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  <span className="text-purple-600">I</span> - Insight
                </h3>
                <p className="text-sm text-gray-600">
                  Do you have unique learnings that inform this direction?
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{insightScore}/5</p>
                <p className="text-xs text-gray-500">{getScoreLabel(insightScore)}</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={insightScore}
              onChange={(e) => setInsightScore(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-300"
            />
            <p className="text-xs text-gray-600 mt-2">
              Consider: Unique market insights, unmet needs discovered, competitive blind spots identified
            </p>
          </div>

          {/* V - Viability */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  <span className="text-green-600">V</span> - Viability
                </h3>
                <p className="text-sm text-gray-600">
                  Are the unit economics sustainable?
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{viabilityScore}/5</p>
                <p className="text-xs text-gray-500">{getScoreLabel(viabilityScore)}</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={viabilityScore}
              onChange={(e) => setViabilityScore(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-300"
            />
            <p className="text-xs text-gray-600 mt-2">
              Consider: LTV/CAC ratio, gross margins, path to profitability, capital efficiency
            </p>
          </div>

          {/* O - Organization */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  <span className="text-orange-600">O</span> - Organization
                </h3>
                <p className="text-sm text-gray-600">
                  Does your team have the capabilities to execute?
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{organizationScore}/5</p>
                <p className="text-xs text-gray-500">{getScoreLabel(organizationScore)}</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={organizationScore}
              onChange={(e) => setOrganizationScore(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-300"
            />
            <p className="text-xs text-gray-600 mt-2">
              Consider: Technical skills, domain expertise, execution velocity, team alignment
            </p>
          </div>

          {/* T - Timing */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  <span className="text-red-600">T</span> - Timing
                </h3>
                <p className="text-sm text-gray-600">
                  Is the market ready for this approach?
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{timingScore}/5</p>
                <p className="text-xs text-gray-500">{getScoreLabel(timingScore)}</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={timingScore}
              onChange={(e) => setTimingScore(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-300"
            />
            <p className="text-xs text-gray-600 mt-2">
              Consider: Market trends, competitive landscape, regulatory environment, customer readiness
            </p>
          </div>

          {/* Readiness Interpretation */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Readiness Interpretation:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              {overallReadiness >= 4 && (
                <p>✅ <strong>High readiness:</strong> Strong preparation across all dimensions. Execute with confidence.</p>
              )}
              {overallReadiness === 3 && (
                <p>🔶 <strong>Medium readiness:</strong> Decent preparation but some gaps. Address weak areas before full commitment.</p>
              )}
              {overallReadiness <= 2 && (
                <p>⚠️ <strong>Low readiness:</strong> Significant gaps in multiple areas. Strengthen preparation before executing {selectedDecision}.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rationale and Actions */}
      {selectedDecision && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Explain Your Reasoning
          </h3>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Synthesize your analysis: Why is <strong className="capitalize">{selectedDecision}</strong> the right choice?
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Reference your evidence quality scores, mixed-methods analysis, hypothesis results, trajectory assessment, and PIVOT readiness (if applicable). Be specific about what the data tells you."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={5}
              required
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Next Actions (Minimum 3)
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={action1}
              onChange={(e) => setAction1(e.target.value)}
              placeholder="1. First concrete action..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={action2}
              onChange={(e) => setAction2(e.target.value)}
              placeholder="2. Second concrete action..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={action3}
              onChange={(e) => setAction3(e.target.value)}
              placeholder="3. Third concrete action..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
          ← Back to Pivot Types
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
          PIVOT readiness framework • Reduces failure rate by 30% • First Round Capital research
        </p>
      </div>
    </div>
  );
}
