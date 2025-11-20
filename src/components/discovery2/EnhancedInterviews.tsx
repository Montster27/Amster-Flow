import { useState } from 'react';
import { useDiscovery2 } from '../../contexts/Discovery2Context';
import { InterviewForm } from './InterviewForm';
import type { EnhancedInterview, Discovery2Assumption } from '../../types/discovery';

interface EnhancedInterviewsProps {
  assumptions: Discovery2Assumption[];
}

export function EnhancedInterviews({ assumptions }: EnhancedInterviewsProps) {
  const { interviews, deleteInterview } = useDiscovery2();
  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<EnhancedInterview | null>(null);

  const handleEdit = (interview: EnhancedInterview) => {
    setEditingInterview(interview);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      deleteInterview(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInterview(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAssumptionDescription = (assumptionId: string) => {
    const assumption = assumptions.find((a) => a.id === assumptionId);
    return assumption ? assumption.description : 'Unknown assumption';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Sort assumptions by risk score (highest first)
  const sortedAssumptions = [...assumptions].sort((a, b) => {
    const scoreA = a.riskScore || 0;
    const scoreB = b.riskScore || 0;
    return scoreB - scoreA;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCanvasAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      problem: 'Problem',
      existingAlternatives: 'Alternatives',
      customerSegments: 'Customers',
      earlyAdopters: 'Early Adopters',
      solution: 'Solution',
      uniqueValueProposition: 'UVP',
      channels: 'Channels',
      revenueStreams: 'Revenue',
      costStructure: 'Costs',
      keyMetrics: 'Metrics',
      unfairAdvantage: 'Advantage',
    };
    return labels[area] || area;
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Interviews</h2>
          <p className="mt-1 text-sm text-gray-500">
            Conduct structured interviews with "Big 3 + Why" guidance and link findings to assumptions
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Interview
          </button>
        )}
      </div>

      {/* Interview Form */}
      {showForm && (
        <InterviewForm
          assumptions={assumptions}
          editingInterview={editingInterview}
          onClose={handleCloseForm}
        />
      )}

      {/* Interviews List */}
      {!showForm && (
        <div>
          {interviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by conducting your first customer interview
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Conduct First Interview
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {interview.segmentName}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 border rounded capitalize ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(interview.date)} · {interview.intervieweeType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(interview)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit interview"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(interview.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete interview"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Context */}
                  {interview.context && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <strong>Context:</strong> {interview.context}
                      </p>
                    </div>
                  )}

                  {/* Key Findings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Main Pain Points</h4>
                      <p className="text-sm text-gray-600">{interview.mainPainPoints}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Current Alternatives</h4>
                      <p className="text-sm text-gray-600">{interview.currentAlternatives}</p>
                    </div>
                  </div>

                  {/* Problem Importance */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Problem Importance: {interview.problemImportance}/5
                    </h4>
                    {interview.problemImportanceQuote && (
                      <blockquote className="text-sm italic text-gray-600 border-l-4 border-blue-300 pl-3 py-1">
                        "{interview.problemImportanceQuote}"
                      </blockquote>
                    )}
                  </div>

                  {/* Memorable Quotes */}
                  {interview.memorableQuotes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Memorable Quotes</h4>
                      <div className="space-y-2">
                        {interview.memorableQuotes.map((quote, index) => (
                          <blockquote
                            key={index}
                            className="text-sm italic text-gray-600 border-l-4 border-yellow-300 pl-3 py-1"
                          >
                            "{quote}"
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Surprising Feedback */}
                  {interview.surprisingFeedback && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-900 mb-1">💡 Surprising Feedback</h4>
                      <p className="text-sm text-yellow-800">{interview.surprisingFeedback}</p>
                    </div>
                  )}

                  {/* Assumption Tags */}
                  {interview.assumptionTags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tested Assumptions ({interview.assumptionTags.length})</h4>
                      <div className="space-y-2">
                        {interview.assumptionTags.map((tag, index) => {
                          const effectColor =
                            tag.validationEffect === 'supports'
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : tag.validationEffect === 'contradicts'
                              ? 'bg-red-50 border-red-300 text-red-800'
                              : 'bg-gray-50 border-gray-300 text-gray-800';

                          return (
                            <div key={index} className={`p-2 rounded border ${effectColor}`}>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs flex-1 line-clamp-2">
                                  {getAssumptionDescription(tag.assumptionId)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium capitalize whitespace-nowrap">
                                    {tag.validationEffect}
                                  </span>
                                  <span className="text-xs font-medium whitespace-nowrap">
                                    ({tag.confidenceChange > 0 ? '+' : ''}{tag.confidenceChange})
                                  </span>
                                </div>
                              </div>
                              {tag.quote && (
                                <p className="text-xs italic mt-1 opacity-80">"{tag.quote}"</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Student Reflection */}
                  {interview.studentReflection && (
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">📝 Reflection</h4>
                      <p className="text-sm text-blue-800">{interview.studentReflection}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Right Sidebar - Assumptions Ranked by Risk */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                High-Risk Assumptions
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Sorted by risk score - test these first
              </p>
            </div>

            {/* Assumptions List */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {sortedAssumptions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">No assumptions yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create assumptions in the Assumptions tab
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {sortedAssumptions.slice(0, 20).map((assumption, index) => (
                    <div
                      key={assumption.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {/* Rank & Risk Score */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gray-700 rounded-full">
                            {index + 1}
                          </span>
                          <span className="text-lg font-bold text-yellow-600">
                            🎯 {assumption.riskScore || 0}
                          </span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 border rounded capitalize ${getPriorityColor(assumption.priority)}`}>
                          {assumption.priority}
                        </span>
                      </div>

                      {/* Canvas Area */}
                      <div className="mb-2">
                        <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {getCanvasAreaLabel(assumption.canvasArea)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-700 mb-2 line-clamp-3">
                        {assumption.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-gray-500">
                          <span title="Confidence Level">
                            📊 {assumption.confidence}/5
                          </span>
                          <span title="Interview Count">
                            💬 {assumption.interviewCount}
                          </span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          assumption.status === 'validated'
                            ? 'bg-green-100 text-green-700'
                            : assumption.status === 'invalidated'
                            ? 'bg-red-100 text-red-700'
                            : assumption.status === 'testing'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {assumption.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {sortedAssumptions.length > 20 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Showing top 20 of {sortedAssumptions.length} assumptions
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Helper Text */}
            {sortedAssumptions.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-blue-50">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> Focus interviews on high-risk assumptions to reduce uncertainty quickly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
