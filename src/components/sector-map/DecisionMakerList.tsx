/**
 * DecisionMakerList - List of decision makers (B2C mode)
 *
 * Responsibilities:
 * - Display decision makers as a list
 * - Show role, influence level, description
 * - Add/Edit/Delete actions
 * - Empty state
 */

import { DecisionMaker } from '../../types/sectorMap';
import { Plus, Pencil, Trash2, Crown, Users, DollarSign } from 'lucide-react';

interface DecisionMakerListProps {
  decisionMakers: DecisionMaker[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const influenceIcons = {
  'decision-maker': Crown,
  'influencer': Users,
  'payer': DollarSign,
};

const influenceColors = {
  'decision-maker': 'text-yellow-600 bg-yellow-100',
  'influencer': 'text-blue-600 bg-blue-100',
  'payer': 'text-green-600 bg-green-100',
};

export function DecisionMakerList({
  decisionMakers,
  onAdd,
  onEdit,
  onDelete,
}: DecisionMakerListProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Decision Makers ({decisionMakers.length})
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Decision Maker
        </button>
      </div>

      {/* List */}
      {decisionMakers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Crown className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No decision makers added
          </h3>
          <p className="text-gray-600 mb-4">
            Who influences purchase decisions? Map the key stakeholders.
          </p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5" />
            Add First Decision Maker
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {decisionMakers.map((dm) => {
            const Icon = influenceIcons[dm.influence];
            const colorClass = influenceColors[dm.influence];

            return (
              <div
                key={dm.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dm.role}
                        </h3>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {dm.influence.replace('-', ' ')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(dm.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(dm.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {dm.description && (
                      <p className="text-gray-600 text-sm">{dm.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
