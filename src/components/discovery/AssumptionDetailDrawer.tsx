import { useState } from 'react';
import { X } from 'lucide-react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import { Assumption, AssumptionStatus, ConfidenceLevel, AssumptionType } from '../../types/discovery';
import { ACTOR_ICONS, CONNECTION_ICONS } from '../../types/visualSectorMap';

interface AssumptionDetailDrawerProps {
  assumption: Assumption | null;
  onClose: () => void;
}

// Status badge styles
const STATUS_STYLES: Record<AssumptionStatus, { bg: string; text: string; icon: string }> = {
  untested: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '❓' },
  testing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔬' },
  validated: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
  invalidated: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
};

export const AssumptionDetailDrawer = ({ assumption, onClose }: AssumptionDetailDrawerProps) => {
  const {
    updateAssumption,
    updateAssumptionStatus,
    updateAssumptionConfidence,
    addEvidenceToAssumption,
    deleteAssumption,
  } = useDiscovery();

  const { actors, connections } = useVisualSectorMap();

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [newEvidence, setNewEvidence] = useState('');
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');

  if (!assumption) return null;

  const statusStyle = STATUS_STYLES[assumption.status];

  // Get linked actors and connections
  const linkedActors = actors.filter((a) => assumption.linkedActorIds?.includes(a.id));
  const linkedConnections = connections.filter((c) =>
    assumption.linkedConnectionIds?.includes(c.id)
  );

  const handleEdit = () => {
    setEditedDescription(assumption.description);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedDescription.trim()) {
      updateAssumption(assumption.id, { description: editedDescription.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDescription('');
  };

  const handleAddEvidence = () => {
    if (newEvidence.trim()) {
      addEvidenceToAssumption(assumption.id, newEvidence.trim());
      setNewEvidence('');
      setIsAddingEvidence(false);
    }
  };

  const handleSaveNotes = () => {
    if (validationNotes.trim()) {
      updateAssumption(assumption.id, { validationNotes: validationNotes.trim() });
      setValidationNotes('');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this assumption? This action cannot be undone.')) {
      deleteAssumption(assumption.id);
      onClose();
    }
  };

  const handleTypeChange = (newType: AssumptionType) => {
    updateAssumption(assumption.id, { type: newType });
  };

  const getConfidenceLabel = (level: ConfidenceLevel) => {
    const labels = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
    return labels[level];
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{statusStyle.icon}</span>
              <h3 className="font-bold text-xl text-gray-900">Assumption Details</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 ${statusStyle.bg} ${statusStyle.text} text-xs rounded font-medium capitalize`}>
                {assumption.status}
              </span>
              <span className="text-xs text-gray-600">
                Updated {new Date(assumption.lastUpdated).toLocaleDateString()}
              </span>
            </div>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              value={assumption.type}
              onChange={(e) => handleTypeChange(e.target.value as AssumptionType)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="customer">Customer</option>
              <option value="problem">Problem</option>
              <option value="solution">Solution</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full h-32 px-3 py-2 border-2 border-blue-400 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {assumption.description}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={assumption.status}
              onChange={(e) => updateAssumptionStatus(assumption.id, e.target.value as AssumptionStatus)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="untested">Untested</option>
              <option value="testing">Testing</option>
              <option value="validated">Validated</option>
              <option value="invalidated">Invalidated</option>
            </select>
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confidence: {getConfidenceLabel(assumption.confidence)}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={assumption.confidence}
              onChange={(e) =>
                updateAssumptionConfidence(assumption.id, Number(e.target.value) as ConfidenceLevel)
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Low</span>
              <span>Medium</span>
              <span>Very High</span>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Evidence ({assumption.evidence.length})
              </label>
              {!isAddingEvidence && (
                <button
                  onClick={() => setIsAddingEvidence(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Evidence
                </button>
              )}
            </div>

            {isAddingEvidence && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <textarea
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  placeholder="Describe the evidence..."
                  className="w-full h-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEvidence}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingEvidence(false);
                      setNewEvidence('');
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {assumption.evidence.length === 0 ? (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg text-center">
                No evidence collected yet
              </p>
            ) : (
              <div className="space-y-2">
                {assumption.evidence.map((evidence, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                  >
                    <p className="text-sm text-gray-700">{evidence}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Validation Notes
            </label>
            {assumption.validationNotes ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-gray-700">{assumption.validationNotes}</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <textarea
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder="Add validation notes..."
                className="w-full h-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
              <button
                onClick={handleSaveNotes}
                disabled={!validationNotes.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Notes
              </button>
            </div>
          </div>

          {/* Linked System Structure Elements */}
          {(linkedActors.length > 0 || linkedConnections.length > 0) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔗 Linked to System Structure
              </label>
              <div className="space-y-2">
                {linkedActors.map((actor) => (
                  <div
                    key={actor.id}
                    className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <span className="text-lg">{ACTOR_ICONS[actor.category]}</span>
                    <span className="text-sm font-medium text-gray-700">{actor.name}</span>
                  </div>
                ))}
                {linkedConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <span className="text-lg">{CONNECTION_ICONS[conn.type]}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {conn.description || 'Connection'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Created:</strong> {new Date(assumption.created).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Last Updated:</strong> {new Date(assumption.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🗑️</span> Delete Assumption
          </button>
        </div>
      </div>
    </>
  );
};
