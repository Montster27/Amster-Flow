import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';

interface ReflectionPromptsProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Reflection Prompts Component (Easy Mode)
 *
 * Purpose: Combat specific cognitive biases through research-backed reframing questions
 * - Inheritance question → Combats sunk cost fallacy
 * - Contradiction question → Combats confirmation bias
 * - Temporal question → Combats escalation of commitment
 *
 * Research: Based on cognitive debiasing frameworks
 */
export function ReflectionPrompts({ onContinue, onBack }: ReflectionPromptsProps) {
  const { currentDecision, updateReframingResponses } = usePivot();

  const [inheritanceResponse, setInheritanceResponse] = useState('');
  const [contradictionResponse, setContradictionResponse] = useState('');
  const [temporalResponse, setTemporalResponse] = useState('');

  // Load existing responses if available
  useEffect(() => {
    if (currentDecision?.reframingResponses) {
      setInheritanceResponse(currentDecision.reframingResponses.inheritanceQuestion || '');
      setContradictionResponse(currentDecision.reframingResponses.contradictionQuestion || '');
      setTemporalResponse(currentDecision.reframingResponses.temporalQuestion || '');
    }
  }, [currentDecision]);

  const handleContinue = () => {
    updateReframingResponses({
      inheritanceQuestion: inheritanceResponse,
      contradictionQuestion: contradictionResponse,
      temporalQuestion: temporalResponse,
    });
    onContinue();
  };

  const canContinue = inheritanceResponse.trim() && contradictionResponse.trim() && temporalResponse.trim();

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Critical Reflection
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why this matters:</strong> These questions are designed to combat specific
            cognitive biases that lead to poor decisions.
          </p>
          <p className="text-sm text-blue-800">
            Take your time and be honest with yourself. The goal is to see your situation clearly,
            not to justify past decisions.
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8 mb-8">
        {/* Inheritance Question - Combats Sunk Cost Fallacy */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">1</span>
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full mb-2">
                  Combats: Sunk Cost Fallacy
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                If you inherited this project today with no prior investment...
              </h2>
              <p className="text-gray-600 mb-4">
                Imagine a new CEO takes over your venture tomorrow with zero emotional attachment
                or past investment. What would they change immediately?
              </p>
              <textarea
                value={inheritanceResponse}
                onChange={(e) => setInheritanceResponse(e.target.value)}
                placeholder="e.g., They would immediately shift focus to the enterprise segment we've been avoiding because our original plan targeted consumers. The data clearly shows enterprise has better unit economics and faster sales cycles, but we've sunk 8 months into consumer marketing."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                rows={4}
                required
              />
            </div>
          </div>
          <div className="ml-14 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>💡 Tip:</strong> Think about what decisions you might be defending simply because
              you've already invested time or money, not because they're still the right path forward.
            </p>
          </div>
        </div>

        {/* Contradiction Question - Combats Confirmation Bias */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">2</span>
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full mb-2">
                  Combats: Confirmation Bias
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                What evidence contradicts your current strategy?
              </h2>
              <p className="text-gray-600 mb-4">
                List the data, feedback, or signals that suggest your current approach might not be
                working. What are you afraid might be true?
              </p>
              <textarea
                value={contradictionResponse}
                onChange={(e) => setContradictionResponse(e.target.value)}
                placeholder="e.g., Three of our five pilot customers stopped using the product after the first week. Our NPS score is 15 (should be 40+). The feature we spent 4 months building has a 2% usage rate. Our CAC increased 40% while LTV stayed flat."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={4}
                required
              />
            </div>
          </div>
          <div className="ml-14 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>💡 Tip:</strong> Good founders actively seek disconfirming evidence. What metrics
              or feedback have you been downplaying or ignoring because they're uncomfortable?
            </p>
          </div>
        </div>

        {/* Temporal Question - Combats Escalation of Commitment */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">3</span>
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mb-2">
                  Combats: Escalation of Commitment
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                What would this week's version of you tell last month's version?
              </h2>
              <p className="text-gray-600 mb-4">
                If you could go back 4-8 weeks and give yourself advice based on what you know now,
                what would you say? What did you learn that changed your thinking?
              </p>
              <textarea
                value={temporalResponse}
                onChange={(e) => setTemporalResponse(e.target.value)}
                placeholder="e.g., I'd tell myself to stop adding features and focus on retention. We assumed our churn problem was about missing functionality, but interviews revealed it's actually about onboarding complexity. We should have tested the simplest possible onboarding first instead of building for 6 weeks."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={4}
                required
              />
            </div>
          </div>
          <div className="ml-14 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>💡 Tip:</strong> This creates temporal distance from your past decisions,
              making it easier to evaluate them objectively without feeling like you're admitting failure.
            </p>
          </div>
        </div>
      </div>

      {/* Validation message */}
      {!canContinue && (inheritanceResponse || contradictionResponse || temporalResponse) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📝 Please complete all three reflection questions before continuing
          </p>
        </div>
      )}

      {/* Understanding Box */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          🧠 Understanding these biases:
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-purple-600 font-bold flex-shrink-0">•</span>
            <div>
              <strong>Sunk Cost Fallacy:</strong> Continuing a path because you've already invested
              time/money, even when it's no longer optimal.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold flex-shrink-0">•</span>
            <div>
              <strong>Confirmation Bias:</strong> Seeking out information that supports your beliefs
              while ignoring contradictory evidence.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold flex-shrink-0">•</span>
            <div>
              <strong>Escalation of Commitment:</strong> Increasing commitment to a failing course of
              action to justify past decisions.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Progress Summary
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
          {canContinue ? 'Continue to Confidence Assessment →' : 'Complete all three reflections to continue'}
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Based on cognitive debiasing research • Kahneman, Tversky, and behavioral economics frameworks
        </p>
      </div>
    </div>
  );
}
