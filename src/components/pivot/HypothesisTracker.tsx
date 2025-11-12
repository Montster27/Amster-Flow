import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import type { Hypothesis } from '../../types/pivot';

interface HypothesisTrackerProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Hypothesis Tracking System (Detailed Mode)
 *
 * Purpose: Maintain scientific rigor in validation process
 * Forces explicit hypothesis → test → learn → next cycle
 *
 * Structure:
 * - Initial hypothesis: What did you believe?
 * - Test conducted: How did you validate it?
 * - Evidence gathered: What did you learn?
 * - Conclusion: Validated, invalidated, or inconclusive?
 * - Next hypothesis: What needs testing next?
 *
 * Research: Hypothesis-driven entrepreneurship reduces wasted effort by 50%
 */
export function HypothesisTracker({ onContinue, onBack }: HypothesisTrackerProps) {
  const { currentDecision, updateHypothesis } = usePivot();

  const [hypothesis, setHypothesis] = useState('');
  const [testConducted, setTestConducted] = useState('');
  const [evidenceGathered, setEvidenceGathered] = useState('');
  const [conclusion, setConclusion] = useState<'validated' | 'invalidated' | 'inconclusive' | 'pending'>('inconclusive');
  const [nextHypothesis, setNextHypothesis] = useState('');

  // Load existing hypothesis if available
  useEffect(() => {
    if (currentDecision?.hypothesisTested) {
      const hyp = currentDecision.hypothesisTested;
      setHypothesis(hyp.statement);
      setTestConducted(hyp.testConducted);
      setEvidenceGathered(hyp.evidenceGathered);
      setConclusion(hyp.result);
      setNextHypothesis(hyp.nextHypothesis || '');
    }
  }, [currentDecision]);

  const handleSave = () => {
    const hyp: Hypothesis = {
      statement: hypothesis,
      testConducted,
      evidenceGathered,
      result: conclusion,
      nextHypothesis: nextHypothesis || undefined,
    };
    updateHypothesis(hyp);
  };

  const canContinue = hypothesis.trim() && testConducted.trim() && evidenceGathered.trim();

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Hypothesis Tracking
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why track hypotheses?</strong> Research shows that hypothesis-driven
            entrepreneurship reduces wasted effort by 50% by making assumptions explicit.
          </p>
          <p className="text-sm text-blue-800">
            This keeps you honest about what you believed, what you tested, and what you learned—preventing
            post-hoc rationalization of results.
          </p>
        </div>
      </div>

      {/* Scientific Method Visualization */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🔬 Scientific Method for Startups
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              1
            </div>
            <p className="text-sm font-medium text-gray-700">State<br />Hypothesis</p>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-2xl">→</div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              2
            </div>
            <p className="text-sm font-medium text-gray-700">Design<br />Test</p>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-2xl">→</div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              3
            </div>
            <p className="text-sm font-medium text-gray-700">Gather<br />Evidence</p>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-2xl">→</div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              4
            </div>
            <p className="text-sm font-medium text-gray-700">Draw<br />Conclusion</p>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-2xl">→</div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              5
            </div>
            <p className="text-sm font-medium text-gray-700">Next<br />Hypothesis</p>
          </div>
        </div>
      </div>

      {/* Hypothesis Form */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="space-y-6">
          {/* Step 1: Hypothesis Statement */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Initial Hypothesis
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              What did you believe to be true? State it as a falsifiable hypothesis.
            </p>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="e.g., Small business owners will pay $99/month for automated bookkeeping if it saves them 5+ hours per week"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ml-11"
              rows={3}
              required
            />
          </div>

          {/* Step 2: Test Conducted */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Test Conducted
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              How did you test this hypothesis? Be specific about your methodology.
            </p>
            <textarea
              value={testConducted}
              onChange={(e) => setTestConducted(e.target.value)}
              placeholder="e.g., Conducted 15 customer interviews with small business owners (2-10 employees), asked about current bookkeeping pain points and willingness to pay. Ran 2-week pricing experiment with landing page conversion tracking."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none ml-11"
              rows={4}
              required
            />
          </div>

          {/* Step 3: Evidence Gathered */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Evidence Gathered
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              What did you learn? Include both supporting and contradictory evidence.
            </p>
            <textarea
              value={evidenceGathered}
              onChange={(e) => setEvidenceGathered(e.target.value)}
              placeholder="e.g., 12/15 interviews confirmed 5+ hours pain point. However, only 3/15 said they'd pay $99/month (most said $29-49 range). Landing page had 8% conversion to trial but 60% churn after first month. Key insight: price point too high, onboarding too complex."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ml-11"
              rows={4}
              required
            />
          </div>

          {/* Step 4: Conclusion */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Conclusion
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              Was your hypothesis validated, invalidated, or inconclusive?
            </p>
            <div className="ml-11 space-y-3">
              <button
                onClick={() => setConclusion('validated')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  conclusion === 'validated'
                    ? 'bg-green-50 border-green-500 ring-4 ring-green-200'
                    : 'bg-white border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-gray-800">Validated</p>
                    <p className="text-sm text-gray-600">Evidence strongly supports the hypothesis</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setConclusion('invalidated')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  conclusion === 'invalidated'
                    ? 'bg-red-50 border-red-500 ring-4 ring-red-200'
                    : 'bg-white border-gray-300 hover:border-red-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold text-gray-800">Invalidated</p>
                    <p className="text-sm text-gray-600">Evidence contradicts the hypothesis</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setConclusion('inconclusive')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  conclusion === 'inconclusive'
                    ? 'bg-yellow-50 border-yellow-500 ring-4 ring-yellow-200'
                    : 'bg-white border-gray-300 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤔</span>
                  <div>
                    <p className="font-semibold text-gray-800">Inconclusive</p>
                    <p className="text-sm text-gray-600">Mixed signals or insufficient data</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 5: Next Hypothesis */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                5
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Next Hypothesis
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              Based on what you learned, what's the next most critical assumption to test?
            </p>
            <textarea
              value={nextHypothesis}
              onChange={(e) => setNextHypothesis(e.target.value)}
              placeholder="e.g., Small business owners will pay $49/month if we can demonstrate 2x faster onboarding and ROI within first month. Need to test: simplified onboarding flow + value demonstration."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ml-11"
              rows={3}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 ml-11">
          <button
            onClick={handleSave}
            disabled={!canContinue}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              canContinue
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Hypothesis
          </button>
        </div>
      </div>

      {/* Interpretation Guidance */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          🎯 How to interpret results:
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✅</span>
            <div>
              <strong>Validated:</strong> Your hypothesis was mostly or entirely correct. Extract
              the learning and move to next critical assumption.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 font-bold">❌</span>
            <div>
              <strong>Invalidated:</strong> Your hypothesis was wrong. This is good! You learned
              something important. Pivot to test a revised hypothesis.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold">🤔</span>
            <div>
              <strong>Inconclusive:</strong> Mixed signals or insufficient data. Either run a
              better test or accept uncertainty and move forward.
            </div>
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm text-gray-700">
            <strong>Remember:</strong> Invalidated hypotheses are just as valuable as validated ones.
            They prevent you from wasting months on wrong assumptions. The goal isn't to be right—it's
            to learn quickly.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Mixed-Methods
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Continue to PMF Trajectory →
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Hypothesis-driven entrepreneurship • Reduces wasted effort by 50% • Makes assumptions explicit and testable
        </p>
      </div>
    </div>
  );
}
