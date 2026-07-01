import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  AMBER_FG, AMBER_LINE, AMBER_SOFT, INK, MUTED, SLATE_FG, STONE, TEAL,
} from '../../features/v3/lib/tokens';

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
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: INK }}>
            <span>🗺️</span> Define Your Map
          </h1>
          <p style={{ color: SLATE_FG }}>Map the relationships in your sector</p>
        </div>

        <div className="space-y-6">
          {/* Sector/Problem Area */}
          <div>
            <label className="block text-lg font-medium mb-3 flex items-center gap-2" style={{ color: INK }}>
              <span>📍</span> Sector or problem area
            </label>
            <input
              type="text"
              value={scope.sector}
              onChange={(e) => updateScope({ sector: e.target.value })}
              placeholder="e.g., Elder care • Student housing • Local food delivery"
              className="w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
            />
          </div>

          {/* Core Question */}
          <div>
            <label className="block text-lg font-medium mb-3 flex items-center gap-2" style={{ color: INK }}>
              <span>❓</span> Key question to answer
            </label>
            <textarea
              value={scope.question}
              onChange={(e) => updateScope({ question: e.target.value })}
              placeholder="e.g., Who influences how seniors access healthcare?"
              className="w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
              rows={3}
            />
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all"
              style={canContinue
                ? { background: TEAL, color: '#fff' }
                : { background: '#e2e8f0', color: MUTED, cursor: 'not-allowed' }}
            >
              {canContinue ? 'Continue to Map Actors →' : 'Fill in both fields to continue'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 rounded" style={{ background: AMBER_SOFT, borderLeft: `4px solid ${AMBER_LINE}` }}>
            <p className="text-sm" style={{ color: AMBER_FG }}>
              <strong>💡 Tip:</strong> Make your question specific yet broad enough to capture key relationships
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
