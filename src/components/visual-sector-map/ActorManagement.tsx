import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  ActorCategory,
  ACTOR_COLORS,
  ACTOR_ICONS,
  ACTOR_LABELS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';

interface ActorManagementProps {
  onContinue: () => void;
  onBack: () => void;
}

export const ActorManagement = ({ onContinue, onBack }: ActorManagementProps) => {
  const { actors, scope } = useVisualSectorMap();
  const [selectedCategory, setSelectedCategory] = useState<ActorCategory>('customer');

  const categories: ActorCategory[] = [
    'customer',
    'provider',
    'regulator',
    'funder',
    'partner',
    'influencer',
  ];

  const canContinue = actors.length >= 2; // Need at least 2 actors to create connections

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Step 2: Add Key Actors
            </h1>
            <p className="text-gray-600">
              <strong>Your question:</strong> {scope.question}
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Select actor type, then click on the canvas to place:
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const colors = ACTOR_COLORS[category];
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text} shadow-md scale-105`
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {ACTOR_ICONS[category]} {ACTOR_LABELS[category]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <VisualCanvas selectedCategory={selectedCategory} />
      </div>

      {/* Footer with navigation */}
      <div className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            ← Back to Scope
          </button>

          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              {actors.length} actor{actors.length !== 1 ? 's' : ''} added
              {!canContinue && ' (add at least 2 to continue)'}
            </p>
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                canContinue
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canContinue ? 'Continue to Connections →' : 'Add more actors to continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
