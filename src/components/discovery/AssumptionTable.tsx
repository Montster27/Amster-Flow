import { useState, useEffect, useContext } from 'react';
import { captureException } from '../../lib/sentry';

import { useDiscovery } from '../../contexts/DiscoveryContext';
import { VisualSectorMapContext } from '../../contexts/VisualSectorMapContext';
import type { NavigationContext } from '../../contexts/GuideContext';

import { AssumptionType, ConfidenceLevel, AssumptionStatus } from '../../types/discovery';


interface AssumptionForm {
  type: AssumptionType;
  description: string;
}

interface AssumptionTableProps {
  navigationContext?: NavigationContext | null;
  onClearContext?: () => void;
}

export const AssumptionTable = ({ navigationContext, onClearContext }: AssumptionTableProps) => {
  const {
    assumptions,
    addAssumption,
    updateAssumption,
    deleteAssumption,
    updateAssumptionConfidence,
    updateAssumptionStatus,
    linkAssumptionToActor,
    linkAssumptionToConnection,
  } = useDiscovery();

  // Safely access Visual Sector Map context (may not be available in all contexts)
  const visualSectorMapContext = useContext(VisualSectorMapContext);
  const actors = visualSectorMapContext?.actors || [];
  const connections = visualSectorMapContext?.connections || [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssumptionForm>({
    type: 'customer',
    description: '',
  });
  const [templates, setTemplates] = useState<any>(null);

  // Load assumption templates
  useEffect(() => {
    fetch('/assumptions.json')
      .then((res) => res.json())
      .then((data) => setTemplates(data.assumptionTemplates))
      .catch((err) => { const error = err instanceof Error ? err : new Error('Failed to load templates'); captureException(error, { extra: { context: 'AssumptionTable load' } }); });
  }, []);

  // Phase 2: Handle navigation context from System Structure
  useEffect(() => {
    if (navigationContext?.action === 'create') {
      setShowForm(true);
    }
  }, [navigationContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    if (editingId) {
      updateAssumption(editingId, { description: formData.description, type: formData.type });
      setEditingId(null);
    } else {
      addAssumption(formData.type, formData.description);

      // Phase 2: Auto-link to actor/connection from navigation context
      if (navigationContext) {
        // Get the most recently added assumption (the one we just created)
        const newAssumptionId = assumptions.length > 0 ? assumptions[assumptions.length - 1].id : null;

        if (newAssumptionId) {
          if (navigationContext.actorId) {
            // Link to actor after a brief delay to ensure the assumption is in state
            setTimeout(() => {
              linkAssumptionToActor(newAssumptionId, navigationContext.actorId!);
            }, 100);
          } else if (navigationContext.connectionId) {
            setTimeout(() => {
              linkAssumptionToConnection(newAssumptionId, navigationContext.connectionId!);
            }, 100);
          }
        }

        onClearContext?.();
      }
    }

    setFormData({ type: 'customer', description: '' });
    setShowForm(false);
  };

  const handleEdit = (id: string, type: AssumptionType, description: string) => {
    setEditingId(id);
    setFormData({ type, description });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ type: 'customer', description: '' });
  };

  const getStatusColor = (status: AssumptionStatus) => {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'invalidated':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceLabel = (level: ConfidenceLevel) => {
    const labels = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
    return labels[level];
  };

  // Phase 2: Filter assumptions based on navigation context
  const filteredAssumptions = (() => {
    if (!navigationContext || navigationContext.action !== 'filter') {
      return assumptions;
    }

    if (navigationContext.actorId) {
      return assumptions.filter(a => a.linkedActorIds?.includes(navigationContext.actorId!));
    }

    if (navigationContext.connectionId) {
      return assumptions.filter(a => a.linkedConnectionIds?.includes(navigationContext.connectionId!));
    }

    return assumptions;
  })();

  // Get actor/connection name for filter chip
  const getContextName = () => {
    if (!navigationContext) return null;

    if (navigationContext.actorId) {
      const actor = actors.find(a => a.id === navigationContext.actorId);
      return actor?.name;
    }

    if (navigationContext.connectionId) {
      const conn = connections.find(c => c.id === navigationContext.connectionId);
      return conn?.description || 'Connection';
    }

    return null;
  };

  const contextName = getContextName();

  return (
    <div>
      {/* Phase 2: Filter chip showing context */}
      {navigationContext && contextName && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Filtered by:</span>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            <span>{contextName}</span>
            <button
              onClick={onClearContext}
              className="hover:bg-purple-200 rounded-full p-0.5"
              aria-label="Clear filter"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assumptions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track what you believe to be true and test it with real customers
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            aria-label="Add new assumption"
          >
            + Add Assumption
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border-2 border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingId ? 'Edit Assumption' : 'New Assumption'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AssumptionType })}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="customer">Customer</option>
                <option value="problem">Problem</option>
                <option value="solution">Solution</option>
              </select>
            </div>

            {/* Template Prompts */}
            {templates && templates[formData.type] && !editingId && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  💡 {templates[formData.type].description}
                </p>
                <p className="text-xs text-gray-600 mb-2">Try these prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {templates[formData.type].prompts.map((prompt: string, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, description: prompt })}
                      className="text-xs px-3 py-1 bg-white border border-blue-300 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assumption Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you believe to be true..."
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assumptions List */}
      {filteredAssumptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">
            {navigationContext ? 'No assumptions linked to this item yet' : 'No assumptions yet'}
          </p>
          <p className="text-gray-400 text-sm">
            {navigationContext
              ? 'Create an assumption to link it to this actor/connection'
              : 'Start by adding your key assumptions about customers, problems, or your solution'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssumptions.map((assumption) => (
            <div
              key={assumption.id}
              className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {assumption.type.charAt(0).toUpperCase() + assumption.type.slice(1)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 border rounded ${getStatusColor(assumption.status)}`}>
                      {assumption.status.charAt(0).toUpperCase() + assumption.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-3">{assumption.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <label className="text-gray-600">Confidence:</label>
                      <select
                        value={assumption.confidence}
                        onChange={(e) => updateAssumptionConfidence(assumption.id, Number(e.target.value) as ConfidenceLevel)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <option key={level} value={level}>
                            {getConfidenceLabel(level as ConfidenceLevel)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-gray-600">Status:</label>
                      <select
                        value={assumption.status}
                        onChange={(e) => updateAssumptionStatus(assumption.id, e.target.value as AssumptionStatus)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="untested">Untested</option>
                        <option value="testing">Testing</option>
                        <option value="validated">Validated</option>
                        <option value="invalidated">Invalidated</option>
                      </select>
                    </div>
                  </div>

                  {assumption.evidence.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded">
                      <p className="text-xs font-medium text-gray-700">Evidence:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {assumption.evidence.map((evidence, index) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(assumption.id, assumption.type, assumption.description)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label="Edit assumption"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this assumption?')) deleteAssumption(assumption.id);
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    aria-label="Delete assumption"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
