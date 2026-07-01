import { useRef, useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import { ActorCategory, Actor, Connection, EvidenceSource, ACTOR_LABELS } from '../../types/visualSectorMap';
import { ActorNode } from './ActorNode';
import { ActorTypeChip } from './ActorTypeChip';
import { Inspector } from './Inspector';
import { PK_SOURCES, pkTier } from '../../features/v3/lib/layers';
import { TEAL, INK, SLATE_FG, MUTED, STONE, FONT_MONO } from '../../features/v3/lib/tokens';

interface VisualCanvasProps {
  selectedCategory: ActorCategory;
  showConnections?: boolean;
  readOnly?: boolean;
  visibleCategories?: Set<ActorCategory>; // Phase 2 Part 3: Filter actors by category
}

export const VisualCanvas = ({
  selectedCategory,
  showConnections = false,
  readOnly = false,
  visibleCategories,
}: VisualCanvasProps) => {
  const { actors, connections, activeLayers, addActor, deleteActor, deleteConnection } = useVisualSectorMap();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nextActorName, setNextActorName] = useState<string | null>(null);
  const [nameInputPosition, setNameInputPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [inspectorTarget, setInspectorTarget] = useState<Actor | Connection | null>(null);
  const [inspectorType, setInspectorType] = useState<'actor' | 'connection' | null>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || nextActorName !== null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Show name input at click position
    setNameInputPosition({ x, y });
  };

  const handleNameSubmit = (name: string, source: EvidenceSource | null) => {
    if (!nameInputPosition || !name.trim()) {
      setNameInputPosition(null);
      setNextActorName(null);
      return;
    }

    // Add actor at the clicked position
    addActor(name.trim(), selectedCategory, nameInputPosition, source);

    // Reset
    setNameInputPosition(null);
    setNextActorName(null);
  };

  const handleNameCancel = () => {
    setNameInputPosition(null);
    setNextActorName(null);
  };

  const handleActorClick = (actor: Actor) => {
    setInspectorTarget(actor);
    setInspectorType('actor');
  };

  const handleInspectorClose = () => {
    setInspectorTarget(null);
    setInspectorType(null);
  };

  const handleInspectorDelete = () => {
    if (!inspectorTarget) return;

    if (inspectorType === 'actor') {
      deleteActor(inspectorTarget.id);
    } else if (inspectorType === 'connection') {
      deleteConnection(inspectorTarget.id);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(to bottom right, #fbfaf7, #f4f1ea)` }}>
      {/* Instructions overlay */}
      {actors.length === 0 && !readOnly && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 px-8 py-6 rounded-lg shadow-lg border-2 flex items-center gap-3 max-w-md" style={{ borderColor: TEAL }}>
            <ActorTypeChip category={selectedCategory} size={32} />
            <p className="text-base font-medium text-left" style={{ color: SLATE_FG }}>
              Click anywhere on the canvas to place a {ACTOR_LABELS[selectedCategory].toLowerCase()} actor —
              then tell me how you know they belong here.
            </p>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`w-full h-full relative ${!readOnly ? 'cursor-crosshair' : ''}`}
      >
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={STONE}
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connections Layer (if enabled) */}
        {showConnections && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections
              .filter((conn) => !conn.layer || activeLayers.includes(conn.layer))
              .map((conn) => {
                const sourceActor = actors.find((a) => a.id === conn.sourceActorId);
                const targetActor = actors.find((a) => a.id === conn.targetActorId);

                if (!sourceActor || !targetActor) return null;

                return (
                  <g key={conn.id}>
                    <line
                      x1={sourceActor.position.x}
                      y1={sourceActor.position.y}
                      x2={targetActor.position.x}
                      y2={targetActor.position.y}
                      stroke={TEAL}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill={TEAL} />
              </marker>
            </defs>
          </svg>
        )}

        {/* Actors Layer */}
        {actors
          .filter((actor) => !visibleCategories || visibleCategories.has(actor.category))
          .map((actor) => (
            <ActorNode
              key={actor.id}
              actor={actor}
              readOnly={readOnly}
              onClick={() => handleActorClick(actor)}
            />
          ))}

        {/* Name Input Dialog */}
        {nameInputPosition && !readOnly && (
          <div
            className="absolute z-50"
            style={{
              left: nameInputPosition.x,
              top: nameInputPosition.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <NameInputDialog
              category={selectedCategory}
              onSubmit={handleNameSubmit}
              onCancel={handleNameCancel}
            />
          </div>
        )}
      </div>

      {/* Inspector Drawer */}
      <Inspector
        target={inspectorTarget}
        targetType={inspectorType}
        onClose={handleInspectorClose}
        onDelete={handleInspectorDelete}
      />
    </div>
  );
};

// Name Input Dialog Component
interface NameInputDialogProps {
  category: ActorCategory;
  onSubmit: (name: string, source: EvidenceSource | null) => void;
  onCancel: () => void;
}

function NameInputDialog({ category, onSubmit, onCancel }: NameInputDialogProps) {
  const [name, setName] = useState('');
  const [source, setSource] = useState<EvidenceSource | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, source);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-xl border-2 p-4"
      style={{ borderColor: TEAL }}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="block text-sm font-medium mb-2" style={{ color: SLATE_FG }}>
        Actor name:
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`e.g., ${
          category === 'customer'
            ? 'Seniors'
            : category === 'provider'
            ? 'Hospital'
            : category === 'regulator'
            ? 'Health Dept'
            : category === 'funder'
            ? 'Medicare'
            : category === 'partner'
            ? 'Pharmacy'
            : 'Doctors'
        }`}
        className="w-64 px-3 py-2 border-2 rounded-lg focus:outline-none mb-3"
        style={{ borderColor: STONE, color: INK }}
        onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
        autoFocus
      />

      <div className="mb-3">
        <p style={{
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: MUTED, marginBottom: 6,
        }}>How you'll know</p>
        <div className="flex flex-wrap gap-1.5">
          {PK_SOURCES.map((s) => {
            const on = s.id === source;
            const tier = pkTier('sectorMapping', s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(on ? null : s.id)}
                title={`${s.label} — tier ${tier}`}
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={on
                  ? { background: TEAL, color: '#fff' }
                  : { background: '#f4f1ea', color: SLATE_FG, border: `1px solid ${STONE}` }}
              >
                {s.short}
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-1.5" style={{ color: MUTED }}>
          A logical guess earns a low tier — a named contact earns more.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 px-4 py-2 rounded-lg font-medium disabled:cursor-not-allowed"
          style={name.trim() ? { background: TEAL, color: '#fff' } : { background: '#e2e8f0', color: MUTED }}
          onMouseEnter={(e) => { if (name.trim()) e.currentTarget.style.background = '#0d5c56'; }}
          onMouseLeave={(e) => { if (name.trim()) e.currentTarget.style.background = TEAL; }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white border-2 rounded-lg font-medium"
          style={{ borderColor: STONE, color: SLATE_FG }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
