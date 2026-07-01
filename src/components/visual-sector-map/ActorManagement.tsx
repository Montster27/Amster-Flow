import { useState } from 'react';
import { useVisualSectorMap } from '../../contexts/VisualSectorMapContext';
import {
  ActorCategory,
  ACTOR_LABELS,
} from '../../types/visualSectorMap';
import { VisualCanvas } from './VisualCanvas';
import { ActorTypeChip } from './ActorTypeChip';
import { ChevronDown, ChevronUp, AlertTriangle, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  TEAL, INK, SLATE_FG, MUTED, TAN, STONE, HAIR, PAPER,
  AMBER_FG, AMBER_SOFT, AMBER_LINE, FONT_SERIF, FONT_MONO,
} from '../../features/v3/lib/tokens';

interface ActorManagementProps {
  onContinue: () => void;
  onBack: () => void;
}

// Section kicker — mono uppercase label matching the v3 standard used
// throughout LayerDetailPage / StageGatesPanel.
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: MUTED, fontWeight: 700,
    }}>{children}</span>
  );
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
      {/* Left Sidebar */}
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
              <Kicker>Layers &amp; Filters</Kicker>
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
                      <ActorTypeChip category={category} size={20} />
                      <span className="text-sm flex-1" style={{ color: SLATE_FG }}>
                        {ACTOR_LABELS[category]}
                      </span>
                      <span className="text-xs font-medium" style={{ color: MUTED, fontFamily: FONT_MONO }}>
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
              <Kicker>Actor List ({actors.length})</Kicker>
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
                          <p className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: MUTED }}>
                            <ActorTypeChip category={category} size={16} />
                            {ACTOR_LABELS[category]}
                          </p>
                          <div className="space-y-1">
                            {categoryActors.map((actor) => (
                              <button
                                key={actor.id}
                                className="w-full text-left px-2 py-1.5 rounded text-sm transition-colors border"
                                style={{ borderColor: TAN, background: PAPER }}
                              >
                                <span className="flex items-center gap-2">
                                  <ActorTypeChip category={actor.category} size={18} />
                                  <span className="font-medium" style={{ color: INK }}>
                                    {actor.name}
                                  </span>
                                </span>
                              </button>
                            ))}
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
              <Kicker>Help &amp; Tips</Kicker>
              {expandedSections.help ? (
                <ChevronUp className="w-4 h-4" style={{ color: MUTED }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: MUTED }} />
              )}
            </button>

            {expandedSections.help && (
              <div className="px-4 pb-4 space-y-3 text-xs" style={{ color: SLATE_FG }}>
                <div>
                  <p className="font-medium mb-1" style={{ color: SLATE_FG }}>What is System Structure?</p>
                  <p>
                    Map all the key actors in your ecosystem and their relationships. This helps
                    you visualize who matters and how they interact.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: SLATE_FG }}>Adding Actors</p>
                  <p>
                    Select an actor type above, then click anywhere on the canvas to place it.
                    Double-click to rename. Right-click for more options.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: SLATE_FG }}>Next Steps</p>
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
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: INK, fontFamily: FONT_SERIF, letterSpacing: '-0.012em' }}
              >Add key actors</h1>
              <p className="text-sm italic" style={{ color: MUTED }}>{scope.question}</p>
            </div>

            {/* Mentor-voice callout */}
            <div style={{
              padding: '12px 16px', background: '#fff',
              borderLeft: `3px solid ${TEAL}`, borderRadius: 4,
              marginBottom: 14,
            }}>
              <p style={{
                fontFamily: FONT_SERIF, fontSize: 15.5, fontStyle: 'italic',
                color: INK, lineHeight: 1.4,
              }}>
                &ldquo;Name the players two degrees out — including the ones who never sell you
                anything but shape whether you win.&rdquo;
              </p>
              <p style={{
                fontFamily: FONT_MONO, fontSize: 10, color: MUTED,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6,
              }}>— Monty</p>
            </div>

            {/* Category Selection */}
            <div>
              <p style={{
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: MUTED, marginBottom: 10,
              }}>Choose a type, then click the canvas</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                      style={isSelected
                        ? {
                          background: '#fff', color: INK,
                          border: `1.5px solid ${TEAL}`,
                          boxShadow: '0 0 0 3px rgba(15,118,110,0.08)',
                        }
                        : { background: '#fff', color: SLATE_FG, border: `1.5px solid ${STONE}` }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = MUTED; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = STONE; }}
                    >
                      <ActorTypeChip category={category} size={20} />
                      {ACTOR_LABELS[category]}
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
              <p style={{ fontFamily: FONT_SERIF, fontSize: 32, lineHeight: 1, color: INK, marginBottom: 4 }}>
                {actors.length}
              </p>
              <p style={{
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: SLATE_FG, marginBottom: 8,
              }}>Actors Added</p>
              {!canContinue ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ color: AMBER_FG, background: AMBER_SOFT, borderColor: AMBER_LINE }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">Add {2 - actors.length} more to continue</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ color: TEAL, background: '#e6f4f1', borderColor: '#bfe3da' }}>
                  <Check className="w-4 h-4 flex-shrink-0" />
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
              className="px-6 py-2 rounded-lg font-medium bg-white border-2 transition-all flex items-center gap-2"
              style={{ color: SLATE_FG, borderColor: STONE }}
              onMouseEnter={(e) => { e.currentTarget.style.background = HAIR; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Scope
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={onContinue}
                disabled={!canContinue}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
                  canContinue ? 'text-white shadow-lg hover:shadow-xl' : 'cursor-not-allowed'
                }`}
                style={canContinue ? { background: TEAL } : { background: '#e2e8f0', color: MUTED }}
                onMouseEnter={(e) => { if (canContinue) e.currentTarget.style.background = '#0d5c56'; }}
                onMouseLeave={(e) => { if (canContinue) e.currentTarget.style.background = TEAL; }}
              >
                {canContinue ? (
                  <>Continue to Connections <ArrowRight className="w-5 h-5" /></>
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
