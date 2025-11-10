import { useState, useMemo } from 'react';
import { EnhancedInterview, IntervieweeTypeEnhanced, ValidationEffect } from '../../types/discovery';

// TODO: Will integrate with DiscoveryContext once we add enhanced interview methods
interface EnhancedInterviewDashboardProps {
  interviews: EnhancedInterview[];
  onNewInterview: () => void;
  onBatchSynthesis: () => void;
  onEditInterview: (id: string) => void;
  onDeleteInterview: (id: string) => void;
}

export const EnhancedInterviewDashboard = ({
  interviews,
  onNewInterview,
  onBatchSynthesis,
  onEditInterview,
  onDeleteInterview,
}: EnhancedInterviewDashboardProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<IntervieweeTypeEnhanced | 'all'>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'completed'>('all');

  // Get unique segments for filter dropdown
  const uniqueSegments = useMemo(() => {
    return Array.from(new Set(interviews.map(i => i.segmentName))).sort();
  }, [interviews]);

  // Filter interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      if (filterType !== 'all' && interview.intervieweeType !== filterType) return false;
      if (filterSegment !== 'all' && interview.segmentName !== filterSegment) return false;
      if (filterStatus !== 'all' && interview.status !== filterStatus) return false;
      return true;
    });
  }, [interviews, filterType, filterSegment, filterStatus]);

  // Sort by date (most recent first)
  const sortedInterviews = useMemo(() => {
    return [...filteredInterviews].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredInterviews]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: IntervieweeTypeEnhanced) => {
    switch (type) {
      case 'customer':
        return '👤';
      case 'partner':
        return '🤝';
      case 'regulator':
        return '⚖️';
      case 'expert':
        return '🎓';
      case 'other':
        return '📝';
    }
  };

  const getTypeLabel = (type: IntervieweeTypeEnhanced) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getValidationSummary = (interview: EnhancedInterview) => {
    const supported = interview.assumptionTags.filter(t => t.validationEffect === 'supports').length;
    const contradicted = interview.assumptionTags.filter(t => t.validationEffect === 'contradicts').length;
    const neutral = interview.assumptionTags.filter(t => t.validationEffect === 'neutral').length;

    const parts = [];
    if (supported > 0) parts.push(`${supported} supported`);
    if (contradicted > 0) parts.push(`${contradicted} contradicted`);
    if (neutral > 0) parts.push(`${neutral} neutral`);

    return parts.length > 0 ? parts.join(', ') : 'No assumptions tagged';
  };

  const getValidationEffectColor = (effect: ValidationEffect) => {
    switch (effect) {
      case 'supports':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'contradicts':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'neutral':
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Enhanced Interview System</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredInterviews.length} {filteredInterviews.length === 1 ? 'interview' : 'interviews'}
            {filteredInterviews.length !== interviews.length && ` (filtered from ${interviews.length})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBatchSynthesis}
            disabled={interviews.length < 2}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label="Batch synthesis mode"
          >
            <span>🗂️</span>
            <span className="hidden sm:inline">Batch Synthesis</span>
          </button>
          <button
            onClick={onNewInterview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            aria-label="New interview"
          >
            <span>➕</span>
            <span>New Interview</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Interviewee Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interviewee Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as IntervieweeTypeEnhanced | 'all')}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="regulator">Regulator</option>
              <option value="expert">Expert</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Segment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment
            </label>
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="all">All Segments</option>
              {uniqueSegments.map(segment => (
                <option key={segment} value={segment}>{segment}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'completed')}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interview List */}
      {sortedInterviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">
            {interviews.length === 0 ? 'No interviews yet' : 'No interviews match your filters'}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {interviews.length === 0
              ? 'Start capturing structured interview insights'
              : 'Try adjusting your filter criteria'}
          </p>
          {interviews.length === 0 && (
            <button
              onClick={onNewInterview}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Record Your First Interview
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedInterviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              {/* Interview Card Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === interview.id ? null : interview.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(interview.intervieweeType)}</span>
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {interview.segmentName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(interview.date)} • {getTypeLabel(interview.intervieweeType)}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Status Badge */}
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          interview.status === 'completed'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}
                      >
                        {interview.status === 'completed' ? '✓ Completed' : '📝 Draft'}
                      </span>

                      {/* Assumption Tags Count */}
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded border border-blue-200">
                        {interview.assumptionTags.length} assumption{interview.assumptionTags.length !== 1 ? 's' : ''} tagged
                      </span>

                      {/* Problem Importance */}
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded border border-purple-200">
                        Importance: {interview.problemImportance}/5
                      </span>
                    </div>

                    {/* Validation Summary */}
                    {interview.assumptionTags.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        💡 {getValidationSummary(interview)}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditInterview(interview.id);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label="Edit interview"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === interview.id ? null : interview.id);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label={expandedId === interview.id ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          expandedId === interview.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this interview?')) onDeleteInterview(interview.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      aria-label="Delete interview"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === interview.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  {/* Context */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Context:</h4>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                      {interview.context}
                    </p>
                  </div>

                  {/* Main Pain Points */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Main Pain Points:</h4>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                      {interview.mainPainPoints}
                    </p>
                  </div>

                  {/* Student Reflection */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Student Reflection:</h4>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                      {interview.studentReflection}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
