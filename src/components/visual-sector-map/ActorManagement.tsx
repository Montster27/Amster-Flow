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
import {
  TEAL, INK, SLATE_FG, MUTED, TAN, STONE, HAIR, PAPER, AMBER_FG, AMBER_SOFT, AMBER_LINE,
} from '../../features/v3/lib/tokens';

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
    <div className="h-screen flex" style={{ background: PAPER }}>
      {/* Phase 2 Part 3: Left Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col overflow-hidden" style={{ borderColor: TAN }}>
        <div className="p-4 border-b" style={{ borderColor: TAN }}>
          <h2 className="text-lg font-bold" style={{ color: INK }}>System Structure</h2>
          <p className="text-xs mt-1" style={{ color: SLATE_FG }}>Manage your ecosystem map</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Layers & Filters Section */}
          <div className="border-b" style={{ borderColor: TAN }}>
            <button
              onClick={() => toggleSection('filters')}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: SLATE_FG }}>
                <span>🔍</span> Layers & Filters
              </span>
              {expandedSections.filters ? (
                <ChevronUp className="w-4 h-4" style={{ color: MUTED }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: MUTED }} />
              )}
            </button>

            {expandedSections.filters && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs mb-3" style={{ color: MUTED }}>Toggle actor type visibility:</p>
                {categories.map((category) => {
                  const isVisible = visibleCategories.has(category);
                  const count = actors.filter((a) => a.category === category).length;

                  return (
                    <label
                      key={category}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer"
                      onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleCategory(category)}
                        className="rounded"
                        style={{ accentColor: TEAL, borderColor: STONE }}
                      />
                      <span className="text-lg">{ACTOR_ICONS[category]}</span>
                      <span className="text-sm flex-1" style={{ color: SLATE_FG }}>
                        {ACTOR_LABELS[category]}
                      </span>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actor List Section */}
          <div className="border-b" style={{ borderColor: TAN }}>
            <button
              onClick={() => toggleSection('actorList')}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: SLATE_FG }}>
                <span>👥</span> Actor List ({actors.length})
              </span>
              {expandedSections.actorList ? (
                <ChevronUp className="w-4 h-4" style={{ color: MUTED }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: MUTED }} />
              )}
            </button>

            {expandedSections.actorList && (
              <div className="px-4 pb-4">
                {actors.length === 0 ? (
                  <p className="text-xs italic text-center py-4" style={{ color: MUTED }}>
                    No actors added yet. Select a type above and click the canvas to place actors.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {actorsByCategory.map(({ category, actors: categoryActors }) =>
                      categoryActors.length > 0 ? (
                        <div key={category} className="mb-3">
                          <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: MUTED }}>
                            {ACTOR_ICONS[category]} {ACTOR_LABELS[category]}
                          </p>
                          <div className="space-y-1">
                            {categoryActors.map((actor) => {
                              const colors = ACTOR_COLORS[actor.category];
                              return (
                                <button
                                  key={actor.id}
                                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors border ${colors.border} ${colors.bg}`}
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
          <div className="border-b" style={{ borderColor: TAN }}>
            <button
              onClick={() => toggleSection('help')}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: SLATE_FG }}>
                <span>💡</span> Help & Tips
              </span>
              {expandedSections.help ? (
                <ChevronUp className="w-4 h-4" style={{ color: MUTED }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: MUTED }} />
              )}
            </button>

            {expandedSections.help && (
              <div className="px-4 pb-4 space-y-3 text-xs" style={{ color: SLATE_FG }}>
                <div>
                  <p className="font-medium mb-1" style={{ color: SLATE_FG }}>🎯 What is System Structure?</p>
                  <p>
                    Map all the key actors in your ecosystem and their relationships. This helps
                    you visualize who matters and how they interact.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: SLATE_FG }}>➕ Adding Actors</p>
                  <p>
                    Select an actor type above, then click anywhere on the canvas to place it.
                    Double-click to rename. Right-click for more options.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: SLATE_FG }}>🔗 Next Steps</p>
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
        <div className="bg-white border-b px-8 py-6" style={{ borderColor: TAN }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: INK }}>
                <span>👥</span> Add Key Actors
              </h1>
              <p className="text-sm italic" style={{ color: MUTED }}>{scope.question}</p>
            </div>

            {/* Category Selection */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: SLATE_FG }}>
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
                          : 'bg-white'
                      }`}
                      style={isSelected ? undefined : { borderColor: STONE, color: SLATE_FG }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = MUTED; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = STONE; }}
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
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border-2 p-4 z-10" style={{ borderColor: TAN }}>
            <div className="text-center">
              <p className="text-2xl font-bold mb-1" style={{ color: INK }}>{actors.length}</p>
              <p className="text-xs mb-2" style={{ color: SLATE_FG }}>actors added</p>
              {!canContinue ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ color: AMBER_FG, background: AMBER_SOFT, borderColor: AMBER_LINE }}>
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs font-medium">Add {2 - actors.length} more to continue</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border animate-pulse" style={{ color: TEAL, background: '#e6f4f1', borderColor: '#bfe3da' }}>
                  <span className="text-lg">✓</span>
                  <p className="text-xs font-medium">Ready to continue!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="bg-white border-t-2 px-8 py-5 shadow-lg" style={{ borderColor: STONE }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2 rounded-lg font-medium bg-white border-2 transition-all"
              style={{ color: SLATE_FG, borderColor: STONE }}
              onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              ← Back to Scope
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={onContinue}
                disabled={!canContinue}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                  canContinue
                    ? 'text-white shadow-lg hover:shadow-xl animate-pulse'
                    : 'cursor-not-allowed'
                }`}
                style={canContinue ? { background: TEAL } : { background: '#e2e8f0', color: MUTED }}
                onMouseEnter={(e) => { if (canContinue) e.currentTarget.style.background = '#0d5c56'; }}
                onMouseLeave={(e) => { if (canContinue) e.currentTarget.style.background = TEAL; }}
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
