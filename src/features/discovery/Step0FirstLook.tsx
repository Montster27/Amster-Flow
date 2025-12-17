import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfidenceLevel, Segment, useStep0Store } from './step0Store';

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
      problems: [
        'Miss important games because schedules change last-minute',
        'Spend 30+ min/week coordinating carpools via text',
        'Kids forget to tell them about schedule changes',
      ],
    },
    {
      name: 'Single parents juggling multiple kids',
      problems: [
        'No backup when work conflicts with kid activities',
        'Overwhelmed tracking 3+ different schedules',
        'Guilt about missing events they didn\'t know about',
      ],
    },
  ],
  segments: [
    { name: 'Working parents with teens in sports', pain: 5, access: 4, willingness: 4, confidence: 'several-told-me' },
    { name: 'Single parents juggling multiple kids', pain: 5, access: 3, willingness: 5, confidence: 'interviewed-30' },
  ],
  assumptions: [
    { problem: 'Miss important games because schedules change last-minute', assumption: 'Parents check their phones at least 3x daily and would see push notifications about schedule changes', impact: 'idea-dies' },
    { problem: 'Spend 30+ min/week coordinating carpools via text', assumption: 'Parents would trust other verified parents in the app enough to coordinate carpools', impact: 'shrinks' },
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

// Progress bar component
function ProgressBar({ currentPart, totalParts }: { currentPart: number; totalParts: number }) {
  const parts = ['Your Idea', 'Who & Why', 'Rank & Focus', 'Key Bets', 'Summary'];

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
    addCustomerProblem,
    updateCustomerProblem,
    removeCustomerProblem,
    segments,
    addSegment,
    syncSegmentsFromCustomers,
    updateSegment,
    focusedSegmentId,
    setFocusedSegmentId,
    focusJustification,
    setFocusJustification,
    assumptions,
    syncAssumptionsFromCustomers,
    updateAssumption,
  } = useStep0Store();

  // Auto-focus newly added inputs
  const [focusTarget, setFocusTarget] = useState<{customerId: number, type: 'problem', index: number} | null>(null);
  const [newSegmentName, setNewSegmentName] = useState('');

  useEffect(() => {
    if (focusTarget) {
      const inputId = `problem-${focusTarget.customerId}-${focusTarget.index}`;
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

  // Sync assumptions when entering Part 3
  useEffect(() => {
    if (part === 3) {
      syncAssumptionsFromCustomers();
    }
  }, [part, syncAssumptionsFromCustomers]);

  const handleAddCustomerProblem = (customerId: number, currentLength: number) => {
    addCustomerProblem(customerId, '');
    setFocusTarget({ customerId, type: 'problem', index: currentLength });
  };

  const handleAddSegment = () => {
    if (newSegmentName.trim()) {
      addSegment(newSegmentName.trim());
      setNewSegmentName('');
    }
  };

  const getConfidenceBonus = (level: ConfidenceLevel): number => {
    switch (level) {
      case 'interviewed-30': return 10;
      case 'several-told-me': return 5;
      case 'seems-logical': return -5;
      default: return 0;
    }
  };

  const totalScore = (s: Segment) => s.pain + s.access + s.willingness + getConfidenceBonus(s.confidenceLevel);

  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => totalScore(b) - totalScore(a)),
    [segments]
  );

  const focusedSegment = useMemo(
    () => segments.find((s) => s.id === focusedSegmentId) || null,
    [segments, focusedSegmentId]
  );

  const criticalAssumptions = assumptions.filter((a) => a.impactIfWrong === 'idea-dies');

  const nextPart = () => setPart(Math.min(4, part + 1));
  const prevPart = () => setPart(Math.max(0, part - 1));

  // Check if current part is complete enough to proceed
  const canProceed = () => {
    switch (part) {
      case 0: return idea.building.trim() && idea.helps.trim() && idea.achieve.trim();
      case 1: return customers.length > 0 && customers.some(c => c.text.trim() && c.problems.length > 0);
      case 2: return focusedSegmentId !== null;
      case 3: return assumptions.length > 0;
      default: return true;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
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
            {part === 2 && 'Rank & Focus'}
            {part === 3 && 'Key Bets'}
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
            onClick={() => navigate(`/project/${projectId}`)}
          >
            Continue to Discovery →
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

      {/* Part 1: Who & Why */}
      {part === 1 && (
        <SplitScreen
          exampleTitle="Example: Customers & Problems"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                Think about different types of people who might have this problem:
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
                    {customer.problems.map((problem, pidx) => (
                      <div key={pidx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{problem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Tip:</strong> Be specific! "Parents" is too broad. "Working parents with teens in travel sports" is better.
                </p>
              </div>
            </div>
          }
          studentTitle="Your Customers & Their Problems"
          studentContent={
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Who might need your solution? What specific problems do they face?
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
                            What problems do they face?
                          </label>
                          <div className="space-y-2">
                            {c.problems.map((problem, idx) => (
                              <div key={idx} className="flex gap-2 group">
                                <input
                                  id={`problem-${c.id}-${idx}`}
                                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                  value={problem}
                                  onChange={(e) => updateCustomerProblem(c.id, idx, e.target.value)}
                                  placeholder="Describe a specific pain point..."
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomerProblem(c.id, idx)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddCustomerProblem(c.id, c.problems.length)}
                              className="w-full rounded-lg border border-dashed border-red-200 px-3 py-2 text-sm text-red-400 hover:border-red-300 hover:bg-red-50"
                            >
                              + Add problem
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

      {/* Part 2: Rank & Focus */}
      {part === 2 && (
        <SplitScreen
          exampleTitle="Example: Ranking & Selection"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                Rate each customer group to find your best starting point:
              </p>
              {EXAMPLE_DATA.segments.map((seg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="font-semibold text-slate-800 text-sm mb-3">{seg.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-red-600 font-bold">{seg.pain}/5</div>
                      <div className="text-slate-500">Pain</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-blue-600 font-bold">{seg.access}/5</div>
                      <div className="text-slate-500">Access</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-green-600 font-bold">{seg.willingness}/5</div>
                      <div className="text-slate-500">Will Pay</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Key insight:</strong> High pain + high access = best for learning fast. Don't just pick the biggest market!
                </p>
              </div>
            </div>
          }
          studentTitle="Rank Your Customer Groups"
          studentContent={
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Rate each group and select one to focus on first.
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
                              Selected
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          totalScore(s) >= 12 ? 'bg-green-100 text-green-700' :
                          totalScore(s) >= 9 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {totalScore(s)} pts
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">Pain</span>
                              <span className="font-bold text-red-600">{s.pain}/5</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={s.pain}
                              onChange={(e) => updateSegment(s.id, 'pain', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">Access</span>
                              <span className="font-bold text-blue-600">{s.access}/5</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={s.access}
                              onChange={(e) => updateSegment(s.id, 'access', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">Will Pay</span>
                              <span className="font-bold text-green-600">{s.willingness}/5</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={s.willingness}
                              onChange={(e) => updateSegment(s.id, 'willingness', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="focusSegment"
                              checked={focusedSegmentId === s.id}
                              onChange={() => setFocusedSegmentId(s.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-600">Focus on this group first</span>
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

              {focusedSegmentId && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Why focus on "{focusedSegment?.name}" first?
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    rows={2}
                    value={focusJustification}
                    onChange={(e) => setFocusJustification(e.target.value)}
                    placeholder="What will you learn fastest by talking to them?"
                  />
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Part 3: Key Bets (Assumptions) */}
      {part === 3 && (
        <SplitScreen
          exampleTitle="Example: Turning Problems into Bets"
          exampleContent={
            <div className="space-y-4">
              <p className="text-sm text-amber-700 mb-4">
                Every problem you solve is a bet. Make them explicit:
              </p>
              {EXAMPLE_DATA.assumptions.map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Problem:</div>
                  <div className="text-sm text-slate-700 mb-3">{item.problem}</div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Our bet:</div>
                  <div className="text-sm text-slate-800 mb-3 font-medium">{item.assumption}</div>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    item.impact === 'idea-dies' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.impact === 'idea-dies' ? 'Critical — idea dies if wrong' : 'Important — value shrinks if wrong'}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Focus first on the bets that could kill your idea.</strong> These are your riskiest assumptions.
                </p>
              </div>
            </div>
          }
          studentTitle="Your Key Bets"
          studentContent={
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Each problem assumes something is true. What are you betting on?
              </p>

              {assumptions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">Add problems in Part 1 to see them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assumptions.map((a) => (
                    <div key={a.id} className={`rounded-lg border-2 overflow-hidden ${
                      a.impactIfWrong === 'idea-dies' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                    }`}>
                      <div className={`px-4 py-2 ${
                        a.impactIfWrong === 'idea-dies' ? 'bg-red-100' : 'bg-slate-50'
                      }`}>
                        <div className="text-xs font-semibold text-slate-500">Problem from customer research:</div>
                        <div className="text-sm text-slate-700">{a.sourceText}</div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            What's the underlying assumption?
                          </label>
                          <input
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            value={a.assumption}
                            onChange={(e) => updateAssumption(a.id, 'assumption', e.target.value)}
                            placeholder="We assume that [customers] will [do X] because..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            If this assumption is wrong...
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => updateAssumption(a.id, 'impactIfWrong', 'idea-dies')}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                a.impactIfWrong === 'idea-dies'
                                  ? 'border-red-500 bg-red-100 text-red-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-red-300'
                              }`}
                            >
                              Idea dies
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAssumption(a.id, 'impactIfWrong', 'shrinks')}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                a.impactIfWrong === 'shrinks'
                                  ? 'border-yellow-500 bg-yellow-100 text-yellow-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-yellow-300'
                              }`}
                            >
                              Value shrinks
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAssumption(a.id, 'impactIfWrong', 'nice-to-have')}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                a.impactIfWrong === 'nice-to-have'
                                  ? 'border-green-500 bg-green-100 text-green-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-green-300'
                              }`}
                            >
                              Nice to have
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {criticalAssumptions.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-lg">⚠️</span>
                    <div>
                      <div className="font-semibold text-red-800 text-sm">
                        {criticalAssumptions.length} Critical Assumption{criticalAssumptions.length > 1 ? 's' : ''}
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Test these first — if any are wrong, your idea won't work.
                      </p>
                    </div>
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
                <h2 className="text-xl font-bold text-slate-800">Step 0 Complete!</h2>
                <p className="text-sm text-slate-600">Here's your focused starting point:</p>
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

            {/* Focus Group */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Focus Group</h3>
              <p className="text-lg text-blue-800 font-semibold">{focusedSegment?.name || 'Not selected'}</p>
              {focusJustification && (
                <p className="text-sm text-blue-700 mt-2">Why: {focusJustification}</p>
              )}
            </div>

            {/* Critical Assumptions */}
            {criticalAssumptions.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">
                  Critical Assumptions to Test
                </h3>
                <ul className="space-y-2">
                  {criticalAssumptions.map((a) => (
                    <li key={a.id} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="text-red-500 mt-0.5">⚠️</span>
                      <span>{a.assumption || a.sourceText}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                Suggested Next Steps
              </h3>
              <ol className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs font-bold shrink-0">1</span>
                  <span>Interview 5 people from your focus group ({focusedSegment?.name || 'selected segment'})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs font-bold shrink-0">2</span>
                  <span>Ask about their problems — don't pitch your solution yet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs font-bold shrink-0">3</span>
                  <span>Test your critical assumptions before building anything</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate(`/project/${projectId}`)}
              className="px-8 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
            >
              Continue to Discovery Module →
            </button>
            <p className="text-sm text-slate-500 mt-3">
              The Discovery module will guide you through customer interviews and assumption testing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
