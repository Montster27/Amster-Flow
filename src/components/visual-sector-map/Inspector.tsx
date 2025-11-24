import { X } from 'lucide-react';
import { Actor, Connection, ACTOR_ICONS, ACTOR_LABELS, CONNECTION_ICONS, CONNECTION_LABELS, getRiskLevel, RISK_COLORS } from '../../types/visualSectorMap';

interface InspectorProps {
  target: Actor | Connection | null;
  targetType: 'actor' | 'connection' | null;
  onClose: () => void;
}

export const Inspector = ({ target, targetType, onClose }: InspectorProps) => {
  if (!target || !targetType) return null;

  const isActor = targetType === 'actor';
  const actor = isActor ? (target as Actor) : null;
  const connection = !isActor ? (target as Connection) : null;

  const riskLevel = getRiskLevel(target.riskScore);
  const riskColors = RISK_COLORS[riskLevel];
  const hasAssumptions = (target.linkedAssumptions?.length || 0) > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className={`${riskColors.bg} ${riskColors.border} border-l-4 p-4 flex items-start justify-between`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">
                {isActor ? ACTOR_ICONS[actor!.category] : CONNECTION_ICONS[connection!.type]}
              </span>
              <h3 className="font-bold text-lg text-gray-900">
                {isActor ? actor!.name : `${CONNECTION_LABELS[connection!.type]} Connection`}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {isActor ? ACTOR_LABELS[actor!.category] : connection!.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Risk Score */}
          {riskLevel !== 'none' && (
            <div className={`${riskColors.bg} ${riskColors.border} border-l-4 p-3 rounded`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className={`font-semibold ${riskColors.text} capitalize`}>{riskLevel} Risk</p>
                  <p className="text-xs text-gray-600">Score: {target.riskScore}/5</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {target.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 Description</h4>
              <p className="text-sm text-gray-600">{target.description}</p>
            </div>
          )}

          {/* Linked Assumptions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>🔗 Linked Assumptions</span>
              {hasAssumptions && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskColors.bg} ${riskColors.text}`}>
                  {target.linkedAssumptions!.length}
                </span>
              )}
            </h4>
            {!hasAssumptions ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">No assumptions linked yet</p>
                <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  + Link Assumption
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {target.linkedAssumptions!.map((assumptionId, index) => (
                  <div
                    key={assumptionId}
                    className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm">❓</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium">Assumption {index + 1}</p>
                        <p className="text-xs text-gray-500 truncate">{assumptionId}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                        Untested
                      </span>
                    </div>
                  </div>
                ))}
                <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2">
                  + Link Another
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">⚡ Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors flex items-center gap-2">
                <span>✏️</span> Edit Details
              </button>
              <button className="w-full px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm font-medium transition-colors flex items-center gap-2">
                <span>📊</span> View in Discovery
              </button>
              <button className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded text-sm font-medium transition-colors flex items-center gap-2">
                <span>🗑️</span> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
