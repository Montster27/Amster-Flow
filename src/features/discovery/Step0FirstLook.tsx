import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Segment, useStep0Store } from './step0Store';

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
        'Never miss another game or practice',
        'Save 30+ minutes per week on scheduling',
        'Feel confident they know all upcoming events',
      ],
    },
    {
      name: 'Single parents juggling multiple kids',
      benefits: [
        'One place to see all schedules at a glance',
        'Easy backup when conflicts arise',
        'Less guilt from missed events',
      ],
    },
  ],
  segments: [
    { name: 'Working parents with teens in sports', need: 'Stop missing last-minute schedule changes', accessRank: 5 },
    { name: 'Single parents juggling multiple kids', need: 'Manage multiple schedules without overwhelm', accessRank: 3 },
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

// Progress bar component - now 4 parts instead of 5
function ProgressBar({ currentPart, totalParts }: { currentPart: number; totalParts: number }) {
  const parts = ['Your Idea', 'Who & Why', 'Needs & Ranking', 'Summary'];

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
            <span className={`text-xs mt-1 ${idx === currentPart ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
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
    removeCustomerBenefit,
    segments,
    addSegment,
    syncSegmentsFromCustomers,
    updateSegmentNeed,
    updateSegmentAccessRank,
    focusedSegmentId,
    setFocusedSegmentId,
    setGraduated,
  } = useStep0Store();

  // Auto-focus newly added inputs
  const [focusTarget, setFocusTarget] = useState<{customerId: number, type: 'benefit', index: number} | null>(null);
  const [newSegmentName, setNewSegmentName] = useState('');

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

  // Sync segments when entering Part 2
  useEffect(() => {
    if (part === 2) {
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

  // Sort segments by access rank (easiest to reach first)
  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => b.accessRank - a.accessRank),
    [segments]
  );

  const focusedSegment = useMemo(
    () => segments.find((s) => s.id === focusedSegmentId) || null,
    [segments, focusedSegmentId]
  );

  // Other segments (not focused) for reminder
  const otherSegments = useMemo(
    () => segments.filter((s) => s.id !== focusedSegmentId),
    [segments, focusedSegmentId]
  );

  const nextPart = () => setPart(Math.min(3, part + 1));
  const prevPart = () => setPart(Math.max(0, part - 1));

  // Check if current part is complete enough to proceed
  const canProceed = () => {
    switch (part) {
      case 0: return idea.building.trim() && idea.helps.trim() && idea.achieve.trim();
      case 1: return customers.length > 0 && customers.some(c => c.text.trim() && c.benefits.length > 0);
      case 2: return focusedSegmentId !== null && segments.some(s => s.need.trim());
      default: return true;
    }
  };

  const handleGraduate = () => {
    setGraduated(true);
    navigate(`/project/${projectId}/discovery`, {
      state: {
        message: 'Ready to start validating! Focus on your selected segment first.',
        fromStep0: true,
        focusedSegment: focusedSegment,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <ProgressBar currentPart={part} totalParts={4} />
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
            {part === 2 && 'Needs & Ranking'}
            {part === 3 && 'Summary'}
          </div>
          <div className="text-sm text-slate-500">Step 0 · Part {part} of 3</div>
        </div>
        {part < 3 ? (
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
            onClick={handleGraduate}
          >
            Start Discovery →
          </button>
        )}
      </div>

      {/* Part 0: Your Idea */}
      {part === 0 && (
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
              <p className="text-sm text-slate-600 mb-4">
                Describe your idea in one sentence. Don't worry about perfection — you can refine this later.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    I'm building...
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
            </div>
          }
        />
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
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Tip:</strong> Be specific! "Parents" is too broad. "Working parents with teens in travel sports" is better. List as many customer types as you can!
                </p>
              </div>
            </div>
          }
          studentTitle="Your Customers & Their Benefits"
          studentContent={
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Who might benefit from your solution? What value does it provide for each group?
              </p>

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
                                  value={benefit}
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

      {/* Part 2: Needs & Ranking */}
      {part === 2 && (
        <SplitScreen
          exampleTitle="Example: Needs & Ranking"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                For each group, identify their most important need and rank how easy they are to reach:
              </p>
              {EXAMPLE_DATA.segments.map((seg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="font-semibold text-slate-800 text-sm mb-3">{seg.name}</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">Most important need:</div>
                      <div className="text-sm text-slate-700 bg-purple-50 p-2 rounded">{seg.need}</div>
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
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Key insight:</strong> Start with customers you can easily reach! You need to validate quickly before investing more time.
                </p>
              </div>
            </div>
          }
          studentTitle="Identify Needs & Rank Access"
          studentContent={
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                What is the most important need for each group? Then rank how easy they are to reach.
              </p>

              {segments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">No customer segments yet. Go back and add some.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedSegments.map((s) => (
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
                        {/* Most Important Need */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            What is their most important need?
                          </label>
                          <textarea
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            rows={2}
                            value={s.need}
                            onChange={(e) => updateSegmentNeed(s.id, e.target.value)}
                            placeholder="What problem or desire is most urgent for them?"
                          />
                        </div>

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

      {/* Part 3: Summary */}
      {part === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-b from-green-50 to-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 text-2xl">
                ✓
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Ready to Start Discovery!</h2>
                <p className="text-sm text-slate-600">Your goal: quickly find out if this is a good starting place</p>
              </div>
            </div>

            {/* Idea Summary */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Idea</h3>
              <p className="text-lg text-slate-800">
                I'm building <strong>{idea.building || '...'}</strong> that helps{' '}
                <strong>{idea.helps || '...'}</strong> <strong>{idea.achieve || '...'}</strong>
              </p>
            </div>

            {/* Starting Point */}
            {focusedSegment && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Your Starting Point</h3>
                <p className="text-lg text-blue-800 font-semibold mb-2">{focusedSegment.name}</p>
                {focusedSegment.need && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-blue-600">Their key need: </span>
                    <span className="text-sm text-blue-700">{focusedSegment.need}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Validation Goal */}
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                Your Goal in Discovery
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                Talk to 5-10 people in your starting segment. Ask about their needs and problems —
                <strong> don't pitch your solution yet.</strong> You're trying to quickly validate if this is the right place to focus.
              </p>
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-100 p-3 rounded-lg">
                <span className="text-lg">💡</span>
                <span>
                  <strong>Remember:</strong> If conversations aren't going well with this segment,
                  that's valuable information! You have {otherSegments.length} other segment{otherSegments.length !== 1 ? 's' : ''} to explore.
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
                onClick={handleGraduate}
                className="px-8 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
              >
                Start Discovery →
              </button>
              <p className="text-sm text-slate-500 mt-3">
                Begin talking to customers and validating your starting point
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
