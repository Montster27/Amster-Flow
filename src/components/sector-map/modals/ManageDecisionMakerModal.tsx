/**
 * ManageDecisionMakerModal - Modal for adding/editing decision makers
 *
 * Responsibilities:
 * - Form for decision maker role, influence, description
 * - Validation
 * - Save/Cancel actions
 */

import { useState, useEffect } from 'react';
import { DecisionMaker, InfluenceLevel } from '../../../types/sectorMap';
import { X, Crown, Users, DollarSign } from 'lucide-react';

interface ManageDecisionMakerModalProps {
  isOpen: boolean;
  decisionMaker?: DecisionMaker; // undefined = add mode, defined = edit mode
  onSave: (dm: Omit<DecisionMaker, 'id' | 'created'>) => void;
  onClose: () => void;
}

const influenceOptions: { value: InfluenceLevel; label: string; icon: typeof Crown; description: string }[] = [
  {
    value: 'decision-maker',
    label: 'Decision Maker',
    icon: Crown,
    description: 'Final say on purchase decisions',
  },
  {
    value: 'influencer',
    label: 'Influencer',
    icon: Users,
    description: 'Influences decisions but doesn\'t make final call',
  },
  {
    value: 'payer',
    label: 'Payer',
    icon: DollarSign,
    description: 'Controls the budget and payment',
  },
];

export function ManageDecisionMakerModal({
  isOpen,
  decisionMaker,
  onSave,
  onClose,
}: ManageDecisionMakerModalProps) {
  const [formData, setFormData] = useState({
    role: '',
    influence: 'decision-maker' as InfluenceLevel,
    description: '',
  });

  const isEditMode = !!decisionMaker;

  // Reset form when modal opens or decision maker changes
  useEffect(() => {
    if (isOpen) {
      if (decisionMaker) {
        setFormData({
          role: decisionMaker.role,
          influence: decisionMaker.influence,
          description: decisionMaker.description || '',
        });
      } else {
        setFormData({
          role: '',
          influence: 'decision-maker',
          description: '',
        });
      }
    }
  }, [isOpen, decisionMaker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Decision Maker' : 'Add New Decision Maker'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <input
                id="role"
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Chief Technology Officer, Head of IT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            {/* Influence Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Influence Level <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {influenceOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.influence === option.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="influence"
                        value={option.value}
                        checked={formData.influence === option.value}
                        onChange={(e) => setFormData({ ...formData, influence: e.target.value as InfluenceLevel })}
                        className="sr-only"
                      />
                      <Icon className={`w-5 h-5 mt-0.5 mr-3 ${
                        formData.influence === option.value ? 'text-emerald-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional context about this decision maker's role and influence..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              {isEditMode ? 'Save Changes' : 'Add Decision Maker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
