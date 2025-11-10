import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';

interface ScopeDefinitionProps {
  onContinue: () => void;
}

export const ScopeDefinition = ({ onContinue }: ScopeDefinitionProps) => {
  const { scope, updateScope } = useVisualSectorMap();

  const canContinue = scope.sector.trim() && scope.question.trim();

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Step 1: Define Your Sector Map Scope
          </h1>
          <p className="text-gray-600">
            Every sector is a web of interactions. Let's start by defining what you want to explore.
          </p>
        </div>

        <div className="space-y-6">
          {/* Sector/Problem Area */}
          <div>
            <label className="block text-lg font-medium text-gray-800 mb-2">
              What's the sector or problem area you're exploring?
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Examples: Elder care, Student housing, Local food delivery, Healthcare access
            </p>
            <input
              type="text"
              value={scope.sector}
              onChange={(e) => updateScope({ sector: e.target.value })}
              placeholder="e.g., Elder care services"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Core Question */}
          <div>
            <label className="block text-lg font-medium text-gray-800 mb-2">
              What's the question you want to answer?
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Examples: Who influences how seniors access healthcare? What stops students from finding affordable housing?
            </p>
            <textarea
              value={scope.question}
              onChange={(e) => updateScope({ question: e.target.value })}
              placeholder="e.g., Who influences how seniors access healthcare?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              rows={3}
            />
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                canContinue
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canContinue ? 'Continue to Map Actors →' : 'Fill in both fields to continue'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Your question will guide the rest of your mapping. Make it specific
              enough to be actionable, but broad enough to capture the key relationships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
