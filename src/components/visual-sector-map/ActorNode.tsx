import { useState, useRef } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import {
  Actor,
  ACTOR_COLORS,
  ACTOR_ICONS,
  ActorCategory,
  ACTOR_LABELS,
  getRiskLevel,
  RISK_COLORS,
  calculateRiskScore,
} from '../../types/visualSectorMap';
import { TEAL, SLATE_FG, MUTED, TAN, ERROR_FG } from '../../features/v3/lib/tokens';

interface ActorNodeProps {
  actor: Actor;
  readOnly?: boolean;
  onClick?: () => void;
}

export const ActorNode = ({ actor, readOnly = false, onClick }: ActorNodeProps) => {
  const { updateActor, moveActor, deleteActor } = useVisualSectorMap();
  const { assumptions } = useDiscovery();
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const colors = ACTOR_COLORS[actor.category];

  // Fetch and calculate real-time risk
  const linkedAssumptionData = actor.linkedAssumptions
    ?.map(id => assumptions.find(a => a.id === id))
    .filter(a => a !== undefined) || [];

  const hasAssumptions = linkedAssumptionData.length > 0;

  const calculatedRiskScore = hasAssumptions
    ? calculateRiskScore(linkedAssumptionData.map(a => ({
        status: a.status,
        confidence: a.confidence
      })))
    : (actor.riskScore || 0);

  const riskLevel = getRiskLevel(calculatedRiskScore);
  const riskColors = RISK_COLORS[riskLevel];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || isEditing) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - actor.position.x,
      y: e.clientY - actor.position.y,
    };

    // Add global mouse move and mouse up listeners
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      moveActor(actor.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete actor "${actor.name}"?`)) {
      deleteActor(actor.id);
    }
  };

  const handleRename = (newName: string) => {
    if (newName.trim()) {
      updateActor(actor.id, { name: newName.trim() });
    }
    setIsEditing(false);
  };

  const handleChangeCategory = (newCategory: ActorCategory) => {
    updateActor(actor.id, { category: newCategory });
    setShowMenu(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging || isEditing || showMenu || readOnly) return;
    e.stopPropagation();
    onClick?.();
  };

  return (
    <>
      {/* Actor Node */}
      <div
        ref={nodeRef}
        className={`absolute ${!readOnly ? 'cursor-move' : ''} ${
          isDragging ? 'opacity-70 scale-105' : ''
        }`}
        style={{
          left: actor.position.x,
          top: actor.position.y,
          transform: 'translate(-50%, -50%)',
          zIndex: isDragging ? 50 : 10,
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => {
          if (!readOnly) {
            e.preventDefault();
            setShowMenu(!showMenu);
          }
        }}
      >
        {/* Risk Halo - Phase 2: Visual indicator of linked assumption risk */}
        {riskLevel !== 'none' && (
          <div
            className={`absolute inset-0 rounded-lg animate-pulse`}
            style={{
              padding: '4px',
              background: `radial-gradient(circle, transparent 60%, ${
                riskLevel === 'high'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : riskLevel === 'medium'
                  ? 'rgba(234, 179, 8, 0.3)'
                  : 'rgba(34, 197, 94, 0.3)'
              } 100%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Actor Card */}
        <div
          className={`relative ${colors.bg} ${riskLevel !== 'none' ? riskColors.border : colors.border} border-2 rounded-lg shadow-lg hover:shadow-xl transition-all p-3 min-w-[120px] max-w-[200px] ${riskColors.glow} ${onClick ? 'cursor-pointer' : ''}`}
          onClick={handleCardClick}
        >
          {/* Assumption Badge */}
          {hasAssumptions && (
            <div
              className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${riskColors.bg} ${riskColors.border} border-2 flex items-center justify-center text-xs font-bold ${riskColors.text}`}
              title={`${actor.linkedAssumptions?.length} linked assumption${actor.linkedAssumptions?.length !== 1 ? 's' : ''}`}
            >
              {actor.linkedAssumptions?.length}
            </div>
          )}

          <div className="flex items-start gap-2">
            <span className="text-2xl flex-shrink-0">{ACTOR_ICONS[actor.category]}</span>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  defaultValue={actor.name}
                  onBlur={(e) => handleRename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename(e.currentTarget.value);
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                    }
                  }}
                  className={`w-full px-1 py-0.5 border-2 rounded focus:outline-none ${colors.text} font-semibold bg-white`}
                  style={{ borderColor: TEAL }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p
                  className={`${colors.text} font-semibold text-sm leading-tight`}
                  onDoubleClick={() => !readOnly && setIsEditing(true)}
                >
                  {actor.name}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: SLATE_FG }}>
                {ACTOR_LABELS[actor.category]}
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="flex-shrink-0"
                style={{ color: MUTED }}
                onMouseEnter={(e) => { e.currentTarget.style.color = SLATE_FG; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
              >
                ⋮
              </button>
            )}
          </div>
        </div>

        {/* Context Menu */}
        {showMenu && !readOnly && (
          <div
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border-2 py-1 z-50 min-w-[180px]"
            style={{ borderColor: TAN }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsEditing(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              ✏️ Rename
            </button>

            <div className="my-1" style={{ borderTop: `1px solid ${TAN}` }} />

            <p className="px-4 py-1 text-xs font-medium" style={{ color: MUTED }}>Change type:</p>

            {(['customer', 'provider', 'regulator', 'funder', 'partner', 'influencer'] as ActorCategory[]).map(
              (category) => (
                <button
                  key={category}
                  onClick={() => handleChangeCategory(category)}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2"
                  style={actor.category === category ? { background: '#e6f4f1', fontWeight: 500 } : undefined}
                  onMouseEnter={(e) => { if (actor.category !== category) e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { if (actor.category !== category) e.currentTarget.style.background = 'transparent'; }}
                >
                  {ACTOR_ICONS[category]} {ACTOR_LABELS[category]}
                </button>
              )
            )}

            <div className="my-1" style={{ borderTop: `1px solid ${TAN}` }} />

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium flex items-center gap-2"
              style={{ color: ERROR_FG }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(190,18,60,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};
