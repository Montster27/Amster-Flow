import { useState } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { InterviewForm } from './InterviewForm';
import type { EnhancedInterview, Assumption } from '../../types/discovery';

interface EnhancedInterviewsProps {
  assumptions: Assumption[];
}

export function EnhancedInterviews({ assumptions }: EnhancedInterviewsProps) {
  const { interviews, deleteInterview } = useDiscovery();
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

  return (
    <div>
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
  );
}
