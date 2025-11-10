import { useState, useMemo } from 'react';
import {
  EnhancedInterview,
  InterviewSynthesis,
  IntervieweeTypeEnhanced,
  Assumption,
  ValidationEffect,
} from '../../types/discovery';

interface SynthesisModeProps {
  interviews: EnhancedInterview[];
  assumptions: Assumption[];
  onClose: () => void;
  onSaveSynthesis: (synthesis: InterviewSynthesis) => void;
}

export const SynthesisMode = ({
  interviews,
  assumptions,
  onClose,
  onSaveSynthesis,
}: SynthesisModeProps) => {
  const [step, setStep] = useState<'select' | 'results'>('select');
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>([]);
  const [synthesis, setSynthesis] = useState<InterviewSynthesis | null>(null);

  // Filters for interview selection
  const [filterType, setFilterType] = useState<IntervieweeTypeEnhanced | 'all'>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');

  // Get unique segments
  const uniqueSegments = useMemo(() => {
    return Array.from(new Set(interviews.map(i => i.segmentName))).sort();
  }, [interviews]);

  // Filter interviews for selection
  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      if (filterType !== 'all' && interview.intervieweeType !== filterType) return false;
      if (filterSegment !== 'all' && interview.segmentName !== filterSegment) return false;
      if (filterDateStart && interview.date < filterDateStart) return false;
      if (filterDateEnd && interview.date > filterDateEnd) return false;
      return true;
    });
  }, [interviews, filterType, filterSegment, filterDateStart, filterDateEnd]);

  const toggleInterview = (id: string) => {
    setSelectedInterviewIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedInterviewIds.length === filteredInterviews.length) {
      setSelectedInterviewIds([]);
    } else {
      setSelectedInterviewIds(filteredInterviews.map(i => i.id));
    }
  };

  const runSynthesis = () => {
    if (selectedInterviewIds.length === 0) {
      alert('Please select at least one interview to analyze.');
      return;
    }

    const selectedInterviews = interviews.filter(i => selectedInterviewIds.includes(i.id));

    // Calculate date range
    const dates = selectedInterviews.map(i => new Date(i.date).getTime());
    const dateRange = {
      start: new Date(Math.min(...dates)).toISOString(),
      end: new Date(Math.max(...dates)).toISOString(),
    };

    // Find most mentioned pain point (simple keyword frequency)
    const painPoints = selectedInterviews.flatMap(i =>
      i.mainPainPoints.toLowerCase().split(/\s+/)
        .filter(word => word.length > 4) // Filter out short words
    );
    const painPointCounts: Record<string, number> = {};
    painPoints.forEach(word => {
      painPointCounts[word] = (painPointCounts[word] || 0) + 1;
    });
    const mostMentionedPainPoint = Object.entries(painPointCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Find most discussed segments
    const segmentCounts: Record<string, number> = {};
    selectedInterviews.forEach(i => {
      segmentCounts[i.segmentName] = (segmentCounts[i.segmentName] || 0) + 1;
    });
    const mostDiscussedSegments = Object.entries(segmentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([segment]) => segment);

    // Build assumption summaries
    const assumptionSummaries = assumptions.map(assumption => {
      const relevantTags = selectedInterviews
        .flatMap(interview =>
          interview.assumptionTags
            .filter(tag => tag.assumptionId === assumption.id)
            .map(tag => ({ tag, interview }))
        );

      if (relevantTags.length === 0) {
        return null;
      }

      const supportingEvidence: string[] = [];
      const contradictingEvidence: string[] = [];

      relevantTags.forEach(({ tag, interview }) => {
        const evidence = tag.quote || `From ${interview.segmentName} on ${new Date(interview.date).toLocaleDateString()}`;

        if (tag.validationEffect === 'supports') {
          supportingEvidence.push(evidence);
        } else if (tag.validationEffect === 'contradicts') {
          contradictingEvidence.push(evidence);
        }
      });

      // Determine net effect
      let netEffect: ValidationEffect;
      if (supportingEvidence.length > contradictingEvidence.length) {
        netEffect = 'supports';
      } else if (contradictingEvidence.length > supportingEvidence.length) {
        netEffect = 'contradicts';
      } else {
        netEffect = 'neutral';
      }

      return {
        assumptionId: assumption.id,
        assumptionDescription: assumption.description,
        supportingEvidence,
        contradictingEvidence,
        netEffect,
        totalMentions: relevantTags.length,
      };
    }).filter(Boolean) as (typeof assumptionSummaries[number] & { assumptionDescription: string; totalMentions: number })[];

    // Find most invalidated assumption
    const mostInvalidated = assumptionSummaries
      .filter(summary => summary.netEffect === 'contradicts')
      .sort((a, b) => b.contradictingEvidence.length - a.contradictingEvidence.length)[0];

    const synthesisResult: InterviewSynthesis = {
      interviewIds: selectedInterviewIds,
      dateRange,
      patterns: {
        mostMentionedPainPoint,
        mostInvalidatedAssumption: mostInvalidated?.assumptionId,
        mostDiscussedSegments,
      },
      assumptionSummaries: assumptionSummaries.map(summary => ({
        assumptionId: summary.assumptionId,
        supportingEvidence: summary.supportingEvidence,
        contradictingEvidence: summary.contradictingEvidence,
        netEffect: summary.netEffect,
      })),
    };

    setSynthesis(synthesisResult);
    setStep('results');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAssumptionDescription = (assumptionId: string) => {
    return assumptions.find(a => a.id === assumptionId)?.description || 'Unknown assumption';
  };

  const exportAsPDF = () => {
    alert('PDF export functionality will be implemented with a PDF library.');
    // TODO: Implement with jsPDF or similar
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 'select' ? 'Select Interviews to Analyze' : 'Synthesis Results'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'select'
                ? `${selectedInterviewIds.length} interview${selectedInterviewIds.length !== 1 ? 's' : ''} selected`
                : `Analysis of ${selectedInterviewIds.length} interviews`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Select Interviews */}
        {step === 'select' && (
          <div className="p-6">
            {/* Filters */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-4">Filter Interviews</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as IntervieweeTypeEnhanced | 'all')}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                    <option value="regulator">Regulator</option>
                    <option value="expert">Expert</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Segment</label>
                  <select
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Segments</option>
                    {uniqueSegments.map(segment => (
                      <option key={segment} value={segment}>{segment}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Select All Toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedInterviewIds.length === filteredInterviews.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''} available
              </span>
            </div>

            {/* Interview List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredInterviews.map(interview => (
                <label
                  key={interview.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedInterviewIds.includes(interview.id)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInterviewIds.includes(interview.id)}
                    onChange={() => toggleInterview(interview.id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{interview.segmentName}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {interview.intervieweeType}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        interview.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {interview.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDate(interview.date)} • {interview.assumptionTags.length} assumptions tagged
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={runSynthesis}
                disabled={selectedInterviewIds.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Run Synthesis
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 'results' && synthesis && (
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-700 font-medium mb-1">Most Mentioned Pain Point</div>
                <div className="text-lg font-bold text-purple-900">{synthesis.patterns.mostMentionedPainPoint}</div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 font-medium mb-1">Most Invalidated Assumption</div>
                <div className="text-sm font-bold text-red-900">
                  {synthesis.patterns.mostInvalidatedAssumption
                    ? getAssumptionDescription(synthesis.patterns.mostInvalidatedAssumption).slice(0, 50) + '...'
                    : 'None'}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 font-medium mb-1">Most Discussed Segments</div>
                <div className="text-sm font-bold text-blue-900">
                  {synthesis.patterns.mostDiscussedSegments.join(', ')}
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <strong>Analysis Period:</strong> {formatDate(synthesis.dateRange.start)} to {formatDate(synthesis.dateRange.end)}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                <strong>Interviews Analyzed:</strong> {synthesis.interviewIds.length}
              </div>
            </div>

            {/* Assumption Summaries */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Assumption-by-Assumption Summary</h3>
              {synthesis.assumptionSummaries.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No assumptions were tagged in the selected interviews.</p>
              ) : (
                <div className="space-y-4">
                  {synthesis.assumptionSummaries.map((summary, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 ${
                        summary.netEffect === 'supports'
                          ? 'border-green-300 bg-green-50'
                          : summary.netEffect === 'contradicts'
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-800 flex-1">
                          {getAssumptionDescription(summary.assumptionId)}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          summary.netEffect === 'supports'
                            ? 'bg-green-200 text-green-800'
                            : summary.netEffect === 'contradicts'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {summary.netEffect === 'supports' ? '✓ Supported' :
                           summary.netEffect === 'contradicts' ? '✗ Contradicted' :
                           '~ Neutral'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Supporting Evidence */}
                        <div>
                          <div className="font-medium text-green-700 mb-2">
                            Supporting ({summary.supportingEvidence.length})
                          </div>
                          {summary.supportingEvidence.length === 0 ? (
                            <p className="text-gray-500 italic text-xs">None</p>
                          ) : (
                            <ul className="space-y-1">
                              {summary.supportingEvidence.slice(0, 2).map((evidence, i) => (
                                <li key={i} className="text-xs text-gray-700 pl-3 border-l-2 border-green-300">
                                  "{evidence}"
                                </li>
                              ))}
                              {summary.supportingEvidence.length > 2 && (
                                <li className="text-xs text-gray-500 italic">
                                  +{summary.supportingEvidence.length - 2} more
                                </li>
                              )}
                            </ul>
                          )}
                        </div>

                        {/* Contradicting Evidence */}
                        <div>
                          <div className="font-medium text-red-700 mb-2">
                            Contradicting ({summary.contradictingEvidence.length})
                          </div>
                          {summary.contradictingEvidence.length === 0 ? (
                            <p className="text-gray-500 italic text-xs">None</p>
                          ) : (
                            <ul className="space-y-1">
                              {summary.contradictingEvidence.slice(0, 2).map((evidence, i) => (
                                <li key={i} className="text-xs text-gray-700 pl-3 border-l-2 border-red-300">
                                  "{evidence}"
                                </li>
                              ))}
                              {summary.contradictingEvidence.length > 2 && (
                                <li className="text-xs text-gray-500 italic">
                                  +{summary.contradictingEvidence.length - 2} more
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep('select')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                ← Back to Selection
              </button>
              <div className="flex gap-3">
                <button
                  onClick={exportAsPDF}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  📄 Export as PDF
                </button>
                <button
                  onClick={() => {
                    onSaveSynthesis(synthesis);
                    onClose();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  💾 Save Synthesis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
