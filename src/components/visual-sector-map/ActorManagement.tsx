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
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>👥</span> Add Key Actors
            </h1>
            <p className="text-sm text-gray-500 italic">{scope.question}</p>
          </div>

          {/* Category Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span>👆</span> Select type → Click canvas to place
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
      <div className="flex-1 overflow-hidden relative">
        <VisualCanvas selectedCategory={selectedCategory} />

        {/* Floating Progress Indicator */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 z-10">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 mb-1">{actors.length}</p>
            <p className="text-xs text-gray-600 mb-2">actors added</p>
            {!canContinue ? (
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                <span className="text-lg">⚠️</span>
                <p className="text-xs font-medium">Add {2 - actors.length} more to continue</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 animate-pulse">
                <span className="text-lg">✓</span>
                <p className="text-xs font-medium">Ready to continue!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="bg-white border-t-2 border-gray-300 px-8 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            ← Back to Scope
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                canContinue
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl animate-pulse'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canContinue ? (
                <span className="flex items-center gap-2">
                  Continue to Connections <span className="text-2xl">→</span>
                </span>
              ) : (
                'Add at least 2 actors to continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
