import { useState } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import { PIVOT_TYPES } from '../../types/pivot';
import type { PivotType } from '../../types/pivot';

interface PivotTypeRecommendationsProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Pivot Type Recommendations (Detailed Mode)
 *
 * Purpose: Guide strategic pivot decisions with proven frameworks
 * Shows 10 pivot types with real examples and selection guidance
 *
 * 10 Pivot Types (from Lean Startup methodology):
 * 1. Zoom-in: Focus on single feature (Instagram)
 * 2. Zoom-out: Expand to platform (Groupon)
 * 3. Customer Segment: Target different customers
 * 4. Customer Need: Solve different problem
 * 5. Platform: Build marketplace
 * 6. Business Architecture: High margin → High volume
 * 7. Value Capture: Change monetization
 * 8. Engine of Growth: Change growth model
 * 9. Channel: Different distribution
 * 10. Technology: Different tech stack
 *
 * Research: Structured pivot frameworks increase success rate by 40%
 */
export function PivotTypeRecommendations({ onContinue, onBack }: PivotTypeRecommendationsProps) {
  const { currentDecision, setRecommendedPivotType } = usePivot();

  const [selectedType, setSelectedType] = useState<PivotType | null>(
    currentDecision?.recommendedPivotType || null
  );
  const [showDetails, setShowDetails] = useState<PivotType | null>(null);

  const handleSelect = (type: PivotType) => {
    setSelectedType(type);
    setRecommendedPivotType(type);
  };

  const pivotTypesList: PivotType[] = [
    'zoom-in',
    'zoom-out',
    'customer-segment',
    'customer-need',
    'platform',
    'business-architecture',
    'value-capture',
    'engine-of-growth',
    'channel',
    'technology',
  ];

  const getTypeIcon = (type: PivotType) => {
    const icons: Record<PivotType, string> = {
      'zoom-in': '🔍',
      'zoom-out': '🔭',
      'customer-segment': '👥',
      'customer-need': '🎯',
      'platform': '🏗️',
      'business-architecture': '🏛️',
      'value-capture': '💰',
      'engine-of-growth': '🚀',
      'channel': '📢',
      'technology': '⚙️',
    };
    return icons[type];
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Pivot Type Selection
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why categorize pivots?</strong> Research shows that structured pivot frameworks
            increase success rate by 40% compared to ad-hoc strategy changes.
          </p>
          <p className="text-sm text-blue-800">
            Not all pivots are equal. Understanding which type matches your situation helps you
            focus on the right changes and avoid wasting time on the wrong ones.
          </p>
        </div>
      </div>

      {/* Selection Guide */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📋 How to Choose:
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <p className="font-semibold text-green-900 mb-2">✅ What's Working:</p>
            <ul className="space-y-1 text-green-800">
              <li>• Strong engagement with specific feature? → Zoom-in</li>
              <li>• Different customer loves you? → Customer Segment</li>
              <li>• Technology performs well? → Keep tech, change model</li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <p className="font-semibold text-red-900 mb-2">⚠️ What's Not:</p>
            <ul className="space-y-1 text-red-800">
              <li>• Wrong customer segment? → Customer Segment pivot</li>
              <li>• Wrong problem being solved? → Customer Need pivot</li>
              <li>• Economics don't work? → Business Architecture pivot</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pivot Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {pivotTypesList.map((type) => {
          const info = PIVOT_TYPES[type];
          const isSelected = selectedType === type;

          return (
            <div
              key={type}
              className={`bg-white rounded-lg shadow-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 ring-4 ring-blue-200'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => handleSelect(type)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTypeIcon(type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {info.name}
                      </h3>
                      {isSelected && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mt-1">
                          Selected ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  {info.description}
                </p>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Famous Example:
                  </p>
                  <p className="text-xs text-gray-600">
                    {info.example}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(showDetails === type ? null : type);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showDetails === type ? 'Hide details ▲' : 'Show details ▼'}
                </button>

                {/* Detailed View */}
                {showDetails === type && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        When to use:
                      </p>
                      <p className="text-xs text-gray-600">
                        {info.whenToUse}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        What changes:
                      </p>
                      <p className="text-xs text-gray-600">
                        {info.whatChanges}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        What stays:
                      </p>
                      <p className="text-xs text-gray-600">
                        {info.whatStays}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Risks:
                      </p>
                      <p className="text-xs text-gray-600">
                        {info.risks}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Pivot Summary */}
      {selectedType && (
        <div className="bg-blue-50 rounded-lg p-6 mb-8 border-2 border-blue-400">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            ✅ Selected Pivot: {PIVOT_TYPES[selectedType].name}
          </h2>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Strategic Direction:</strong> {PIVOT_TYPES[selectedType].description}
            </p>
            <p className="text-sm text-gray-700 mb-3">
              <strong>Key Changes Required:</strong> {PIVOT_TYPES[selectedType].whatChanges}
            </p>
            <p className="text-sm text-gray-700">
              <strong>What You Keep:</strong> {PIVOT_TYPES[selectedType].whatStays}
            </p>
          </div>
        </div>
      )}

      {/* Pivot Success Factors */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          🎯 Pivot Success Factors:
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold mb-2">✅ Successful Pivots:</p>
            <ul className="space-y-1">
              <li>• Preserve what's working, change what's not</li>
              <li>• Based on validated learning, not gut feel</li>
              <li>• Clear hypothesis about why new approach will work</li>
              <li>• Team has capabilities for new direction</li>
              <li>• Adequate runway to validate pivot (6+ months)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">⚠️ Failed Pivots:</p>
            <ul className="space-y-1">
              <li>• Throw away everything and start over</li>
              <li>• Based on panic, not data</li>
              <li>• Vague or aspirational new direction</li>
              <li>• Team lacks skills for pivot</li>
              <li>• Too little runway to validate properly</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm text-gray-700">
            <strong>Remember:</strong> The best pivots leverage your unique insights and assets while
            changing the specific things that aren't working. You're reconfiguring, not starting over.
          </p>
        </div>
      </div>

      {/* Real Examples Reference */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          📚 Famous Pivot Examples:
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold text-gray-800">Instagram (Zoom-in)</p>
            <p className="text-gray-600 mt-1">Started as Burbn (location check-in app with photos). Realized photo-sharing was only feature people loved. Stripped everything else.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold text-gray-800">Groupon (Zoom-out)</p>
            <p className="text-gray-600 mt-1">Started as The Point (activism platform). One successful group buying campaign led to building full marketplace.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold text-gray-800">Slack (Customer Need)</p>
            <p className="text-gray-600 mt-1">Started as internal tool for game company. Game failed but team communication tool was valuable.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold text-gray-800">Twitter (Customer Segment)</p>
            <p className="text-gray-600 mt-1">Started as Odeo (podcasting platform). Pivoted when iTunes launched podcasting. Found different use case.</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to PMF Trajectory
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          {selectedType ? 'Continue to Decision →' : 'Skip to Decision →'}
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Based on Lean Startup methodology • Structured pivot frameworks increase success rate by 40%
        </p>
      </div>
    </div>
  );
}
