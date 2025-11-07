import { useState } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';

export const IterationDashboard = () => {
  const {
    assumptions,
    interviews,
    iterations,
    addIteration,
    getUntestedAssumptions,
    getValidatedAssumptions,
    getInvalidatedAssumptions,
  } = useDiscovery();

  const [showIterationForm, setShowIterationForm] = useState(false);
  const [iterationData, setIterationData] = useState({
    changes: '',
    reasoning: '',
    selectedAssumptions: [] as string[],
    patternsObserved: '',
    riskiestAssumption: '',
    nextExperiment: '',
  });

  const untestedCount = getUntestedAssumptions().length;
  const validatedCount = getValidatedAssumptions().length;
  const invalidatedCount = getInvalidatedAssumptions().length;
  const testingCount = assumptions.filter((a) => a.status === 'testing').length;

  const handleSubmitIteration = (e: React.FormEvent) => {
    e.preventDefault();

    addIteration({
      date: new Date().toISOString(),
      changes: iterationData.changes,
      reasoning: iterationData.reasoning,
      assumptionsAffected: iterationData.selectedAssumptions,
      patternsObserved: iterationData.patternsObserved || undefined,
      riskiestAssumption: iterationData.riskiestAssumption || undefined,
      nextExperiment: iterationData.nextExperiment || undefined,
    });

    setIterationData({
      changes: '',
      reasoning: '',
      selectedAssumptions: [],
      patternsObserved: '',
      riskiestAssumption: '',
      nextExperiment: '',
    });
    setShowIterationForm(false);
  };

  const handleAssumptionToggle = (assumptionId: string) => {
    setIterationData((prev) => ({
      ...prev,
      selectedAssumptions: prev.selectedAssumptions.includes(assumptionId)
        ? prev.selectedAssumptions.filter((id) => id !== assumptionId)
        : [...prev.selectedAssumptions, assumptionId],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Iteration Dashboard</h2>
        <p className="text-gray-600">
          Reflect on patterns, update your strategy, and plan your next experiments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{assumptions.length}</div>
          <div className="text-sm text-gray-600">Total Assumptions</div>
        </div>

        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-800">{validatedCount}</div>
          <div className="text-sm text-green-700">Validated</div>
        </div>

        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-800">{invalidatedCount}</div>
          <div className="text-sm text-red-700">Invalidated</div>
        </div>

        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-800">{interviews.length}</div>
          <div className="text-sm text-blue-700">Interviews</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-4">Assumption Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Untested</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500"
                    style={{ width: `${(untestedCount / Math.max(assumptions.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 w-8">{untestedCount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Testing</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${(testingCount / Math.max(assumptions.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 w-8">{testingCount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Validated</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(validatedCount / Math.max(assumptions.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 w-8">{validatedCount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Invalidated</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(invalidatedCount / Math.max(assumptions.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 w-8">{invalidatedCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-4">Quick Insights</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">📊</span>
              <p className="text-gray-700">
                You've conducted <strong>{interviews.length}</strong> interview{interviews.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-gray-700">
                <strong>{validatedCount}</strong> assumption{validatedCount !== 1 ? 's' : ''} validated through real customer feedback
              </p>
            </div>
            {invalidatedCount > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <p className="text-gray-700">
                  <strong>{invalidatedCount}</strong> assumption{invalidatedCount !== 1 ? 's' : ''} need{invalidatedCount === 1 ? 's' : ''} revision
                </p>
              </div>
            )}
            {untestedCount > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠</span>
                <p className="text-gray-700">
                  <strong>{untestedCount}</strong> assumption{untestedCount !== 1 ? 's' : ''} still need{untestedCount === 1 ? 's' : ''} testing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reflection Prompts */}
      <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-3">💭 Reflection Questions</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• What patterns are emerging from your interviews?</li>
          <li>• Which assumption is the riskiest right now?</li>
          <li>• What surprising insights have you learned?</li>
          <li>• What should you test next?</li>
          <li>• Do you need to pivot based on what you've learned?</li>
        </ul>
      </div>

      {/* Add Iteration Button */}
      {!showIterationForm && (
        <button
          onClick={() => setShowIterationForm(true)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
        >
          + Record Iteration
        </button>
      )}

      {/* Iteration Form */}
      {showIterationForm && (
        <form onSubmit={handleSubmitIteration} className="mb-8 p-6 bg-white border-2 border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Record New Iteration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What changed? *
              </label>
              <textarea
                value={iterationData.changes}
                onChange={(e) => setIterationData({ ...iterationData, changes: e.target.value })}
                placeholder="Describe the changes you're making to your approach..."
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why? *
              </label>
              <textarea
                value={iterationData.reasoning}
                onChange={(e) => setIterationData({ ...iterationData, reasoning: e.target.value })}
                placeholder="What evidence or insights led to this change?"
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which assumptions are affected?
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border-2 border-gray-200 rounded-lg">
                {assumptions.map((assumption) => (
                  <label key={assumption.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={iterationData.selectedAssumptions.includes(assumption.id)}
                      onChange={() => handleAssumptionToggle(assumption.id)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">{assumption.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patterns observed
                </label>
                <textarea
                  value={iterationData.patternsObserved}
                  onChange={(e) => setIterationData({ ...iterationData, patternsObserved: e.target.value })}
                  placeholder="What patterns are you seeing?"
                  className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Riskiest assumption
                </label>
                <textarea
                  value={iterationData.riskiestAssumption}
                  onChange={(e) => setIterationData({ ...iterationData, riskiestAssumption: e.target.value })}
                  placeholder="What's the biggest risk now?"
                  className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next experiment
              </label>
              <textarea
                value={iterationData.nextExperiment}
                onChange={(e) => setIterationData({ ...iterationData, nextExperiment: e.target.value })}
                placeholder="What will you test next?"
                className="w-full h-24 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Save Iteration
              </button>
              <button
                type="button"
                onClick={() => setShowIterationForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Iteration History */}
      {iterations.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Iteration History</h3>
          <div className="space-y-4">
            {[...iterations]
              .sort((a, b) => b.version - a.version)
              .map((iteration) => (
                <div key={iteration.id} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2">
                        Version {iteration.version}
                      </span>
                      <p className="text-sm text-gray-500">{formatDate(iteration.date)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Changes:</span>
                      <p className="text-gray-600">{iteration.changes}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Reasoning:</span>
                      <p className="text-gray-600">{iteration.reasoning}</p>
                    </div>
                    {iteration.patternsObserved && (
                      <div>
                        <span className="font-medium text-gray-700">Patterns:</span>
                        <p className="text-gray-600">{iteration.patternsObserved}</p>
                      </div>
                    )}
                    {iteration.nextExperiment && (
                      <div>
                        <span className="font-medium text-gray-700">Next Experiment:</span>
                        <p className="text-gray-600">{iteration.nextExperiment}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
