import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Segment, useStep0Store, NEED_CATEGORIES, NeedCategoryId, Benefit } from './step0Store';
import { getContent } from '../../lib/pivotKitContent';
import { MentorVoice, TooltipText } from '../../components/ui/MentorVoice';

// Example data for split-screen teaching
const EXAMPLE_DATA = {
  idea: {
    building: 'a mobile app',
    helps: 'busy parents of teenagers',
    achieve: 'coordinate family schedules and reduce missed activities',
  },
  customers: [
    {
      name: 'Working parents with teens in sports',
      benefits: [
        { text: 'Never miss another game or practice', needCategory: 'emotional' as NeedCategoryId },
        { text: 'Save 30+ minutes per week on scheduling', needCategory: 'efficiency' as NeedCategoryId },
        { text: 'Feel confident they know all upcoming events', needCategory: 'emotional' as NeedCategoryId },
      ],
    },
    {
      name: 'Single parents juggling multiple kids',
      benefits: [
        { text: 'One place to see all schedules at a glance', needCategory: 'efficiency' as NeedCategoryId },
        { text: 'Easy backup when conflicts arise', needCategory: 'risk' as NeedCategoryId },
        { text: 'Less guilt from missed events', needCategory: 'emotional' as NeedCategoryId },
      ],
    },
  ],
  segments: [
    {
      name: 'Working parents with teens in sports',
      benefits: [
        { text: 'Never miss another game or practice', needCategory: 'emotional' as NeedCategoryId },
        { text: 'Save 30+ minutes per week on scheduling', needCategory: 'efficiency' as NeedCategoryId },
      ],
      need: 'Never miss another game or practice',
      accessRank: 5
    },
  ],
};

// Split-screen layout component
function SplitScreen({
  exampleTitle,
  exampleContent,
  studentTitle,
  studentContent,
  showExample = true,
}: {
  exampleTitle: string;
  exampleContent: React.ReactNode;
  studentTitle: string;
  studentContent: React.ReactNode;
  showExample?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!showExample) {
    return <div className="w-full">{studentContent}</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Example Side */}
      <div className={`${collapsed ? 'lg:w-12' : 'lg:w-1/2'} transition-all duration-300`}>
        <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100/50 overflow-hidden h-full">
          <div className="bg-amber-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 text-lg">📖</span>
              {!collapsed && <span className="font-semibold text-amber-800 text-sm">{exampleTitle}</span>}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-amber-600 hover:text-amber-800 p-1 rounded"
              title={collapsed ? 'Show example' : 'Hide example'}
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
          {!collapsed && (
            <div className="p-4">
              {exampleContent}
            </div>
          )}
        </div>
      </div>

      {/* Student Side */}
      <div className={`${collapsed ? 'lg:flex-1' : 'lg:w-1/2'} transition-all duration-300`}>
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden h-full">
          <div className="bg-blue-100 px-4 py-2 flex items-center gap-2">
            <span className="text-blue-600 text-lg">✏️</span>
            <span className="font-semibold text-blue-800 text-sm">{studentTitle}</span>
          </div>
          <div className="p-4">
            {studentContent}
          </div>
        </div>
      </div>
    </div>
  );
}

