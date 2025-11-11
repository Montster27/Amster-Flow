import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';

interface PreMortemExerciseProps {
  onContinue: () => void;
}

/**
 * Pre-Mortem Exercise Component
 *
 * Purpose: Reduce optimism bias by 30% through prospective hindsight
 * Students imagine failure scenarios BEFORE reviewing data
 *
 * Research: Klein's pre-mortem methodology
 */
export function PreMortemExercise({ onContinue }: PreMortemExerciseProps) {
  const { currentDecision, updatePreMortemInsights } = usePivot();

  const [insight1, setInsight1] = useState('');
  const [insight2, setInsight2] = useState('');
  const [insight3, setInsight3] = useState('');

  // Load existing insights if available
  useEffect(() => {
    if (currentDecision?.preMortemInsights) {
      setInsight1(currentDecision.preMortemInsights[0] || '');
      setInsight2(currentDecision.preMortemInsights[1] || '');
      setInsight3(currentDecision.preMortemInsights[2] || '');
    }
  }, [currentDecision]);

  const handleContinue = () => {
    const insights = [insight1, insight2, insight3].filter(i => i.trim());
    updatePreMortemInsights(insights);
    onContinue();
  };

  const canContinue = insight1.trim() && insight2.trim() && insight3.trim();

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Pre-Mortem Exercise
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why this matters:</strong> Research shows that imagining failure scenarios before
            reviewing data reduces optimism bias by 30%.
          </p>
          <p className="text-sm text-blue-800">
            This exercise helps you think critically about potential failure modes before
            your judgment is influenced by recent progress or setbacks.
          </p>
        </div>
      </div>

      {/* Main Exercise */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">!</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Imagine it's 6 months from now...
              </h2>
              <p className="text-gray-600">
                Your venture has failed completely. Working backward from that failure,
                what were the <strong>three most likely causes</strong>?
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Insight 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Most likely cause of failure:
            </label>
            <textarea
              value={insight1}
              onChange={(e) => setInsight1(e.target.value)}
              placeholder="e.g., We couldn't achieve product-market fit because customers didn't value our core feature enough to switch from current solutions"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Insight 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Second most likely cause:
            </label>
            <textarea
              value={insight2}
              onChange={(e) => setInsight2(e.target.value)}
              placeholder="e.g., We ran out of runway before validating unit economics - customer acquisition costs were too high"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Insight 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Third most likely cause:
            </label>
            <textarea
              value={insight3}
              onChange={(e) => setInsight3(e.target.value)}
              placeholder="e.g., Team didn't have the right technical skills to build what customers actually needed"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              required
            />
          </div>
        </div>

        {/* Validation message */}
        {!canContinue && (insight1 || insight2 || insight3) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              📝 Please complete all three failure scenarios before continuing
            </p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          💡 Tips for effective pre-mortem thinking:
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Be specific and concrete - avoid vague statements like "poor execution"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Think about systemic issues, not just bad luck or external factors</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Consider market, product, team, and business model failure modes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Don't worry about being pessimistic - this exercise protects against overconfidence</span>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            canContinue
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canContinue ? 'Continue to Progress Review →' : 'Complete all three insights to continue'}
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Based on Klein's pre-mortem methodology • Reduces prediction error by up to 30%
        </p>
      </div>
    </div>
  );
}
