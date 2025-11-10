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
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Connection Controls */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Step 3: Connect Actors
          </h1>
          <p className="text-sm text-gray-600">
            Draw relationships between actors to map value flows, information exchange, and regulatory connections.
          </p>
        </div>

        {/* Connection Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Source Actor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Select source actor:
            </label>
            <select
              value={selectedSourceId || ''}
              onChange={(e) => setSelectedSourceId(e.target.value || null)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Select target actor:
            </label>
            <select
              value={selectedTargetId || ''}
              onChange={(e) => setSelectedTargetId(e.target.value || null)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Connection type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {connectionTypes.map((type) => {
                const isSelected = connectionType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setConnectionType(type)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                      isSelected
                        ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {CONNECTION_ICONS[type]} {CONNECTION_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4. Layer:
            </label>
            <div className="space-y-1">
              {layers.map((l) => {
                const isSelected = layer === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLayer(l)}
                    className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all border-2 text-left ${
                      isSelected
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {LAYER_LABELS[l]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              5. Describe the connection:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Seniors pay hospitals for healthcare services"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddConnection}
            disabled={!canAddConnection}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              canAddConnection
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Connection
          </button>

          {/* Existing Connections List */}
          {connections.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Connections ({connections.length}):
              </h3>
              <div className="space-y-2">
                {connections.map((conn) => {
                  const source = actors.find((a) => a.id === conn.sourceActorId);
                  const target = actors.find((a) => a.id === conn.targetActorId);
                  return (
                    <div
                      key={conn.id}
                      className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                    >
                      <p className="font-medium">
                        {source?.name} → {target?.name}
                      </p>
                      <p className="text-gray-600">
                        {CONNECTION_ICONS[conn.type]} {conn.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <button
            onClick={onBack}
            className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            ← Back to Actors
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              canContinue
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
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