// Progress bar component - now 5 parts
function ProgressBar({ currentPart, totalParts }: { currentPart: number; totalParts: number }) {
  const parts = ['Your Idea', 'Who & Why', 'Assign Needs', 'Rank & Focus', 'Summary'];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {parts.map((name, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                idx < currentPart
                  ? 'bg-green-500 text-white'
                  : idx === currentPart
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {idx < currentPart ? '✓' : idx}
            </div>
            <span className={`text-xs mt-1 text-center ${idx === currentPart ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
              {name}
            </span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(currentPart / (totalParts - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

// Need category badge component
function NeedBadge({ categoryId, size = 'sm' }: { categoryId: NeedCategoryId; size?: 'sm' | 'md' }) {
  const category = NEED_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;

  const colors: Record<string, string> = {
    functional: 'bg-red-100 text-red-700 border-red-200',
    efficiency: 'bg-blue-100 text-blue-700 border-blue-200',
    economic: 'bg-green-100 text-green-700 border-green-200',
    emotional: 'bg-purple-100 text-purple-700 border-purple-200',
    identity: 'bg-pink-100 text-pink-700 border-pink-200',
    social: 'bg-orange-100 text-orange-700 border-orange-200',
    control: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    risk: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    growth: 'bg-teal-100 text-teal-700 border-teal-200',
    meaning: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${colors[categoryId] || 'bg-slate-100 text-slate-600'} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {category.name}
    </span>
  );
}

export function Step0FirstLook() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    part,
    setPart,
    idea,
    updateIdea,
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    addCustomerBenefit,
    updateCustomerBenefit,
    updateCustomerBenefitNeedCategory,
    removeCustomerBenefit,
    segments,
    addSegment,
    syncSegmentsFromCustomers,
    updateSegmentAccessRank,
    reorderSegmentBenefits,
    focusedSegmentId,
    setFocusedSegmentId,
    setGraduated,
    founderMarketFit,
    updateFounderMarketFit,
    whyNow,
    updateWhyNow,
    schlepAssessment,
    updateSchlepAssessment,
    beachheadQualifiers,
    updateBeachheadQualifiers,
  } = useStep0Store();

  // Welcome screen: show for new projects (no idea text yet AND on Part 0)
  const isNewProject = !idea.building && !idea.helps && !idea.achieve && part === 0;
  const [showWelcome, setShowWelcome] = useState(isNewProject);

  // Auto-focus newly added inputs
  const [focusTarget, setFocusTarget] = useState<{customerId: number, type: 'benefit', index: number} | null>(null);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<NeedCategoryId | null>(null);
  const [showGraduationScreen, setShowGraduationScreen] = useState(false);

  useEffect(() => {
    if (focusTarget) {
      const inputId = `benefit-${focusTarget.customerId}-${focusTarget.index}`;
      const element = document.getElementById(inputId);
      if (element) {
        element.focus();
      }
      setFocusTarget(null);
    }
  }, [focusTarget, customers]);

  // Sync segments when entering Part 3 (Rank & Focus)
  useEffect(() => {
    if (part === 3) {
      syncSegmentsFromCustomers();
    }
  }, [part, syncSegmentsFromCustomers]);

  const handleAddCustomerBenefit = (customerId: number, currentLength: number) => {
    addCustomerBenefit(customerId, '');
    setFocusTarget({ customerId, type: 'benefit', index: currentLength });
  };

  const handleAddSegment = () => {
    if (newSegmentName.trim()) {
      addSegment(newSegmentName.trim());
      setNewSegmentName('');
    }
  };

  const focusedSegment = useMemo(
    () => segments.find((s) => s.id === focusedSegmentId) || null,
    [segments, focusedSegmentId]
  );

  // Other segments (not focused) for reminder
  const otherSegments = useMemo(
    () => segments.filter((s) => s.id !== focusedSegmentId),
    [segments, focusedSegmentId]
  );

  // Count total benefits and assigned benefits for Part 2 progress
  const totalBenefits = customers.reduce((sum, c) => sum + c.benefits.length, 0);
  const assignedBenefits = customers.reduce(
    (sum, c) => sum + c.benefits.filter(b => b.needCategory).length,
    0
  );

  const nextPart = () => setPart(Math.min(4, part + 1));
  const prevPart = () => setPart(Math.max(0, part - 1));

  // Check if current part is complete enough to proceed
  const canProceed = () => {
    switch (part) {
      case 0: return idea.building.trim() && idea.helps.trim() && idea.achieve.trim();
      case 1: return customers.length > 0 && customers.some(c => c.text.trim() && c.benefits.length > 0);
      case 2: return totalBenefits > 0 && assignedBenefits === totalBenefits; // All benefits must have a need category
      case 3: return focusedSegmentId !== null && segments.some(s => s.need.trim());
      default: return true;
    }
  };

  const handleGraduateClick = () => {
    setShowGraduationScreen(true);
  };

  const handleConfirmGraduation = () => {
    setGraduated(true);
    navigate(`/project/${projectId}/quick-check`, {
      state: {
        message: 'Before interviewing anyone, let\'s articulate what you\'re testing.',
        fromStep0: true,
        focusedSegment: focusedSegment,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Welcome Screen — shown once for new projects */}
      {showWelcome && (
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
              <span className="text-3xl">🥭</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{getContent('welcome_headline')}</h1>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              {getContent('welcome_intro').split('\n\n').map((p, i) => (
                <span key={i}>{i > 0 && <><br /><br /></>}{p}</span>
              ))}
            </p>

            <p className="text-sm font-medium text-slate-800 mb-4">{getContent('welcome_process')}</p>

            <div className="space-y-4">
              {/* Phase 1: First Look */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">First Look</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{getContent('welcome_step0_desc')}</p>
                </div>
              </div>

              {/* Phase 2: Quick Check */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">2</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Quick Check</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{getContent('welcome_quickcheck_desc')}</p>
                </div>
              </div>

              {/* Phase 3: Discovery */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">3</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Discovery</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{getContent('welcome_discovery_desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <MentorVoice text={getContent('welcome_cta')} type="mentor_voice" inline className="mb-6" />

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Let's Go →
            </button>
          </div>
        </div>
      )}

      {/* Main Step 0 content — hidden when welcome screen is showing */}
      {!showWelcome && (
      <>
      {/* Header */}
      <div className="mb-6">
        <ProgressBar currentPart={part} totalParts={5} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={prevPart}
          disabled={part === 0}
        >
          ← Back
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800">
            {part === 0 && 'Your Idea'}
            {part === 1 && 'Who & Why'}
            {part === 2 && 'Assign Needs'}
            {part === 3 && 'Rank & Focus'}
            {part === 4 && 'Summary'}
          </div>
          <div className="text-sm text-slate-500">Step 0 · Part {part} of 4</div>
        </div>
        {part < 4 ? (
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={nextPart}
            disabled={!canProceed()}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            onClick={handleGraduateClick}
          >
            Problem Module →
          </button>
        )}
      </div>

      {/* Part 0: Your Idea */}
      {part === 0 && (
        <>
        {/* Item 1: Opening orientation — first thing user reads */}
        <MentorVoice text={getContent('step0_p0_opening_orientation')} type="mentor_voice" className="mb-4" />

        {/* Item 4: Mangos callout */}
        <MentorVoice text={getContent('step0_p0_mangos')} type="mentor_voice" dismissible className="mb-4" />

        <SplitScreen
          exampleTitle="Example: Family Schedule App"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                Here's how a founder might describe their idea in one sentence:
              </p>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-600 mb-1">I'm building...</div>
                  <div className="text-sm text-slate-800 font-medium">{EXAMPLE_DATA.idea.building}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-600 mb-1">that helps...</div>
                  <div className="text-sm text-slate-800 font-medium">{EXAMPLE_DATA.idea.helps}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-600 mb-1">to...</div>
                  <div className="text-sm text-slate-800 font-medium">{EXAMPLE_DATA.idea.achieve}</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Full sentence:</strong> "I'm building {EXAMPLE_DATA.idea.building} that helps {EXAMPLE_DATA.idea.helps} {EXAMPLE_DATA.idea.achieve}."
                </p>
              </div>
            </div>
          }
          studentTitle="Your Turn"
          studentContent={
            <div className="space-y-4">
              {/* Item 2: Page subtitle */}
              <p className="text-sm text-slate-600 mb-4">
                {getContent('step0_p0_page_subtitle')}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <TooltipText text={getContent('step0_p0_idea_statement_tooltip')}>I'm building...</TooltipText>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="a tool, app, service, platform..."
                    value={idea.building}
                    onChange={(e) => updateIdea('building', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    that helps...
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="who are your target customers?"
                    value={idea.helps}
                    onChange={(e) => updateIdea('helps', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    to...
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="what will they achieve? (do X better, faster, cheaper)"
                    value={idea.achieve}
                    onChange={(e) => updateIdea('achieve', e.target.value)}
                  />
                </div>
              </div>

              {idea.building && idea.helps && idea.achieve && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs font-semibold text-green-600 mb-1">Your idea statement:</div>
                  <p className="text-sm text-green-800">
                    "I'm building <strong>{idea.building}</strong> that helps <strong>{idea.helps}</strong> <strong>{idea.achieve}</strong>."
                  </p>
                </div>
              )}

              {/* Founder-Market Fit Section */}
              {idea.building && idea.helps && idea.achieve && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    <TooltipText text={getContent('step0_p0_fmf_tooltip')}>{getContent('step0_p0_fmf_label')}</TooltipText>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Have you personally experienced this problem?
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        value={founderMarketFit.directExperience}
                        onChange={(e) => updateFounderMarketFit('directExperience', e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes — I've lived this problem</option>
                        <option value="adjacent">Adjacent — I've seen it closely</option>
                        <option value="no">No — I observed it from outside</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        What gives you relevant expertise in this space?
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Domain knowledge, professional experience, research background... (min 50 characters)"
                        rows={2}
                        value={founderMarketFit.domainCredibility}
                        onChange={(e) => updateFounderMarketFit('domainCredibility', e.target.value)}
                      />
                      {founderMarketFit.domainCredibility.length > 0 && founderMarketFit.domainCredibility.length < 50 && (
                        <p className="text-xs text-amber-600 mt-1">{50 - founderMarketFit.domainCredibility.length} more characters needed</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Do you have direct access to the target segment today?
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        value={founderMarketFit.accessAdvantage}
                        onChange={(e) => updateFounderMarketFit('accessAdvantage', e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes — I can reach them directly</option>
                        <option value="no">No — I'd need to find them</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        What happened that makes this the right time for you?
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Career change, personal experience, industry shift..."
                        rows={2}
                        value={founderMarketFit.whyNowForYou}
                        onChange={(e) => updateFounderMarketFit('whyNowForYou', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* FMF Score Badge */}
                  {founderMarketFit.directExperience && founderMarketFit.domainCredibility.length >= 50 && founderMarketFit.accessAdvantage && founderMarketFit.whyNowForYou ? (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-xs font-bold text-green-700">Strong Founder-Market Fit</span>
                    </div>
                  ) : (founderMarketFit.directExperience === 'no' && founderMarketFit.accessAdvantage === 'no') ? (
                    <MentorVoice text={getContent('step0_p0_fmf_warning')} type="warning" className="mt-3" />
                  ) : null}
                </div>
              )}

              {/* Why Now? Section */}
              {idea.building && idea.helps && idea.achieve && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    <TooltipText text={getContent('step0_p0_why_now_tooltip')}>{getContent('step0_p0_why_now_label')}</TooltipText>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Catalyst type</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        value={whyNow.catalystType}
                        onChange={(e) => updateWhyNow('catalystType', e.target.value)}
                      >
                        <option value="">Select what changed...</option>
                        <option value="technology">Technology shift (new API, model, platform, hardware)</option>
                        <option value="regulatory">Regulatory change (new law, lifted restriction, compliance mandate)</option>
                        <option value="behavioral">Behavioral shift (new habit, demographic change, cultural norm)</option>
                        <option value="economic">Economic change (cost collapse, new funding, market disruption)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Explain the timing</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="What specific change enables this solution now? (min 100 characters)"
                        rows={3}
                        value={whyNow.elaboration}
                        onChange={(e) => updateWhyNow('elaboration', e.target.value)}
                      />
                      {whyNow.elaboration.length > 0 && whyNow.elaboration.length < 100 && (
                        <p className="text-xs text-amber-600 mt-1">{100 - whyNow.elaboration.length} more characters needed</p>
                      )}
                    </div>
                  </div>

                  {!whyNow.catalystType && !whyNow.elaboration && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-xs text-amber-700">If you can't explain why this is solvable now, the timing for this idea may be wrong.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Schlep Filter Self-Assessment */}
              {idea.building && idea.helps && idea.achieve && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Idea Attractiveness Check</h4>
                  <p className="text-xs text-slate-500 mb-3">How would you describe this problem to work on?</p>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Tedious & Unglamorous</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={schlepAssessment.attractiveness}
                      onChange={(e) => updateSchlepAssessment('attractiveness', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">Exciting & Prestigious</span>
                  </div>

                  {schlepAssessment.attractiveness >= 4 && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-xs text-amber-700">
                        The best ideas often look boring or messy. If this feels too exciting, make sure you're not filtering out harder, more valuable problems. The schlep IS the moat.
                      </span>
                    </div>
                  )}

                  {schlepAssessment.attractiveness >= 4 && (
                    <div className="mt-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Did you consider any messier versions of this problem?
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="What harder, less glamorous problems did you pass on?"
                        rows={2}
                        value={schlepAssessment.messierAlternative}
                        onChange={(e) => updateSchlepAssessment('messierAlternative', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          }
        />
        </>
      )}

      {/* Part 1: Who & Why - Customers and Benefits */}
      {part === 1 && (
        <SplitScreen
          exampleTitle="Example: Customers & Benefits"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                List as many target customers as you can think of, and the benefits your solution provides for each:
              </p>
              {EXAMPLE_DATA.customers.map((customer, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-700 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{customer.name}</span>
                  </div>
                  <div className="space-y-2">
                    {customer.benefits.map((benefit, bidx) => (
                      <div key={bidx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Tip:</strong> {getContent('step0_p1_desperate_segment')}
                </p>
              </div>
            </div>
          }
          studentTitle="Your Customers & Their Benefits"
          studentContent={
            <div className="space-y-4">
              {/* Item 10: Part 1 explainer */}
              <MentorVoice text={getContent('step0_p1_explainer')} type="explainer" className="mb-4" />

              {customers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm text-slate-500 mb-4">Add your first customer segment</p>
                  <button
                    type="button"
                    onClick={() => addCustomer('')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                  >
                    + Add Customer
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((c, customerIndex) => (
                    <div key={c.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                            {customerIndex + 1}
                          </span>
                          <span className="text-sm font-medium text-slate-600">Customer Segment</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomer(c.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          ×
                        </button>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Who are they?
                          </label>
                          <input
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            value={c.text}
                            onChange={(e) => updateCustomer(c.id, e.target.value)}
                            placeholder="e.g., Small business owners with 5-20 employees"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            What benefits do they get from your solution?
                          </label>
                          <div className="space-y-2">
                            {c.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex gap-2 group">
                                <input
                                  id={`benefit-${c.id}-${idx}`}
                                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-400 focus:ring-2 focus:ring-green-100"
                                  value={benefit.text}
                                  onChange={(e) => updateCustomerBenefit(c.id, idx, e.target.value)}
                                  placeholder="Describe a specific benefit..."
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomerBenefit(c.id, idx)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddCustomerBenefit(c.id, c.benefits.length)}
                              className="w-full rounded-lg border border-dashed border-green-200 px-3 py-2 text-sm text-green-500 hover:border-green-300 hover:bg-green-50"
                            >
                              + Add benefit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addCustomer('')}
                    className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    + Add another customer segment
                  </button>
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Part 2: Assign Needs - Map benefits to need categories */}
      {part === 2 && (
        <SplitScreen
          exampleTitle="Example: Assigning Needs"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                Each benefit addresses a deeper customer need. Categorize each benefit:
              </p>
              {EXAMPLE_DATA.customers.map((customer, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="font-semibold text-slate-800 text-sm mb-3">{customer.name}</div>
                  <div className="space-y-2">
                    {customer.benefits.map((benefit, bidx) => (
                      <div key={bidx} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 text-slate-600">{benefit.text}</span>
                        <NeedBadge categoryId={benefit.needCategory} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Key insight:</strong> Products that try to serve many need types early usually fail. Focus on 1-2 dominant needs.
                </p>
              </div>
            </div>
          }
          studentTitle="Categorize Your Benefits"
          studentContent={
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  What type of need does each benefit address?
                </p>
                <div className="text-sm font-medium">
                  <span className={assignedBenefits === totalBenefits ? 'text-green-600' : 'text-amber-600'}>
                    {assignedBenefits}/{totalBenefits} assigned
                  </span>
                </div>
              </div>

              {/* Need Categories Reference - Collapsible */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedCategory(expandedCategory ? null : 'functional')}
                  className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <span>Need Categories Reference</span>
                  <span>{expandedCategory ? '−' : '+'}</span>
                </button>
                {expandedCategory && (
                  <div className="px-4 py-3 border-t border-slate-200 bg-white max-h-64 overflow-y-auto">
                    <div className="grid gap-2">
                      {NEED_CATEGORIES.map(cat => (
                        <div
                          key={cat.id}
                          className="p-2 rounded-lg border border-slate-100 hover:border-slate-200"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <NeedBadge categoryId={cat.id} size="md" />
                          </div>
                          <p className="text-xs text-slate-500 mb-1">{cat.description}</p>
                          <p className="text-xs text-slate-400 italic">Signal: "{cat.signal}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer benefits with need assignment */}
              {customers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">No benefits to assign. Go back and add some.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.filter(c => c.benefits.length > 0).map((c) => (
                    <div key={c.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 border-b">
                        <span className="font-semibold text-slate-800 text-sm">{c.text || 'Unnamed customer'}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {c.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-slate-50">
                            <div className="flex-1 text-sm text-slate-700">
                              {benefit.text || <span className="text-slate-400 italic">Empty benefit</span>}
                            </div>
                            <select
                              value={benefit.needCategory}
                              onChange={(e) => updateCustomerBenefitNeedCategory(c.id, idx, e.target.value as NeedCategoryId)}
                              className={`rounded-lg border px-3 py-1.5 text-sm ${
                                benefit.needCategory
                                  ? 'border-green-300 bg-green-50 text-green-800'
                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                              }`}
                            >
                              <option value="">Select need type...</option>
                              {NEED_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary of need distribution */}
              {assignedBenefits > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Need Distribution</h4>
                  <div className="flex flex-wrap gap-2">
                    {NEED_CATEGORIES.filter(cat => {
                      const count = customers.reduce(
                        (sum, c) => sum + c.benefits.filter(b => b.needCategory === cat.id).length,
                        0
                      );
                      return count > 0;
                    }).map(cat => {
                      const count = customers.reduce(
                        (sum, c) => sum + c.benefits.filter(b => b.needCategory === cat.id).length,
                        0
                      );
                      return (
                        <div key={cat.id} className="flex items-center gap-1">
                          <NeedBadge categoryId={cat.id} />
                          <span className="text-xs font-bold text-slate-600">×{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Part 3: Rank & Focus */}
      {part === 3 && (
        <SplitScreen
          exampleTitle="Example: Rank & Focus"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                Select the most important need from the benefits you listed, then rank how easy they are to reach:
              </p>
              {EXAMPLE_DATA.segments.map((seg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="font-semibold text-slate-800 text-sm mb-3">{seg.name}</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-2">Benefits ranked by importance:</div>
                      <div className="space-y-1">
                        {seg.benefits.map((benefit, bidx) => (
                          <div
                            key={bidx}
                            className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                              bidx === 0
                                ? 'bg-purple-100 text-purple-800 font-medium border border-purple-300'
                                : 'text-slate-600'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              bidx === 0 ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>{bidx + 1}</span>
                            <span className="flex-1">{benefit.text}</span>
                            <NeedBadge categoryId={benefit.needCategory} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">How easy to reach:</div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        seg.accessRank >= 4 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {seg.accessRank}/5 - {seg.accessRank >= 4 ? 'Easy' : 'Moderate'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Item 12: Beachhead tip */}
              <MentorVoice text={getContent('step0_p2_beachhead_tip')} type="tip" className="mb-2" />

              {/* Item 13: TAM callout */}
              <MentorVoice text={getContent('step0_p2_tam_callout')} type="callout" />
            </div>
          }
          studentTitle="Select Focus & Rank Access"
          studentContent={
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Select the most important need for each group, then rank how easy they are to reach.
              </p>

              {segments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">No customer segments yet. Go back and add some.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {segments.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg border-2 overflow-hidden transition-all ${
                        focusedSegmentId === s.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className={`px-4 py-2 flex items-center justify-between ${
                        focusedSegmentId === s.id ? 'bg-blue-100' : 'bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                          {focusedSegmentId === s.id && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">
                              Starting Point
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          s.accessRank >= 4 ? 'bg-green-100 text-green-700' :
                          s.accessRank >= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          Access: {s.accessRank}/5
                        </span>
                      </div>
                      <div className="p-4 space-y-4">
                        {/* Benefits ranked by priority — top = test first */}
                        {s.benefits.length > 0 && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                              Rank benefits by importance (drag to reorder — #1 is what you test first):
                            </label>
                            <div className="space-y-1">
                              {s.benefits.map((benefit: Benefit, idx: number) => (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                                    idx === 0
                                      ? 'border-purple-400 bg-purple-50 text-purple-900 font-medium ring-1 ring-purple-200'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  {/* Rank number */}
                                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    idx === 0 ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {idx + 1}
                                  </span>

                                  {/* Benefit text */}
                                  <span className="flex-1">{benefit.text}</span>

                                  {/* Need badge */}
                                  {benefit.needCategory && <NeedBadge categoryId={benefit.needCategory} />}

                                  {/* Up/Down arrows */}
                                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => reorderSegmentBenefits(s.id, idx, idx - 1)}
                                      className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed"
                                      title="Move up"
                                    >
                                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === s.benefits.length - 1}
                                      onClick={() => reorderSegmentBenefits(s.id, idx, idx + 1)}
                                      className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed"
                                      title="Move down"
                                    >
                                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {s.benefits.length > 1 && (
                              <p className="text-xs text-slate-400 mt-2 italic">
                                If #1 doesn't hold up in interviews, work down the list. You don't have to start over.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Access Ranking */}
                        <div>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-500 font-semibold uppercase tracking-wide">How easy to reach?</span>
                            <span className="font-bold text-blue-600">{s.accessRank}/5</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={s.accessRank}
                            onChange={(e) => updateSegmentAccessRank(s.id, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Hard to find</span>
                            <span>Very easy</span>
                          </div>
                        </div>

                        {/* Select as Starting Point */}
                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="focusSegment"
                              checked={focusedSegmentId === s.id}
                              onChange={() => setFocusedSegmentId(s.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-600">Use as starting point</span>
                          </label>
                        </div>

                        {/* Beachhead Qualifiers — shown when segment is selected */}
                        {focusedSegmentId === s.id && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                            <p className="text-xs font-bold text-blue-800">Beachhead Qualifier</p>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">How small is this group?</label>
                              <input
                                type="text"
                                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
                                placeholder="e.g., '~500 freelance designers in Boston'"
                                value={beachheadQualifiers.howSmall}
                                onChange={(e) => updateBeachheadQualifiers('howSmall', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Are they actively trying to solve this today?</label>
                              <select
                                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
                                value={beachheadQualifiers.activelySolving}
                                onChange={(e) => updateBeachheadQualifiers('activelySolving', e.target.value)}
                              >
                                <option value="">Select...</option>
                                <option value="yes">Yes — they have workarounds</option>
                                <option value="no">No — they live with it</option>
                                <option value="unsure">Unsure</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-700 mb-1">Can you reach them directly?</label>
                              <select
                                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
                                value={beachheadQualifiers.canReachDirectly}
                                onChange={(e) => updateBeachheadQualifiers('canReachDirectly', e.target.value)}
                              >
                                <option value="">Select...</option>
                                <option value="yes">Yes — I know where they are</option>
                                <option value="no">No — I'd need introductions</option>
                                <option value="unsure">Unsure</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add manual segment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Add another customer group..."
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSegment()}
                    />
                    <button
                      type="button"
                      onClick={handleAddSegment}
                      disabled={!newSegmentName.trim()}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Part 4: Summary */}
      {part === 4 && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-b from-green-50 to-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 text-2xl">
                ✓
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Your First Pass</h2>
              </div>
            </div>

            {/* Item 18: Part 4 summary mentor voice */}
            <MentorVoice text={getContent('step0_p4_summary')} type="mentor_voice" className="mb-6" />

            {/* Idea Summary */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Idea</h3>
              <p className="text-lg text-slate-800">
                I'm building <strong>{idea.building || '...'}</strong> that helps{' '}
                <strong>{idea.helps || '...'}</strong> <strong>{idea.achieve || '...'}</strong>
              </p>
            </div>

            {/* Starting Point with Need Category */}
            {focusedSegment && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Your Starting Point</h3>
                <p className="text-lg text-blue-800 font-semibold mb-2">{focusedSegment.name}</p>
                {focusedSegment.need && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-blue-600">Key need: </span>
                    <span className="text-sm text-blue-700">{focusedSegment.need}</span>
                    {(() => {
                      const matchingBenefit = focusedSegment.benefits.find(b => b.text === focusedSegment.need);
                      return matchingBenefit?.needCategory ? (
                        <span className="ml-2"><NeedBadge categoryId={matchingBenefit.needCategory} /></span>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                What's Next
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                You've identified your starting point. Now it's time to get more detailed on this market.
                The Problem module will help you articulate the specific pain points your customers experience.
              </p>
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-100 p-3 rounded-lg">
                <span className="text-lg">💡</span>
                <span>
                  <strong>Remember:</strong> If this segment doesn't work out,
                  you have {otherSegments.length} other segment{otherSegments.length !== 1 ? 's' : ''} to explore. That's valuable optionality!
                </span>
              </div>
            </div>

            {/* Other Options Reminder */}
            {otherSegments.length > 0 && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                  Other Segments to Try
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  If your current target isn't working, come back and try one of these:
                </p>
                <div className="space-y-2">
                  {otherSegments.map((s: Segment) => (
                    <div key={s.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-100">
                      <span className="text-slate-700">{s.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        s.accessRank >= 4 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Access: {s.accessRank}/5
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="text-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleGraduateClick}
                className="px-8 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
              >
                Graduate to Discovery →
              </button>
              <p className="text-sm text-slate-500 mt-3">
                Begin testing your assumptions with real customer interviews
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Graduation Transition Screen */}
      {showGraduationScreen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">You've completed your First Look!</h2>
              <p className="text-sm text-slate-600 mt-2">
                Next: a quick check to articulate what you're testing before interviewing anyone.
              </p>
            </div>

            {/* Beachhead Summary */}
            {focusedSegment && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Your Beachhead Segment</p>
                <p className="text-sm font-bold text-blue-900">{focusedSegment.name}</p>
              </div>
            )}

            {/* Top 3 Assumptions to Test */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Your interviews should test these first:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">1</span>
                  <p className="text-xs text-slate-700">
                    Does <strong>{focusedSegment?.name || 'your segment'}</strong> actually experience this problem regularly?
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">2</span>
                  <p className="text-xs text-slate-700">
                    Is <strong>{focusedSegment?.name || 'your segment'}</strong> actively looking for better solutions?
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">3</span>
                  <p className="text-xs text-slate-700">
                    Would they pay to solve: <strong>"{focusedSegment?.need || 'their core need'}"</strong>?
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6">
              <p className="text-xs text-slate-600 italic">
                "You need at least 5 interviews before you can validate any assumption. One interview isn't a pattern — it's an anecdote."
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowGraduationScreen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmGraduation}
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
              >
                Continue to Quick Check
              </button>
            </div>
          </div>
        </div>
      )}

      </>
      )}
    </div>
  );
}
