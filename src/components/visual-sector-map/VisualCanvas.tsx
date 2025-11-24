import { useRef, useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import { ActorCategory, Actor, Connection } from '../../types/visualSectorMap';
import { ActorNode } from './ActorNode';
import { Inspector } from './Inspector';

interface VisualCanvasProps {
  selectedCategory: ActorCategory;
  showConnections?: boolean;
  readOnly?: boolean;
}

export const VisualCanvas = ({
  selectedCategory,
  showConnections = false,
  readOnly = false,
}: VisualCanvasProps) => {
  const { actors, connections, activeLayers, addActor } = useVisualSectorMap();
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

  const handleNameSubmit = (name: string) => {
    if (!nameInputPosition || !name.trim()) {
      setNameInputPosition(null);
      setNextActorName(null);
      return;
    }

    // Add actor at the clicked position
    addActor(name.trim(), selectedCategory, nameInputPosition);

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

  const handleConnectionClick = (connection: Connection) => {
    setInspectorTarget(connection);
    setInspectorType('connection');
  };

  const handleInspectorClose = () => {
    setInspectorTarget(null);
    setInspectorType(null);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Instructions overlay */}
      {actors.length === 0 && !readOnly && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 px-8 py-6 rounded-lg shadow-lg border-2 border-blue-300">
            <p className="text-lg font-medium text-gray-700 text-center">
              👆 Select an actor type above, then click anywhere on the canvas to place it
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
                stroke="gray"
                strokeWidth="0.5"
                opacity="0.1"
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
                      stroke="#6366f1"
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
                <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
              </marker>
            </defs>
          </svg>
        )}

        {/* Actors Layer */}
        {actors.map((actor) => (
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
      />
    </div>
  );
};

// Name Input Dialog Component
interface NameInputDialogProps {
  category: ActorCategory;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

function NameInputDialog({ category, onSubmit, onCancel }: NameInputDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-xl border-2 border-blue-400 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
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
        className="w-64 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
