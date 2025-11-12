import { useState } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import type { Evidence } from '../../types/pivot';

interface EvidenceQualityPanelProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Evidence Quality Scoring Panel (Detailed Mode)
 *
 * Purpose: Force rigorous evaluation of contradictory evidence
 * Prevents dismissing disconfirming data without proper analysis
 *
 * Scores evidence on 4 dimensions (1-5 each):
 * - Source credibility: How trustworthy is the source?
 * - Sample size: How many data points support this?
 * - Recency: How recent is this evidence?
 * - Directness: How directly does this measure what matters?
 *
 * Research: Evidence-based decision making frameworks
 */
export function EvidenceQualityPanel({ onContinue, onBack }: EvidenceQualityPanelProps) {
  const { currentDecision, addEvidence, updateEvidence, deleteEvidence } = usePivot();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [sourceCredibility, setSourceCredibility] = useState(3);
  const [sampleSize, setSampleSize] = useState(3);
  const [recency, setRecency] = useState(3);
  const [directness, setDirectness] = useState(3);
  const [contradicts, setContradicts] = useState(true);

  const evidence = currentDecision?.contradictoryEvidence || [];

  const resetForm = () => {
    setDescription('');
    setSource('');
    setSourceCredibility(3);
    setSampleSize(3);
    setRecency(3);
    setDirectness(3);
    setContradicts(true);
    setShowAddForm(false);
    setEditingId(null);
  };

  const calculateQualityScore = (cred: number, size: number, rec: number, dir: number) => {
    return Math.round(((cred + size + rec + dir) / 20) * 100);
  };

  const handleAdd = () => {
    const qualityScore = calculateQualityScore(sourceCredibility, sampleSize, recency, directness);

    const newEvidence: Evidence = {
      id: Date.now().toString(),
      description,
      source,
      type: contradicts ? 'contradictory' : 'supporting',
      contradicts,
      qualityScore: {
        sourceCredibility,
        sampleSize,
        recency,
        directness,
        overall: qualityScore,
      },
    };

    addEvidence(newEvidence);
    resetForm();
  };

  const handleEdit = (ev: Evidence) => {
    setEditingId(ev.id);
    setDescription(ev.description);
    setSource(ev.source);
    setSourceCredibility(ev.qualityScore?.sourceCredibility ?? 3);
    setSampleSize(ev.qualityScore?.sampleSize ?? 3);
    setRecency(ev.qualityScore?.recency ?? 3);
    setDirectness(ev.qualityScore?.directness ?? 3);
    setContradicts(ev.contradicts ?? true);
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;

    const qualityScore = calculateQualityScore(sourceCredibility, sampleSize, recency, directness);

    updateEvidence(editingId, {
      description,
      source,
      contradicts,
      qualityScore: {
        sourceCredibility,
        sampleSize,
        recency,
        directness,
        overall: qualityScore,
      },
    });

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this evidence?')) {
      deleteEvidence(id);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (value: number) => {
    const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return labels[value] || 'Medium';
  };

  const canSubmit = description.trim() && source.trim();

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Evidence Quality Assessment
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why score evidence?</strong> Research shows that systematically evaluating
            contradictory evidence reduces confirmation bias by 40%.
          </p>
          <p className="text-sm text-blue-800">
            This forces you to honestly assess the quality of data that challenges your strategy,
            not just dismiss it because it's uncomfortable.
          </p>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Contradictory Evidence
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {evidence.length} {evidence.length === 1 ? 'piece' : 'pieces'} of evidence tracked
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
            >
              + Add Evidence
            </button>
          </div>
        </div>

        {evidence.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-gray-600 mb-4">
              No evidence tracked yet. Add contradictory evidence that challenges your current strategy.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
            >
              Add Your First Evidence
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credibility
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample Size
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recency
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Directness
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium">{ev.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{ev.source}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {ev.qualityScore?.sourceCredibility ?? 0}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {ev.qualityScore?.sampleSize ?? 0}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {ev.qualityScore?.recency ?? 0}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {ev.qualityScore?.directness ?? 0}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(ev.qualityScore?.overall ?? 0)}`}>
                        {ev.qualityScore?.overall ?? 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(ev)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Edit Evidence' : 'Add Contradictory Evidence'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 3 out of 5 pilot customers churned within first month"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source *
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., Mixpanel dashboard, Customer interviews, Survey results"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Quality Dimensions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Quality Assessment (1-5 scale)</h4>

                {/* Source Credibility */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Source Credibility
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {sourceCredibility}/5 - {getScoreLabel(sourceCredibility)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={sourceCredibility}
                    onChange={(e) => setSourceCredibility(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    How trustworthy and reliable is this source?
                  </p>
                </div>

                {/* Sample Size */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Sample Size
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {sampleSize}/5 - {getScoreLabel(sampleSize)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    How many data points support this evidence?
                  </p>
                </div>

                {/* Recency */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Recency
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {recency}/5 - {getScoreLabel(recency)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={recency}
                    onChange={(e) => setRecency(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    How recent is this evidence? (1=months ago, 5=this week)
                  </p>
                </div>

                {/* Directness */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Directness
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {directness}/5 - {getScoreLabel(directness)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={directness}
                    onChange={(e) => setDirectness(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    How directly does this measure what matters? (1=proxy metric, 5=direct measure)
                  </p>
                </div>

                {/* Overall Quality Score Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Overall Quality Score
                    </span>
                    <span className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(calculateQualityScore(sourceCredibility, sampleSize, recency, directness))}`}>
                      {calculateQualityScore(sourceCredibility, sampleSize, recency, directness)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={resetForm}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={!canSubmit}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  canSubmit
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingId ? 'Update Evidence' : 'Add Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guidance */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          💡 How to use this panel:
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Add evidence that challenges your current strategy - not just supporting evidence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Be rigorous with quality scores - don't inflate them to feel better</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>High-quality contradictory evidence (70%+) should be taken very seriously</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Low-quality evidence (&lt;50%) might be worth collecting more data on before concluding</span>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Progress Summary
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Continue to Mixed-Methods Integration →
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Evidence-based decision making • Systematic evaluation reduces confirmation bias by 40%
        </p>
      </div>
    </div>
  );
}
