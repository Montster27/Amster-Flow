import { useEffect, useMemo, useState } from 'react';
import { ConfidenceLevel, Segment, useStep0Store } from './step0Store';

export function Step0FirstLook() {
  const {
    part,
    setPart,
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    addCustomerProblem,
    updateCustomerProblem,
    removeCustomerProblem,
    addCustomerBenefit,
    updateCustomerBenefit,
    removeCustomerBenefit,
    segments,
    addSegment,
    syncSegmentsFromCustomers,
    updateSegment,
    focusedSegmentId,
    setFocusedSegmentId,
    focusJustification,
    setFocusJustification,
    benefits,
    addBenefit,
    updateBenefit,
  } = useStep0Store();

  // Sync segments from customers when entering Part 2
  useEffect(() => {
    if (part === 2) {
      syncSegmentsFromCustomers();
    }
  }, [part, syncSegmentsFromCustomers]);

  // Auto-focus newly added inputs
  const [focusTarget, setFocusTarget] = useState<{customerId: number, type: 'problem' | 'benefit', index: number} | null>(null);

  useEffect(() => {
    if (focusTarget) {
      const inputId = `${focusTarget.type}-${focusTarget.customerId}-${focusTarget.index}`;
      const element = document.getElementById(inputId);
      if (element) {
        element.focus();
      }
      setFocusTarget(null);
    }
  }, [focusTarget, customers]);

  const handleAddCustomerProblem = (customerId: number, currentLength: number) => {
    addCustomerProblem(customerId, '');
    setFocusTarget({ customerId, type: 'problem', index: currentLength });
  };

  const handleAddCustomerBenefit = (customerId: number, currentLength: number) => {
    addCustomerBenefit(customerId, '');
    setFocusTarget({ customerId, type: 'benefit', index: currentLength });
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

  const topSegments = useMemo(
    () =>
      [...segments]
        .sort((a, b) => totalScore(b) - totalScore(a))
        .slice(0, 3),
    [segments]
  );

  const criticalAssumptions = benefits.filter((b) => b.impactIfWrong === 'idea-dies');
  const focusedSegment = useMemo(
    () => segments.find((s) => s.id === focusedSegmentId) || null,
    [segments, focusedSegmentId]
  );

  const handleAddSegment = () => {
    const input = prompt('Add a customer group (e.g., parents of teens)');
    if (input && input.trim()) addSegment(input.trim());
  };

  const handleAddBenefit = () => {
    const input = prompt('Add a benefit (e.g., saves managers a ton of time)');
    if (input && input.trim()) addBenefit(input.trim());
  };

  const nextPart = () => setPart(Math.min(5, part + 1));
  const prevPart = () => setPart(Math.max(1, part - 1));

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Step 0 · The First Look
            </div>
            <div className="text-sm text-slate-700">Part {part} of 5 inside this step</div>
          </div>
          <div className="space-x-2">
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              onClick={prevPart}
              disabled={part === 1}
            >
              Back
            </button>
            <button type="button" className="rounded border px-3 py-1 text-sm" onClick={nextPart}>
              Next
            </button>
          </div>
        </div>

        {part === 1 && (
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">0.1 · Your Customers, Problems & Benefits</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Who are you building for? What pain do they have? How will you help them?
              </p>
            </div>

            {/* Empty State */}
            {customers.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-base font-medium text-slate-700 mb-1">No customers defined yet</h3>
                <p className="text-sm text-slate-500 mb-4">Start by adding your first target customer segment</p>
                <button
                  type="button"
                  onClick={() => addCustomer('')}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + Add your first customer
                </button>
              </div>
            )}

            {/* Customer Cards */}
            <div className="space-y-6">
              {customers.map((c, customerIndex) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 overflow-hidden shadow-sm">
                  {/* Customer Header */}
                  <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                        {customerIndex + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">Customer Segment</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomer(c.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded p-1 transition-colors"
                      title="Remove customer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Customer Name */}
                  <div className="px-5 py-4 border-b border-slate-100">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Who are they?
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400"
                      value={c.text}
                      onChange={(e) => updateCustomer(c.id, e.target.value)}
                      placeholder="e.g., HR managers at mid-size tech companies (100-500 employees)"
                    />
                  </div>

                  {/* Problems and Benefits Grid */}
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Problems Column */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                        <label className="text-sm font-semibold text-slate-700">Problems they face</label>
                      </div>
                      <div className="space-y-2">
                        {c.problems.map((problem, idx) => (
                          <div key={idx} className="flex gap-2 group">
                            <input
                              id={`problem-${c.id}-${idx}`}
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-400"
                              value={problem}
                              onChange={(e) => updateCustomerProblem(c.id, idx, e.target.value)}
                              placeholder="What frustrates or challenges them?"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomerProblem(c.id, idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 rounded p-1.5 transition-all"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddCustomerProblem(c.id, c.problems.length)}
                          className="w-full rounded-lg border border-dashed border-red-200 px-3 py-2 text-sm text-red-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          + Add problem
                        </button>
                      </div>
                    </div>

                    {/* Benefits Column */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <label className="text-sm font-semibold text-slate-700">Benefits you provide</label>
                      </div>
                      <div className="space-y-2">
                        {c.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex gap-2 group">
                            <input
                              id={`benefit-${c.id}-${idx}`}
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                              value={benefit}
                              onChange={(e) => updateCustomerBenefit(c.id, idx, e.target.value)}
                              placeholder="How will their life improve?"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomerBenefit(c.id, idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 rounded p-1.5 transition-all"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddCustomerBenefit(c.id, c.benefits.length)}
                          className="w-full rounded-lg border border-dashed border-green-200 px-3 py-2 text-sm text-green-500 hover:border-green-300 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          + Add benefit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Customer Button */}
              {customers.length > 0 && (
                <button
                  type="button"
                  onClick={() => addCustomer('')}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 px-6 py-4 text-sm font-medium text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another customer segment
                </button>
              )}
            </div>
          </section>
        )}

        {part === 2 && (
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">0.2 · Rank Potential Customer Groups</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Rate each customer group on pain intensity, your access to them, and their willingness to pay or change behavior.
              </p>
            </div>

            {/* Empty State */}
            {segments.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-base font-medium text-slate-700 mb-1">No customer groups to rank</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {customers.length === 0
                    ? 'Go back to Part 1 and add some customers first'
                    : 'Customer groups will appear here automatically from Part 1'}
                </p>
                {customers.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setPart(1)}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    ← Go to Part 1
                  </button>
                )}
              </div>
            )}

            {/* Segment Cards */}
            <div className="space-y-4">
              {segments.map((s, index) => (
                <div
                  key={s.id}
                  className={`rounded-xl border overflow-hidden shadow-sm transition-all ${
                    focusedSegmentId === s.id
                      ? 'border-blue-400 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-gradient-to-b from-white to-slate-50'
                  }`}
                >
                  {/* Segment Header */}
                  <div className={`px-5 py-3 border-b flex items-center justify-between ${
                    focusedSegmentId === s.id ? 'bg-blue-50 border-blue-100' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                        focusedSegmentId === s.id ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{s.name || '(unnamed segment)'}</span>
                      {focusedSegmentId === s.id && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          Primary Focus
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        totalScore(s) >= 12 ? 'bg-green-100 text-green-700' :
                        totalScore(s) >= 9 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        Score: {totalScore(s)}/15
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Problems Preview */}
                    {s.problems && s.problems.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Their Problems</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.problems.map((problem, idx) => (
                            <span key={idx} className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs border border-red-100">
                              {problem || '(empty)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ranking Sliders */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Pain */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pain Level</label>
                          <span className={`text-sm font-bold ${
                            s.pain >= 4 ? 'text-red-600' : s.pain >= 3 ? 'text-yellow-600' : 'text-slate-500'
                          }`}>{s.pain}/5</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={s.pain}
                          onChange={(e) => updateSegment(s.id, 'pain', Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <p className="text-xs text-slate-400">How severe is their problem?</p>
                      </div>

                      {/* Access */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Access</label>
                          <span className={`text-sm font-bold ${
                            s.access >= 4 ? 'text-blue-600' : s.access >= 3 ? 'text-yellow-600' : 'text-slate-500'
                          }`}>{s.access}/5</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={s.access}
                          onChange={(e) => updateSegment(s.id, 'access', Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-slate-400">Can you reach them easily?</p>
                      </div>

                      {/* Willingness */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Willingness</label>
                          <span className={`text-sm font-bold ${
                            s.willingness >= 4 ? 'text-green-600' : s.willingness >= 3 ? 'text-yellow-600' : 'text-slate-500'
                          }`}>{s.willingness}/5</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={s.willingness}
                          onChange={(e) => updateSegment(s.id, 'willingness', Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <p className="text-xs text-slate-400">Will they pay or change?</p>
                      </div>
                    </div>

                    {/* Primary Selection */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="primarySegment"
                          checked={focusedSegmentId === s.id}
                          onChange={() => setFocusedSegmentId(s.id)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">
                          Focus on this group first
                        </span>
                      </label>
                    </div>

                    {/* Confidence Level */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        How confident are you about this group?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => updateSegment(s.id, 'confidenceLevel', 'interviewed-30')}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                            s.confidenceLevel === 'interviewed-30'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Interviewed 30+ people</span>
                            <span className={`font-bold ${s.confidenceLevel === 'interviewed-30' ? 'text-green-600' : 'text-green-500'}`}>+10</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSegment(s.id, 'confidenceLevel', 'several-told-me')}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                            s.confidenceLevel === 'several-told-me'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Several people told me</span>
                            <span className={`font-bold ${s.confidenceLevel === 'several-told-me' ? 'text-blue-600' : 'text-blue-500'}`}>+5</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSegment(s.id, 'confidenceLevel', 'seems-logical')}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                            s.confidenceLevel === 'seems-logical'
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Seems logical to me</span>
                            <span className={`font-bold ${s.confidenceLevel === 'seems-logical' ? 'text-amber-600' : 'text-amber-500'}`}>-5</span>
                          </div>
                        </button>
                      </div>
                      {s.confidenceLevel && (
                        <div className="mt-2 text-xs text-slate-500">
                          Confidence bonus: <span className={`font-bold ${getConfidenceBonus(s.confidenceLevel) > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                            {getConfidenceBonus(s.confidenceLevel) > 0 ? '+' : ''}{getConfidenceBonus(s.confidenceLevel)}
                          </span> applied to total score
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Manual Segment */}
              {segments.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddSegment}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 px-6 py-4 text-sm font-medium text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another customer group manually
                </button>
              )}
            </div>

            {/* Hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <span className="text-amber-500 text-lg">💡</span>
              <p className="text-sm text-amber-800">
                <strong>Tip:</strong> You don't have to pick the highest-scoring group. Choose the one that will give you the clearest signal about whether your idea works.
              </p>
            </div>
          </section>
        )}

        {part === 3 && (
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">0.3 · Choose Your Focus Group</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                If you could only talk to one customer group for the next month, which would give you the clearest signal about your idea?
              </p>
            </div>

            {/* Empty State */}
            {topSegments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-base font-medium text-slate-700 mb-1">No customer groups ranked yet</h3>
                <p className="text-sm text-slate-500 mb-4">Complete Part 2 to rank your customer groups first</p>
                <button
                  type="button"
                  onClick={() => setPart(2)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ← Go to Part 2
                </button>
              </div>
            ) : (
              <>
                {/* Top 3 Segments */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Your Top 3 Customer Groups</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {topSegments.map((s, index) => (
                      <label
                        key={s.id}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                          focusedSegmentId === s.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-slate-200 text-slate-600' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            totalScore(s) >= 12 ? 'bg-green-100 text-green-700' :
                            totalScore(s) >= 9 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {totalScore(s)}/15
                          </span>
                        </div>

                        {/* Segment Name */}
                        <div className="font-semibold text-slate-800 mb-2">{s.name}</div>

                        {/* Score Breakdown */}
                        <div className="space-y-1 text-xs mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Pain</span>
                            <span className="font-medium text-red-600">{s.pain}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Access</span>
                            <span className="font-medium text-blue-600">{s.access}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Willingness</span>
                            <span className="font-medium text-green-600">{s.willingness}/5</span>
                          </div>
                        </div>

                        {/* Selection */}
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="focusChoice"
                              className="w-4 h-4 text-blue-600"
                              checked={focusedSegmentId === s.id}
                              onChange={() => setFocusedSegmentId(s.id)}
                            />
                            <span className="text-sm text-slate-600">Focus on this group</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Justification */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Why is "{focusedSegment?.name || 'this group'}" the best to learn from first?
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400"
                    rows={3}
                    value={focusJustification}
                    onChange={(e) => setFocusJustification(e.target.value)}
                    placeholder="Explain your reasoning. What will you learn fastest by talking to them? Why are they the best signal for your idea?"
                  />
                </div>

                {/* Tip */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-blue-500 text-lg">💡</span>
                  <p className="text-sm text-blue-800">
                    <strong>Remember:</strong> The best group to focus on isn't always the highest-scoring one. Choose the group where you'll get the clearest, fastest feedback about whether your idea solves a real problem.
                  </p>
                </div>
              </>
            )}
          </section>
        )}

        {part === 4 && (
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">0.4 · Turn Benefits into Testable Assumptions</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                What benefits do you claim to provide? Convert each one into an assumption you can test with your focus group.
              </p>
            </div>

            {/* Empty State */}
            {benefits.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-3">🧪</div>
                <h3 className="text-base font-medium text-slate-700 mb-1">No benefits listed yet</h3>
                <p className="text-sm text-slate-500 mb-4">Start by adding the benefits you believe your product provides</p>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + Add your first benefit
                </button>
              </div>
            )}

            {/* Benefits List */}
            {benefits.length > 0 && (
              <div className="space-y-4">
                {benefits.map((b, index) => (
                  <div key={b.id} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Benefit Header */}
                    <div className={`px-5 py-3 border-b flex items-center justify-between ${
                      b.impactIfWrong === 'idea-dies' ? 'bg-red-50 border-red-100' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                          b.impactIfWrong === 'idea-dies' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">Claimed Benefit</span>
                        {b.impactIfWrong === 'idea-dies' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            Critical Assumption
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Benefit Text */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          What benefit do you claim?
                        </label>
                        <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                          {b.text}
                        </div>
                      </div>

                      {/* Assumption */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Reframe as a testable assumption for {focusedSegment?.name || 'your focus group'}
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400"
                          value={b.assumption}
                          onChange={(e) => updateBenefit(b.id, 'assumption', e.target.value)}
                          placeholder="We assume that [focus group] will [specific behavior] because [this benefit]..."
                        />
                      </div>

                      {/* Impact Rating */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          If this assumption is wrong, what happens to your idea?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => updateBenefit(b.id, 'impactIfWrong', 'idea-dies')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                              b.impactIfWrong === 'idea-dies'
                                ? 'border-red-500 bg-red-100 text-red-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-red-300'
                            }`}
                          >
                            <div className="font-bold">💀 Idea Dies</div>
                            <div className="text-xs opacity-75">Critical failure</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBenefit(b.id, 'impactIfWrong', 'shrinks')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                              b.impactIfWrong === 'shrinks'
                                ? 'border-yellow-500 bg-yellow-100 text-yellow-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-yellow-300'
                            }`}
                          >
                            <div className="font-bold">📉 Value Shrinks</div>
                            <div className="text-xs opacity-75">Significant impact</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBenefit(b.id, 'impactIfWrong', 'nice-to-have')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                              b.impactIfWrong === 'nice-to-have'
                                ? 'border-green-500 bg-green-100 text-green-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-green-300'
                            }`}
                          >
                            <div className="font-bold">✨ Nice to Have</div>
                            <div className="text-xs opacity-75">Minor impact</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Benefit Button */}
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 px-6 py-4 text-sm font-medium text-slate-500 hover:border-green-400 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another benefit
                </button>
              </div>
            )}

            {/* Critical Summary */}
            {criticalAssumptions.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">
                      {criticalAssumptions.length} Critical Assumption{criticalAssumptions.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-sm text-red-700">
                      These assumptions must be validated first — if any are wrong, your idea won't work.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {part === 5 && (
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">0.5 · Narrow Your Value Proposition</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Not all benefits matter equally to your focus group. Identify what truly resonates with them vs. what's just marketing noise.
              </p>
            </div>

            {/* Empty State */}
            {benefits.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-base font-medium text-slate-700 mb-1">No benefits to evaluate</h3>
                <p className="text-sm text-slate-500 mb-4">Add some benefits in Part 4 first</p>
                <button
                  type="button"
                  onClick={() => setPart(4)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ← Go to Part 4
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Broad Value */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Value for Everyone (Broad)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    These are all the benefits you claim to provide to the general market.
                  </p>
                  <div className="space-y-2">
                    {benefits.map((b) => (
                      <div key={b.id} className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
                        <div className="text-sm text-purple-800">{b.text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Focused Value */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Value for {focusedSegment?.name || 'Focus Group'} (Narrow)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Which benefits truly matter to your focus group? Check the ones that resonate.
                  </p>
                  <div className="space-y-3">
                    {benefits.map((b) => (
                      <div
                        key={b.id}
                        className={`rounded-xl border-2 p-4 transition-all ${
                          b.mattersToFocused
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={b.mattersToFocused}
                            onChange={(e) => updateBenefit(b.id, 'mattersToFocused', e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className={`text-sm ${b.mattersToFocused ? 'text-blue-800 font-medium' : 'text-slate-600'}`}>
                              {b.text}
                            </div>
                          </div>
                        </label>

                        {/* Expanded Options */}
                        {b.mattersToFocused && (
                          <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-blue-700 mb-1">
                                How would they describe this benefit?
                              </label>
                              <input
                                className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400"
                                placeholder="Rewrite in their words..."
                                value={b.focusedVersion}
                                onChange={(e) => updateBenefit(b.id, 'focusedVersion', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-blue-700 mb-2">
                                How important is this to them?
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={b.importanceToFocused ?? 3}
                                  onChange={(e) => updateBenefit(b.id, 'importanceToFocused', Number(e.target.value))}
                                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm font-bold text-blue-700 w-8 text-center">
                                  {b.importanceToFocused ?? 3}/5
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {benefits.length > 0 && (
              <div className={`rounded-lg p-4 border ${
                benefits.filter((b) => b.mattersToFocused).length === 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {benefits.filter((b) => b.mattersToFocused).length === 0 ? '⚠️' : '✅'}
                  </span>
                  <div>
                    <h4 className={`font-semibold mb-1 ${
                      benefits.filter((b) => b.mattersToFocused).length === 0
                        ? 'text-amber-800'
                        : 'text-green-800'
                    }`}>
                      {benefits.filter((b) => b.mattersToFocused).length} of {benefits.length} benefits matter to your focus group
                    </h4>
                    <p className={`text-sm ${
                      benefits.filter((b) => b.mattersToFocused).length === 0
                        ? 'text-amber-700'
                        : 'text-green-700'
                    }`}>
                      {benefits.filter((b) => b.mattersToFocused).length === 0
                        ? 'None of your claimed benefits resonate with your focus group. This is a red flag — either refine your benefits or reconsider your focus group.'
                        : benefits.filter((b) => b.mattersToFocused).length < benefits.length / 2
                          ? 'Only a few benefits resonate. Focus your messaging on what truly matters to them.'
                          : 'Great alignment! Most of your benefits resonate with your focus group.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="w-full rounded-xl border border-slate-200 bg-white p-5 text-sm md:w-80 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Step 0 Snapshot
        </h3>

        <div className="space-y-4">
          {/* Focus Group */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Focus Group</div>
            {focusedSegment ? (
              <div className="font-medium text-slate-800">{focusedSegment.name}</div>
            ) : (
              <div className="text-slate-400 italic">Not chosen yet</div>
            )}
          </div>

          {/* Target Customers */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Target Customers ({customers.length})
            </div>
            {customers.length > 0 ? (
              <div className="space-y-1">
                {customers.slice(0, 3).map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{c.text || '(unnamed)'}</span>
                  </div>
                ))}
                {customers.length > 3 && (
                  <div className="text-xs text-slate-400 ml-7">+{customers.length - 3} more</div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm">Add customers in Part 1</div>
            )}
          </div>

          {/* Critical Assumptions */}
          <div className={`rounded-lg p-3 border ${
            criticalAssumptions.length > 0
              ? 'bg-red-50 border-red-100'
              : 'bg-slate-50 border-slate-100'
          }`}>
            <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
              criticalAssumptions.length > 0 ? 'text-red-600' : 'text-slate-500'
            }`}>
              Critical Assumptions ({criticalAssumptions.length})
            </div>
            {criticalAssumptions.length > 0 ? (
              <div className="space-y-2">
                {criticalAssumptions.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <span className="text-sm text-red-700">{b.assumption || b.text}</span>
                  </div>
                ))}
                {criticalAssumptions.length > 3 && (
                  <div className="text-xs text-red-400 ml-6">+{criticalAssumptions.length - 3} more</div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm">None flagged yet</div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Progress</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <div
                  key={p}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    p < part ? 'bg-blue-500' :
                    p === part ? 'bg-blue-300' :
                    'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-blue-600 mt-2">Part {part} of 5</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
