import { useState, useMemo } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { useEnhancedInterviews } from '../../hooks/useEnhancedInterviews';
import { synthesizeInterviews, generateSynthesisReport } from '../../utils/synthesisAnalysis';

interface SynthesisModeProps {
  projectId?: string;
}

export const SynthesisMode = ({ projectId }: SynthesisModeProps) => {
  const { assumptions } = useDiscovery();
  const { interviews, loading } = useEnhancedInterviews(projectId);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<Set<string>>(new Set());
  const [filterSegment, setFilterSegment] = useState<string>('all');

  // Get unique segments
  const segments = useMemo(() => {
    return Array.from(new Set(interviews.map(i => i.segmentName))).sort();
  }, [interviews]);

  // Filter interviews based on segment
  const filteredInterviews = useMemo(() => {
    if (filterSegment === 'all') return interviews;
    return interviews.filter(i => i.segmentName === filterSegment);
  }, [interviews, filterSegment]);

  // Get selected interviews
  const selectedInterviews = useMemo(() => {
    return interviews.filter(i => selectedInterviewIds.has(i.id));
  }, [interviews, selectedInterviewIds]);

  // Run synthesis
  const synthesis = useMemo(() => {
    return synthesizeInterviews(selectedInterviews);
  }, [selectedInterviews]);

  const handleToggleInterview = (id: string) => {
    const newSelected = new Set(selectedInterviewIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInterviewIds(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedInterviewIds(new Set(filteredInterviews.map(i => i.id)));
  };

  const handleClearAll = () => {
    setSelectedInterviewIds(new Set());
  };

  const handleExportReport = () => {
    const report = generateSynthesisReport(synthesis, assumptions);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthesis-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">No enhanced interviews yet</p>
        <p className="text-gray-400 text-sm">
          Conduct interviews using the enhanced system to enable synthesis
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Interview Synthesis</h2>
        <p className="text-gray-600">
          Select multiple interviews to identify patterns, common themes, and cross-segment insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interview Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Select Interviews</h3>
              <span className="text-sm text-gray-600">
                {selectedInterviewIds.size} selected
              </span>
            </div>

            {/* Filter by Segment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Segment
              </label>
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All Segments ({interviews.length})</option>
                {segments.map(segment => (
                  <option key={segment} value={segment}>
                    {segment} ({interviews.filter(i => i.segmentName === segment).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Select/Clear All */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all"
              >
                Clear
              </button>
            </div>

            {/* Interview List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredInterviews.map(interview => (
                <label
                  key={interview.id}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedInterviewIds.has(interview.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInterviewIds.has(interview.id)}
                    onChange={() => handleToggleInterview(interview.id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {interview.segmentName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(interview.date)} • {interview.intervieweeType}
                    </p>
                    {interview.assumptionTags.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {interview.assumptionTags.length} assumptions tagged
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Synthesis Results */}
        <div className="lg:col-span-2">
          {selectedInterviews.length === 0 ? (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">Select interviews to see synthesis</p>
              <p className="text-gray-400 text-sm mt-2">
                Choose 2+ interviews for best results
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleExportReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <span>📄</span>
                  <span>Export Report</span>
                </button>
              </div>

              {/* Stats Overview */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-4">Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{synthesis.stats.totalInterviews}</div>
                    <div className="text-sm text-gray-600">Interviews</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{synthesis.stats.segmentCount}</div>
                    <div className="text-sm text-gray-600">Segments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{synthesis.stats.avgImportance}/5</div>
                    <div className="text-sm text-gray-600">Avg Importance</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatDate(synthesis.stats.dateRange.first)}
                    </div>
                    <div className="text-xs text-gray-500">to</div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatDate(synthesis.stats.dateRange.last)}
                    </div>
                  </div>
                </div>

                {/* Interviewee Types */}
                {Object.keys(synthesis.stats.intervieweeTypes).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Interviewee Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(synthesis.stats.intervieweeTypes).map(([type, count]) => (
                        <span key={type} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Keywords */}
              {synthesis.topKeywords.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Top Keywords from Pain Points</h3>
                  <div className="flex flex-wrap gap-2">
                    {synthesis.topKeywords.slice(0, 15).map(({ word, count }) => (
                      <span
                        key={word}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm font-medium"
                      >
                        {word} <span className="text-blue-500">({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Phrases */}
              {synthesis.commonPhrases.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Common Phrases</h3>
                  <div className="space-y-2">
                    {synthesis.commonPhrases.slice(0, 10).map(({ phrase, count }) => (
                      <div key={phrase} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-800">"{phrase}"</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {count} times
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pain Point Themes */}
              {synthesis.painPointThemes.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Recurring Pain Point Themes</h3>
                  <div className="space-y-3">
                    {synthesis.painPointThemes.map(({ theme, count }) => (
                      <div key={theme} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                          {count}
                        </span>
                        <p className="flex-1 text-sm text-gray-700 pt-1">{theme}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segment Comparison */}
              {synthesis.segmentInsights.length > 1 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Segment Comparison</h3>
                  <div className="space-y-4">
                    {synthesis.segmentInsights.map(({ segment, count, avgImportance, topKeywords }) => (
                      <div key={segment} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">{segment}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{count} interviews</span>
                            <span className="text-sm font-medium text-orange-600">
                              {avgImportance}/5 avg
                            </span>
                          </div>
                        </div>
                        {topKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {topKeywords.map(keyword => (
                              <span key={keyword} className="text-xs px-2 py-1 bg-white text-gray-700 rounded border border-gray-200">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumption Summary */}
              {synthesis.assumptionSummary.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Assumption Validation Summary</h3>
                  <div className="space-y-3">
                    {synthesis.assumptionSummary.map(({ assumptionId, supports, contradicts, neutral, netEffect, totalConfidenceChange }) => {
                      const assumption = assumptions.find(a => a.id === assumptionId);
                      if (!assumption) return null;

                      return (
                        <div key={assumptionId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-800 mb-2">
                            {assumption.description}
                          </p>
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded border font-medium ${
                              netEffect === 'supports'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : netEffect === 'contradicts'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              Net: {netEffect.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">
                              ✓ {supports} • ✕ {contradicts} • ○ {neutral}
                            </span>
                            {totalConfidenceChange !== 0 && (
                              <span className={`text-xs font-medium ${
                                totalConfidenceChange > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Confidence: {totalConfidenceChange > 0 ? '+' : ''}{totalConfidenceChange}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
