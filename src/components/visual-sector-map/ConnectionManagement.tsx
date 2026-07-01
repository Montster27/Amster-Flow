import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  ConnectionType,
  CONNECTION_ICONS,
  CONNECTION_LABELS,
  LayerType,
  LAYER_LABELS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';
import {
  TEAL, TEAL_LITE, INK, SLATE_FG, MUTED, TAN, STONE, HAIR, PAPER,
} from '../../features/v3/lib/tokens';

interface ConnectionManagementProps {
  onContinue: () => void;
  onBack: () => void;
}

export const ConnectionManagement = ({ onContinue, onBack }: ConnectionManagementProps) => {
  const { actors, connections, addConnection } = useVisualSectorMap();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType>('money');
  const [description, setDescription] = useState('');
  const [layer, setLayer] = useState<LayerType>('value');

  const connectionTypes: ConnectionType[] = ['money', 'information', 'regulation', 'support'];
  const layers: LayerType[] = ['value', 'information', 'regulation'];

  const canAddConnection =
    selectedSourceId && selectedTargetId && selectedSourceId !== selectedTargetId && description.trim();

  const handleAddConnection = () => {
    if (!canAddConnection) return;

    addConnection(selectedSourceId, selectedTargetId, connectionType, description.trim(), layer);

    // Reset form
    setSelectedSourceId(null);
    setSelectedTargetId(null);
    setDescription('');
  };

  const canContinue = connections.length >= 1; // Need at least 1 connection

  return (
    <div className="h-screen flex" style={{ background: PAPER }}>
      {/* Left Panel - Connection Controls */}
      <div className="w-96 bg-white border-r flex flex-col relative" style={{ borderColor: TAN }}>
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: TAN }}>
          <h1 className="text-xl font-bold mb-1 flex items-center gap-2" style={{ color: INK }}>
            <span>🔗</span> Connect Actors
          </h1>
          <p className="text-xs" style={{ color: SLATE_FG }}>Map flows and relationships</p>
        </div>

        {/* Connection Form - Add padding bottom for fixed footer */}
        <div className="flex-1 overflow-y-auto px-6 py-3 pb-40 space-y-2">
          {/* Source Actor */}
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>①</span> From
            </label>
            <select
              value={selectedSourceId || ''}
              onChange={(e) => setSelectedSourceId(e.target.value || null)}
              className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
            >
              <option value="">-- Choose source --</option>
              {actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Actor */}
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>②</span> To
            </label>
            <select
              value={selectedTargetId || ''}
              onChange={(e) => setSelectedTargetId(e.target.value || null)}
              className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
            >
              <option value="">-- Choose target --</option>
              {actors
                .filter((a) => a.id !== selectedSourceId)
                .map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Connection Type */}
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>③</span> Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {connectionTypes.map((type) => {
                const isSelected = connectionType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setConnectionType(type)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all border-2 ${
                      isSelected ? 'shadow-md' : 'bg-white'
                    }`}
                    style={isSelected
                      ? { background: TEAL_LITE, borderColor: TEAL, color: TEAL }
                      : { borderColor: STONE, color: SLATE_FG }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = MUTED; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = STONE; }}
                  >
                    {CONNECTION_ICONS[type]} {CONNECTION_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layer */}
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>④</span> Layer
            </label>
            <div className="space-y-1">
              {layers.map((l) => {
                const isSelected = layer === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLayer(l)}
                    className={`w-full px-3 py-1.5 rounded-lg font-medium text-xs transition-all border-2 text-left ${
                      isSelected ? 'shadow-md' : 'bg-white'
                    }`}
                    style={isSelected
                      ? { background: TEAL_LITE, borderColor: TEAL, color: TEAL }
                      : { borderColor: STONE, color: SLATE_FG }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = MUTED; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = STONE; }}
                  >
                    {LAYER_LABELS[l]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: SLATE_FG }}>
              <span>⑤</span> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Seniors pay hospitals for healthcare services"
              className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm"
              style={{ borderColor: STONE, color: INK }}
              onFocus={(e) => { e.currentTarget.style.borderColor = TEAL; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = STONE; }}
              rows={2}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddConnection}
            disabled={!canAddConnection}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              canAddConnection ? 'text-white shadow-lg hover:shadow-xl' : 'cursor-not-allowed'
            }`}
            style={canAddConnection ? { background: TEAL } : { background: '#e2e8f0', color: MUTED }}
            onMouseEnter={(e) => { if (canAddConnection) e.currentTarget.style.background = '#0d5c56'; }}
            onMouseLeave={(e) => { if (canAddConnection) e.currentTarget.style.background = TEAL; }}
          >
            Add Connection
          </button>

          {/* Existing Connections List */}
          {connections.length > 0 && (
            <div className="pt-2 border-t" style={{ borderColor: TAN }}>
              <h3 className="text-xs font-medium mb-1" style={{ color: SLATE_FG }}>
                Connections ({connections.length}):
              </h3>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {connections.map((conn) => {
                  const source = actors.find((a) => a.id === conn.sourceActorId);
                  const target = actors.find((a) => a.id === conn.targetActorId);
                  return (
                    <div
                      key={conn.id}
                      className="p-2 rounded border text-xs"
                      style={{ background: HAIR, borderColor: TAN }}
                    >
                      <p className="font-medium" style={{ color: INK }}>
                        {source?.name} → {target?.name}
                      </p>
                      <p style={{ color: SLATE_FG }}>
                        {CONNECTION_ICONS[conn.type]} {conn.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white px-6 py-3 border-t space-y-2 shadow-lg" style={{ borderColor: TAN }}>
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium text-sm bg-white border-2 transition-all"
            style={{ color: SLATE_FG, borderColor: STONE }}
            onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            ← Back to Actors
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              canContinue ? 'text-white shadow-lg hover:shadow-xl' : 'cursor-not-allowed'
            }`}
            style={canContinue ? { background: TEAL } : { background: '#e2e8f0', color: MUTED }}
            onMouseEnter={(e) => { if (canContinue) e.currentTarget.style.background = '#0d5c56'; }}
            onMouseLeave={(e) => { if (canContinue) e.currentTarget.style.background = TEAL; }}
          >
            {canContinue ? 'Continue to Annotations →' : 'Add connections to continue'}
          </button>
        </div>
      </div>

      {/* Right Panel - Visual Canvas */}
      <div className="flex-1 overflow-hidden">
        <VisualCanvas
          selectedCategory="customer"
          showConnections={true}
          readOnly={true}
        />
      </div>
    </div>
  );
};
