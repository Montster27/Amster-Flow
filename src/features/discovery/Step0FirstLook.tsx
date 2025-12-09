import React, { useMemo } from 'react';
import { Benefit, Segment, useStep0Store } from './step0Store';

export function Step0FirstLook() {
  const {
    part,
    setPart,
    customer,
    setCustomer,
    problem,
    setProblem,
    benefitSummary,
    setBenefitSummary,
    segments,
    addSegment,
    updateSegment,
    focusedSegmentId,
    setFocusedSegmentId,
    focusJustification,
    setFocusJustification,
    benefits,
    addBenefit,
    updateBenefit,
  } = useStep0Store();

  const composedSentence =
    customer || problem || benefitSummary
      ? `We help ${customer || '[customer]'} who struggle with ${
          problem || '[problem]'
        } by ${benefitSummary || '[benefit]'}.`
      : '';

  const totalScore = (s: Segment) => s.pain + s.access + s.willingness;

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
          <section className="space-y-3 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">0.1 · One Sentence, One Customer</h2>
            <p className="text-sm text-slate-600">
              Start with one specific customer, one problem, and one outcome. You can always change this later.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Target customer</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g., HR managers at 100–500 person companies"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Problem</label>
                <textarea
                  className="w-full rounded border px-2 py-1 text-sm"
                  rows={2}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What is the most painful thing they deal with?"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Benefit / outcome</label>
                <textarea
                  className="w-full rounded border px-2 py-1 text-sm"
                  rows={2}
                  value={benefitSummary}
                  onChange={(e) => setBenefitSummary(e.target.value)}
                  placeholder="What changes for them because of you?"
                />
              </div>
            </div>
            {composedSentence && (
              <div className="mt-2 rounded border bg-slate-50 px-3 py-2 text-sm italic">{composedSentence}</div>
            )}
          </section>
        )}

        {part === 2 && (
          <section className="space-y-3 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">0.2 · Rank Potential Customer Groups</h2>
            <p className="text-sm text-slate-600">
              Add the groups you're considering and rank them on pain, access, and willingness to pay/change.
            </p>
            <div className="flex gap-2">
              <button type="button" className="rounded border px-3 py-1 text-sm" onClick={handleAddSegment}>
                Add group
              </button>
            </div>
            {segments.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border px-2 py-1 text-left">Customer group</th>
                      <th className="border px-2 py-1 text-center">Pain</th>
                      <th className="border px-2 py-1 text-center">Access</th>
                      <th className="border px-2 py-1 text-center">Willingness</th>
                      <th className="border px-2 py-1 text-center">Total score</th>
                      <th className="border px-2 py-1 text-center">Primary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((s) => (
                      <tr key={s.id}>
                        <td className="border px-2 py-1">{s.name}</td>
                        {(['pain', 'access', 'willingness'] as const).map((field) => (
                          <td key={field} className="border px-2 py-1 text-center">
                            <select
                              className="rounded border px-1 py-0.5 text-xs"
                              value={s[field]}
                              onChange={(e) => updateSegment(s.id, field, Number(e.target.value))}
                            >
                              {[1, 2, 3, 4, 5].map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </td>
                        ))}
                        <td className="border px-2 py-1 text-center">
                          <span className="rounded-full border px-2 py-0.5 text-xs">{totalScore(s)}</span>
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <input
                            type="radio"
                            name="primarySegment"
                            checked={focusedSegmentId === s.id}
                            onChange={() => setFocusedSegmentId(s.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Hint: You don't have to pick the highest score, but you should be able to explain why if you don't.
            </p>
          </section>
        )}

        {part === 3 && (
          <section className="space-y-3 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">0.3 · If You Could Save Only One User…</h2>
            <p className="text-sm text-slate-600">
              For the next month, which group will give you the clearest signal about whether this idea is any good?
            </p>
            {topSegments.length === 0 ? (
              <p className="text-sm text-slate-500">Add and rank customer groups in 0.2 first.</p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {topSegments.map((s) => (
                    <label
                      key={s.id}
                      className={`cursor-pointer rounded-lg border p-3 text-sm ${
                        focusedSegmentId === s.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="mb-1 font-semibold">{s.name}</div>
                      <div className="text-xs text-slate-600">
                        Pain: {s.pain} · Access: {s.access} · Willingness: {s.willingness} · Total: {totalScore(s)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="radio"
                          name="focusChoice"
                          className="h-3 w-3"
                          checked={focusedSegmentId === s.id}
                          onChange={() => setFocusedSegmentId(s.id)}
                        />
                        <span>Focus on this group first</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Why is this the best group to learn from first?</label>
                  <textarea
                    className="w-full rounded border px-2 py-1 text-sm"
                    rows={3}
                    value={focusJustification}
                    onChange={(e) => setFocusJustification(e.target.value)}
                    placeholder="What will you learn fastest by talking to them first?"
                  />
                </div>
              </>
            )}
          </section>
        )}

        {part === 4 && (
          <section className="space-y-3 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">0.4 · Benefits → Testable Assumptions</h2>
            <p className="text-sm text-slate-600">
              Start with your hype, then turn each benefit into a testable assumption about your focused segment.
            </p>
            <div className="flex gap-2">
              <button type="button" className="rounded border px-3 py-1 text-sm" onClick={handleAddBenefit}>
                Add benefit
              </button>
            </div>
            {benefits.length > 0 && (
              <div className="mt-2 space-y-3">
                {benefits.map((b) => (
                  <div key={b.id} className="space-y-2 rounded-lg border bg-slate-50 p-3 text-sm">
                    <div>
                      <div className="text-xs font-medium text-slate-500">Benefit</div>
                      <div>{b.text}</div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Translate this into an assumption about {focusedSegment?.name || 'your focused group'}
                      </label>
                      <input
                        className="w-full rounded border px-2 py-1 text-xs"
                        value={b.assumption}
                        onChange={(e) => updateBenefit(b.id, 'assumption', e.target.value)}
                        placeholder="We assume that…"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-medium">If this is wrong:</label>
                      <select
                        className="rounded border px-2 py-1 text-xs"
                        value={b.impactIfWrong}
                        onChange={(e) =>
                          updateBenefit(b.id, 'impactIfWrong', e.target.value as Benefit['impactIfWrong'])
                        }
                      >
                        <option value="">Select impact</option>
                        <option value="idea-dies">The idea dies</option>
                        <option value="shrinks">Value shrinks a lot</option>
                        <option value="nice-to-have">Nice to have only</option>
                      </select>
                      {b.impactIfWrong === 'idea-dies' && (
                        <span className="text-xs font-semibold text-red-600">Critical assumption</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {part === 5 && (
          <section className="space-y-3 rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">0.5 · Value Visualization – Narrow vs Broad</h2>
            <p className="text-sm text-slate-600">
              Compare the value you claim to provide for everyone with the value that really matters to your focused segment.
            </p>
            {benefits.length === 0 ? (
              <p className="text-sm text-slate-500">Add some benefits and assumptions in 0.4 first.</p>
            ) : (
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Value We Think We Provide (All Users)</h3>
                  <ul className="space-y-1">
                    {benefits.map((b) => (
                      <li key={b.id} className="rounded border bg-slate-50 px-2 py-1">
                        {b.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Value That Actually Matters to {focusedSegment?.name || 'Focused Segment'}
                  </h3>
                  <div className="space-y-3">
                    {benefits.map((b) => (
                      <div key={b.id} className="space-y-1 rounded border bg-slate-50 px-2 py-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={b.mattersToFocused}
                            onChange={(e) => updateBenefit(b.id, 'mattersToFocused', e.target.checked)}
                          />
                          <span>Matters a lot to this group</span>
                        </label>
                        {b.mattersToFocused && (
                          <>
                            <input
                              className="w-full rounded border px-2 py-1 text-xs"
                              placeholder="Rewrite this in their words"
                              value={b.focusedVersion}
                              onChange={(e) => updateBenefit(b.id, 'focusedVersion', e.target.value)}
                            />
                            <div className="flex items-center gap-2 text-xs">
                              <span>Importance to this group:</span>
                              <select
                                className="rounded border px-1 py-0.5 text-xs"
                                value={b.importanceToFocused ?? 3}
                                onChange={(e) => updateBenefit(b.id, 'importanceToFocused', Number(e.target.value))}
                              >
                                {[1, 2, 3, 4, 5].map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    {benefits.filter((b) => b.mattersToFocused).length} of {benefits.length} claimed benefits actually
                    matter to your focused segment.
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="w-full rounded-lg border bg-slate-50 p-4 text-sm md:w-72">
        <h3 className="text-base font-semibold">Step 0 Snapshot</h3>
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs font-medium text-slate-500">Focused customer group</div>
            <div>{focusedSegment?.name || 'Not chosen yet'}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">One-sentence idea</div>
            <div className="mt-1 text-xs italic">{composedSentence || 'Fill out 0.1 to see this.'}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Critical assumptions</div>
            <ul className="mt-1 list-inside list-disc text-xs">
              {criticalAssumptions.slice(0, 3).map((b) => (
                <li key={b.id}>{b.assumption || b.text}</li>
              ))}
              {criticalAssumptions.length === 0 && <li>None flagged yet.</li>}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
