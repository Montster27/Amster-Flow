import { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Actor, Connection, ACTOR_ICONS, ACTOR_LABELS, CONNECTION_ICONS, CONNECTION_LABELS, getRiskLevel, RISK_COLORS, calculateRiskScore } from '../../types/visualSectorMap';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { useGuide } from '../../contexts/GuideContext';
import { Assumption, AssumptionStatus } from '../../types/discovery';
import { Discovery2Context } from '../../contexts/Discovery2Context';
import type { Discovery2Assumption } from '../../types/discovery';

interface InspectorProps {
  target: Actor | Connection | null;
  targetType: 'actor' | 'connection' | null;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

// Status badge styles
const STATUS_STYLES: Record<AssumptionStatus, { bg: string; text: string; icon: string }> = {
  untested: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '❓' },
  testing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔬' },
  validated: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
  invalidated: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
};

export const Inspector = ({ target, targetType, onClose, onDelete, onEdit }: InspectorProps) => {
  if (!target || !targetType) return null;

  // Check if Discovery 2.0 context is available (takes precedence)
  const discovery2Context = useContext(Discovery2Context);

  // Use Discovery 2.0 if available, otherwise fallback to original Discovery
  const discoveryContext = useDiscovery();
  const isDiscovery2 = discovery2Context !== undefined && discovery2Context !== null;

  // Get appropriate context functions based on which context is available
  const activeContext = isDiscovery2 ? discovery2Context! : discoveryContext;
  const {
    assumptions: rawAssumptions,
    linkAssumptionToActor,
    unlinkAssumptionFromActor,
    linkAssumptionToConnection,
    unlinkAssumptionFromConnection,
  } = activeContext;

  // Type assumptions as union to satisfy TypeScript
  const assumptions = rawAssumptions as (Assumption | Discovery2Assumption)[];

  const { navigateToModuleWithContext } = useGuide();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  const isActor = targetType === 'actor';
  const actor = isActor ? (target as Actor) : null;
  const connection = !isActor ? (target as Connection) : null;

  // Fetch actual assumption data (works with both Assumption and Discovery2Assumption)
  const linkedAssumptionData = target.linkedAssumptions
    ?.map((id) => assumptions.find((a) => a.id === id))
    .filter((a): a is Assumption | Discovery2Assumption => a !== undefined) || [];

  const hasAssumptions = linkedAssumptionData.length > 0;

  // Calculate real-time risk score based on linked assumptions
  const calculatedRiskScore = hasAssumptions
    ? calculateRiskScore(linkedAssumptionData.map(a => ({
        status: a.status,
        confidence: a.confidence
      })))
    : (target.riskScore || 0);

  const riskLevel = getRiskLevel(calculatedRiskScore);
  const riskColors = RISK_COLORS[riskLevel];

  const handleDelete = () => {
    const targetName = isActor ? actor!.name : 'connection';
    if (window.confirm(`Delete ${targetName}?`)) {
      onDelete?.();
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit?.();
  };

  // Phase 2: Navigation handlers for cross-module integration
  // Always navigate to Discovery 2.0 when projectId is available
  const handleCreateAssumption = () => {
    if (projectId) {
      // Navigate to Discovery 2.0 page
      // Store navigation context in sessionStorage for Discovery 2.0 to pick up
      const context = isActor
        ? { actorId: actor!.id, action: 'create' as const }
        : { connectionId: connection!.id, action: 'create' as const };
      sessionStorage.setItem('discovery2NavigationContext', JSON.stringify(context));
      navigate(`/project/${projectId}/discovery2`);
      onClose();
    } else {
      // Fallback to original Discovery module navigation (if no projectId)
      const context = isActor
        ? { actorId: actor!.id, action: 'create' as const }
        : { connectionId: connection!.id, action: 'create' as const };
      navigateToModuleWithContext('discovery', context);
      onClose();
    }
  };

  const handleViewInDiscovery = () => {
    if (projectId) {
      // Navigate to Discovery 2.0 page
      const context = isActor
        ? { actorId: actor!.id, action: 'filter' as const }
        : { connectionId: connection!.id, action: 'filter' as const };
      sessionStorage.setItem('discovery2NavigationContext', JSON.stringify(context));
      navigate(`/project/${projectId}/discovery2`);
      onClose();
    } else {
      // Fallback to original Discovery module navigation (if no projectId)
      const context = isActor
        ? { actorId: actor!.id, action: 'filter' as const }
        : { connectionId: connection!.id, action: 'filter' as const };
      navigateToModuleWithContext('discovery', context);
      onClose();
    }
  };

  // Phase 3: Linking/Unlinking handlers
  const handleLinkAssumption = (assumptionId: string) => {
    if (isActor) {
      linkAssumptionToActor(assumptionId, actor!.id);
    } else {
      linkAssumptionToConnection(assumptionId, connection!.id);
    }
    setShowLinkDropdown(false);
  };

  const handleUnlinkAssumption = (assumptionId: string) => {
    if (isActor) {
      unlinkAssumptionFromActor(assumptionId, actor!.id);
    } else {
      unlinkAssumptionFromConnection(assumptionId, connection!.id);
    }
  };

  // Get unlinked assumptions (available to link)
  const unlinkedAssumptions = assumptions.filter(
    (a) => !target.linkedAssumptions?.includes(a.id)
  );

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
                  <p className="text-xs text-gray-600">
                    Score: {calculatedRiskScore.toFixed(1)}/5
                    {hasAssumptions && <span className="ml-1">(auto-calculated)</span>}
                  </p>
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
                {unlinkedAssumptions.length > 0 ? (
                  <button
                    onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Link Assumption
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-gray-400 italic">
                    No assumptions available to link
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {linkedAssumptionData.map((assumption) => {
                  const statusStyle = STATUS_STYLES[assumption.status];
                  return (
                    <div
                      key={assumption.id}
                      className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors relative group"
                    >
                      <button
                        onClick={() => handleUnlinkAssumption(assumption.id)}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full border border-gray-300 hover:bg-red-50 hover:border-red-300 transition-colors opacity-0 group-hover:opacity-100"
                        title="Unlink assumption"
                      >
                        <X className="w-3 h-3 text-gray-600 hover:text-red-600" />
                      </button>
                      <div className="flex items-start gap-2 mb-2 pr-6">
                        <span className="text-sm">{statusStyle.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 font-medium line-clamp-2">
                            {assumption.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 ${statusStyle.bg} ${statusStyle.text} text-xs rounded font-medium capitalize`}>
                              {assumption.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              Confidence: {assumption.confidence}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      {assumption.evidence.length > 0 && (
                        <div className="ml-6 text-xs text-gray-600">
                          <span className="font-medium">Evidence:</span> {assumption.evidence.length} item{assumption.evidence.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
                {unlinkedAssumptions.length > 0 && (
                  <button
                    onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                    className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2"
                  >
                    + Link Another
                  </button>
                )}
              </div>
            )}

            {/* Link Dropdown */}
            {showLinkDropdown && unlinkedAssumptions.length > 0 && (
              <div className="mt-2 bg-white border-2 border-blue-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">Select an assumption to link:</p>
                  <button
                    onClick={() => setShowLinkDropdown(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {unlinkedAssumptions.map((assumption) => {
                    const statusStyle = STATUS_STYLES[assumption.status];
                    return (
                      <button
                        key={assumption.id}
                        onClick={() => handleLinkAssumption(assumption.id)}
                        className="w-full text-left p-2 rounded hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs">{statusStyle.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 line-clamp-1">
                              {assumption.description}
                            </p>
                            <span className={`text-xs px-1 py-0.5 ${statusStyle.bg} ${statusStyle.text} rounded capitalize`}>
                              {assumption.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">⚡ Quick Actions</h4>
            <div className="space-y-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>✏️</span> Edit Details
                </button>
              )}

              <button
                onClick={handleCreateAssumption}
                className="w-full px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>➕</span> Create Assumption
              </button>

              {hasAssumptions && (
                <button
                  onClick={handleViewInDiscovery}
                  className="w-full px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>📊</span> View in Discovery
                </button>
              )}

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>🗑️</span> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
