import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  ActorCategory,
  ACTOR_COLORS,
  ACTOR_ICONS,
  ACTOR_LABELS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ActorManagementProps {
  onContinue: () => void;
  onBack: () => void;
}

export const ActorManagement = ({ onContinue, onBack }: ActorManagementProps) => {
  const { actors, scope } = useVisualSectorMap();
  const [selectedCategory, setSelectedCategory] = useState<ActorCategory>('customer');

  // Phase 2 Part 3: Left sidebar state
  const [visibleCategories, setVisibleCategories] = useState<Set<ActorCategory>>(
    new Set(['customer', 'provider', 'regulator', 'funder', 'partner', 'influencer'])
  );
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    actorList: true,
    help: false,
  });

  const categories: ActorCategory[] = [
    'customer',
    'provider',
    'regulator',
    'funder',
    'partner',
    'influencer',
  ];

  const canContinue = actors.length >= 2; // Need at least 2 actors to create connections

  // Phase 2 Part 3: Toggle category visibility
  const toggleCategory = (category: ActorCategory) => {
    setVisibleCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleSection = (section: 'filters' | 'actorList' | 'help') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Group actors by category
  const actorsByCategory = categories.map((category) => ({
    category,
    actors: actors.filter((a) => a.category === category),
  }));

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Phase 2 Part 3: Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">System Structure</h2>
          <p className="text-xs text-gray-600 mt-1">Manage your ecosystem map</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Layers & Filters Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('filters')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🔍</span> Layers & Filters
              </span>
              {expandedSections.filters ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.filters && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Toggle actor type visibility:</p>
                {categories.map((category) => {
                  const isVisible = visibleCategories.has(category);
                  const count = actors.filter((a) => a.category === category).length;

                  return (
                    <label
                      key={category}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleCategory(category)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-lg">{ACTOR_ICONS[category]}</span>
                      <span className="text-sm text-gray-700 flex-1">
                        {ACTOR_LABELS[category]}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actor List Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('actorList')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>👥</span> Actor List ({actors.length})
              </span>
              {expandedSections.actorList ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.actorList && (
              <div className="px-4 pb-4">
                {actors.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4">
                    No actors added yet. Select a type above and click the canvas to place actors.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {actorsByCategory.map(({ category, actors: categoryActors }) =>
                      categoryActors.length > 0 ? (
                        <div key={category} className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                            {ACTOR_ICONS[category]} {ACTOR_LABELS[category]}
                          </p>
                          <div className="space-y-1">
                            {categoryActors.map((actor) => {
                              const colors = ACTOR_COLORS[actor.category];
                              return (
                                <button
                                  key={actor.id}
                                  className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-100 transition-colors border ${colors.border} ${colors.bg}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span>{ACTOR_ICONS[actor.category]}</span>
                                    <span className={`${colors.text} font-medium`}>
                                      {actor.name}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('help')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>💡</span> Help & Tips
              </span>
              {expandedSections.help ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.help && (
              <div className="px-4 pb-4 space-y-3 text-xs text-gray-600">
                <div>
                  <p className="font-medium text-gray-700 mb-1">🎯 What is System Structure?</p>
                  <p>
                    Map all the key actors in your ecosystem and their relationships. This helps
                    you visualize who matters and how they interact.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">➕ Adding Actors</p>
                  <p>
                    Select an actor type above, then click anywhere on the canvas to place it.
                    Double-click to rename. Right-click for more options.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">🔗 Next Steps</p>
                  <p>
                    After adding at least 2 actors, you'll connect them to show relationships
                    (value flows, information, regulations, etc.).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
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
          <VisualCanvas
            selectedCategory={selectedCategory}
            visibleCategories={visibleCategories}
          />

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
    </div>
  );
};
