import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Actor, Connection, ACTOR_ICONS, ACTOR_LABELS, CONNECTION_ICONS, CONNECTION_LABELS, getRiskLevel, RISK_COLORS, calculateRiskScore } from '../../types/visualSectorMap';
import { DiscoveryContext } from '../../contexts/DiscoveryContext';
import { useGuide } from '../../contexts/GuideContext';
import { Assumption, AssumptionStatus } from '../../types/discovery';
import type { CanvasArea, PriorityLevel, ConfidenceLevel, AssumptionType } from '../../types/discovery';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  TEAL, TEAL_LITE, INK, SLATE_FG, MUTED, TAN, STONE, HAIR, ERROR_FG,
} from '../../features/v3/lib/tokens';

const ERROR_SOFT = 'rgba(190,18,60,0.08)';
const ERROR_LINE = 'rgba(190,18,60,0.3)';

interface InspectorProps {
  target: Actor | Connection | null;
  targetType: 'actor' | 'connection' | null;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

// Status badge styles
const STATUS_STYLES: Record<AssumptionStatus, { bg: string; text: string; icon: string }> = {
  untested: { bg: HAIR, text: SLATE_FG, icon: '❓' },
  testing: { bg: TEAL_LITE, text: TEAL, icon: '🔬' },
  validated: { bg: TEAL_LITE, text: TEAL, icon: '✅' },
  invalidated: { bg: ERROR_SOFT, text: ERROR_FG, icon: '❌' },
};

export const Inspector = ({ target, targetType, onClose, onDelete, onEdit }: InspectorProps) => {
  if (!target || !targetType) return null;

  // Access Discovery context
  const discoveryContext = useContext(DiscoveryContext);
  const { user } = useAuth();

  // State for loading assumptions from database when context not available
  const [dbAssumptions, setDbAssumptions] = useState<Assumption[]>([]);
  const [loadingAssumptions, setLoadingAssumptions] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Use discovery context if available
  const activeContext = discoveryContext;
  const hasDiscoveryContext = discoveryContext !== undefined && discoveryContext !== null;
  const {
    assumptions: rawAssumptions = [],
    linkAssumptionToActor: contextLinkToActor,
    unlinkAssumptionFromActor: contextUnlinkFromActor,
    linkAssumptionToConnection: contextLinkToConnection,
    unlinkAssumptionFromConnection: contextUnlinkFromConnection,
  } = activeContext || {
    assumptions: [],
    linkAssumptionToActor: undefined,
    unlinkAssumptionFromActor: undefined,
    linkAssumptionToConnection: undefined,
    unlinkAssumptionFromConnection: undefined,
  };

  // Type assumptions as union to satisfy TypeScript
  const contextAssumptions = rawAssumptions as (Assumption | Assumption)[];

  // Use database assumptions if context not available and we have loaded them
  const assumptions = !hasDiscoveryContext && dbAssumptions.length > 0 ? dbAssumptions : contextAssumptions;

  const { navigateToModuleWithContext } = useGuide();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  // Load Discovery assumptions from database when context not available
  useEffect(() => {
    if (!hasDiscoveryContext && projectId && !loadingAssumptions) {
      setLoadingAssumptions(true);
      supabase
        .from('project_assumptions')
        .select('*')
        .eq('project_id', projectId)
        .not('canvas_area', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(100) // Performance: Limit to prevent loading excessive data
        .then(({ data, error }) => {
          if (!error && data) {
            const assumptions: Assumption[] = data.map(row => ({
              id: row.id,
              type: row.type as AssumptionType,
              description: row.description,
              created: row.created_at || new Date().toISOString(),
              lastUpdated: row.updated_at || new Date().toISOString(),
              status: row.status as AssumptionStatus,
              confidence: (row.confidence || 3) as ConfidenceLevel,
              evidence: row.evidence || [],
              linkedActorIds: (row as any).linked_actor_ids || [],
              linkedConnectionIds: (row as any).linked_connection_ids || [],
              canvasArea: (row as any).canvas_area as CanvasArea,
              validationStage: (row as any).validation_stage || 1,
              importance: ((row as any).importance || 3) as ConfidenceLevel,
              priority: ((row as any).priority || 'medium') as PriorityLevel,
              riskScore: (row as any).risk_score || undefined,
              interviewCount: (row as any).interview_count || 0,
            }));
            setDbAssumptions(assumptions);
          }
          setLoadingAssumptions(false);
        });
    }
  }, [hasDiscoveryContext, projectId, target, loadingAssumptions]);

  // Database-based linking functions (used when context not available)
  const dbLinkAssumptionToActor = async (assumptionId: string, actorId: string) => {
    if (!projectId || !user) return;

    const assumption = dbAssumptions.find(a => a.id === assumptionId);
    if (!assumption) return;

    const linkedActorIds = assumption.linkedActorIds || [];
    if (linkedActorIds.includes(actorId)) return;

    const updated = [...linkedActorIds, actorId];
    await supabase
      .from('project_assumptions')
      .update({ linked_actor_ids: updated } as any)
      .eq('id', assumptionId)
      .eq('project_id', projectId); // Security: Scope to current project

    // Update local state
    setDbAssumptions(prev => prev.map(a =>
      a.id === assumptionId ? { ...a, linkedActorIds: updated } : a
    ));
  };

  const dbUnlinkAssumptionFromActor = async (assumptionId: string, actorId: string) => {
    if (!projectId || !user) return;

    const assumption = dbAssumptions.find(a => a.id === assumptionId);
    if (!assumption) return;

    const updated = (assumption.linkedActorIds || []).filter(id => id !== actorId);
    await supabase
      .from('project_assumptions')
      .update({ linked_actor_ids: updated } as any)
      .eq('id', assumptionId)
      .eq('project_id', projectId); // Security: Scope to current project

    setDbAssumptions(prev => prev.map(a =>
      a.id === assumptionId ? { ...a, linkedActorIds: updated } : a
    ));
  };

  const dbLinkAssumptionToConnection = async (assumptionId: string, connectionId: string) => {
    if (!projectId || !user) return;

    const assumption = dbAssumptions.find(a => a.id === assumptionId);
    if (!assumption) return;

    const linkedConnectionIds = assumption.linkedConnectionIds || [];
    if (linkedConnectionIds.includes(connectionId)) return;

    const updated = [...linkedConnectionIds, connectionId];
    await supabase
      .from('project_assumptions')
      .update({ linked_connection_ids: updated } as any)
      .eq('id', assumptionId)
      .eq('project_id', projectId); // Security: Scope to current project

    setDbAssumptions(prev => prev.map(a =>
      a.id === assumptionId ? { ...a, linkedConnectionIds: updated } : a
    ));
  };

  const dbUnlinkAssumptionFromConnection = async (assumptionId: string, connectionId: string) => {
    if (!projectId || !user) return;

    const assumption = dbAssumptions.find(a => a.id === assumptionId);
    if (!assumption) return;

    const updated = (assumption.linkedConnectionIds || []).filter(id => id !== connectionId);
    await supabase
      .from('project_assumptions')
      .update({ linked_connection_ids: updated } as any)
      .eq('id', assumptionId)
      .eq('project_id', projectId); // Security: Scope to current project

    setDbAssumptions(prev => prev.map(a =>
      a.id === assumptionId ? { ...a, linkedConnectionIds: updated } : a
    ));
  };

  // Wrapper functions that use either context or database methods
  const linkAssumptionToActor = hasDiscoveryContext ? contextLinkToActor : dbLinkAssumptionToActor;
  const unlinkAssumptionFromActor = hasDiscoveryContext ? contextUnlinkFromActor : dbUnlinkAssumptionFromActor;
  const linkAssumptionToConnection = hasDiscoveryContext ? contextLinkToConnection : dbLinkAssumptionToConnection;
  const unlinkAssumptionFromConnection = hasDiscoveryContext ? contextUnlinkFromConnection : dbUnlinkAssumptionFromConnection;

  const isActor = targetType === 'actor';
  const actor = isActor ? (target as Actor) : null;
  const connection = !isActor ? (target as Connection) : null;

  // Fetch actual assumption data (works with both Assumption and Assumption)
  const linkedAssumptionData = target.linkedAssumptions
    ?.map((id) => assumptions.find((a) => a.id === id))
    .filter((a): a is Assumption | Assumption => a !== undefined) || [];

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
  // Always navigate to Discovery when projectId is available
  const handleCreateAssumption = () => {
    if (projectId) {
      // Navigate to Discovery page with URL parameters
      const params = new URLSearchParams({
        action: 'create',
        ...(isActor ? { actorId: actor!.id } : { connectionId: connection!.id })
      });
      navigate(`/project/${projectId}/discovery?${params.toString()}`);
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
      // Navigate to Discovery page with URL parameters
      const params = new URLSearchParams({
        action: 'filter',
        ...(isActor ? { actorId: actor!.id } : { connectionId: connection!.id })
      });
      navigate(`/project/${projectId}/discovery?${params.toString()}`);
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
  const handleLinkAssumption = async (assumptionId: string) => {
    if (isLinking) return; // Prevent double-clicks

    setIsLinking(true);
    try {
      if (isActor) {
        if (linkAssumptionToActor) {
          await linkAssumptionToActor(assumptionId, actor!.id);
        }
      } else {
        if (linkAssumptionToConnection) {
          await linkAssumptionToConnection(assumptionId, connection!.id);
        }
      }
      setShowLinkDropdown(false);
    } catch (error) {
      console.error('Failed to link assumption:', error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkAssumption = async (assumptionId: string) => {
    if (isLinking) return; // Prevent double-clicks

    setIsLinking(true);
    try {
      if (isActor) {
        if (unlinkAssumptionFromActor) {
          await unlinkAssumptionFromActor(assumptionId, actor!.id);
        }
      } else {
        if (unlinkAssumptionFromConnection) {
          await unlinkAssumptionFromConnection(assumptionId, connection!.id);
        }
      }
    } catch (error) {
      console.error('Failed to unlink assumption:', error);
    } finally {
      setIsLinking(false);
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
              <h3 className="font-bold text-lg" style={{ color: INK }}>
                {isActor ? actor!.name : `${CONNECTION_LABELS[connection!.type]} Connection`}
              </h3>
            </div>
            <p className="text-sm" style={{ color: SLATE_FG }}>
              {isActor ? ACTOR_LABELS[actor!.category] : connection!.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: SLATE_FG }}
            onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
                  <p className="text-xs" style={{ color: SLATE_FG }}>
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
              <h4 className="text-sm font-semibold mb-2" style={{ color: SLATE_FG }}>📝 Description</h4>
              <p className="text-sm" style={{ color: SLATE_FG }}>{target.description}</p>
            </div>
          )}

          {/* Linked Assumptions */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: SLATE_FG }}>
              <span>🔗 Linked Assumptions</span>
              {hasAssumptions && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskColors.bg} ${riskColors.text}`}>
                  {target.linkedAssumptions!.length}
                </span>
              )}
            </h4>
            {!hasAssumptions ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ background: HAIR, borderColor: STONE }}>
                <p className="text-sm" style={{ color: MUTED }}>No assumptions linked yet</p>
                {unlinkedAssumptions.length > 0 ? (
                  <button
                    onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                    className="mt-2 text-xs font-medium"
                    style={{ color: TEAL }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0d5c56'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = TEAL; }}
                  >
                    + Link Assumption
                  </button>
                ) : (
                  <p className="mt-2 text-xs italic" style={{ color: MUTED }}>
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
                      className="border rounded p-3 transition-colors relative group"
                      style={{ background: HAIR, borderColor: TAN }}
                    >
                      <button
                        onClick={() => handleUnlinkAssumption(assumption.id)}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full border transition-colors opacity-0 group-hover:opacity-100"
                        style={{ borderColor: STONE, color: SLATE_FG }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = ERROR_SOFT; e.currentTarget.style.borderColor = ERROR_LINE; e.currentTarget.style.color = ERROR_FG; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = STONE; e.currentTarget.style.color = SLATE_FG; }}
                        title="Unlink assumption"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex items-start gap-2 mb-2 pr-6">
                        <span className="text-sm">{statusStyle.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2" style={{ color: SLATE_FG }}>
                            {assumption.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="px-2 py-0.5 text-xs rounded font-medium capitalize"
                              style={{ background: statusStyle.bg, color: statusStyle.text }}
                            >
                              {assumption.status}
                            </span>
                            <span className="text-xs" style={{ color: MUTED }}>
                              Confidence: {assumption.confidence}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      {assumption.evidence.length > 0 && (
                        <div className="ml-6 text-xs" style={{ color: SLATE_FG }}>
                          <span className="font-medium">Evidence:</span> {assumption.evidence.length} item{assumption.evidence.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
                {unlinkedAssumptions.length > 0 && (
                  <button
                    onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                    className="w-full text-xs font-medium py-2"
                    style={{ color: TEAL }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0d5c56'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = TEAL; }}
                  >
                    + Link Another
                  </button>
                )}
              </div>
            )}

            {/* Link Dropdown */}
            {showLinkDropdown && unlinkedAssumptions.length > 0 && (
              <div className="mt-2 bg-white border-2 rounded-lg p-3 max-h-64 overflow-y-auto" style={{ borderColor: TEAL_LITE }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: SLATE_FG }}>Select an assumption to link:</p>
                  <button
                    onClick={() => setShowLinkDropdown(false)}
                    style={{ color: SLATE_FG }}
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
                        className="w-full text-left p-2 rounded transition-colors border border-transparent"
                        onMouseEnter={(e) => { e.currentTarget.style.background = TEAL_LITE; e.currentTarget.style.borderColor = TEAL; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs">{statusStyle.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs line-clamp-1" style={{ color: SLATE_FG }}>
                              {assumption.description}
                            </p>
                            <span
                              className="text-xs px-1 py-0.5 rounded capitalize"
                              style={{ background: statusStyle.bg, color: statusStyle.text }}
                            >
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
          <div className="pt-4 border-t" style={{ borderColor: TAN }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: SLATE_FG }}>⚡ Quick Actions</h4>
            <div className="space-y-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  style={{ background: TEAL_LITE, color: TEAL }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#c9e9e2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = TEAL_LITE; }}
                >
                  <span>✏️</span> Edit Details
                </button>
              )}

              <button
                onClick={handleCreateAssumption}
                className="w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                style={{ background: TEAL_LITE, color: TEAL }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#c9e9e2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = TEAL_LITE; }}
              >
                <span>➕</span> Create Assumption
              </button>

              {hasAssumptions && (
                <button
                  onClick={handleViewInDiscovery}
                  className="w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  style={{ background: TEAL_LITE, color: TEAL }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#c9e9e2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = TEAL_LITE; }}
                >
                  <span>📊</span> View in Discovery
                </button>
              )}

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  style={{ background: ERROR_SOFT, color: ERROR_FG }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(190,18,60,0.16)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ERROR_SOFT; }}
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
