import { useState } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { Interview } from '../../types/discovery';

export const InterviewLog = () => {
  const { interviews, assumptions, deleteInterview, setCurrentView } = useDiscovery();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getAssumptionText = (assumptionId: string) => {
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

  const getFormatIcon = (format: Interview['format']) => {
    switch (format) {
      case 'video':
        return '🎥';
      case 'phone':
        return '📞';
      case 'in-person':
        return '👥';
      case 'survey':
        return '📋';
    }
  };

  const sortedInterviews = [...interviews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Interview Log</h2>
          <p className="text-sm text-gray-600 mt-1">
            {interviews.length} {interviews.length === 1 ? 'interview' : 'interviews'} conducted
          </p>
        </div>
        <button
          onClick={() => setCurrentView('planner')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          aria-label="Plan new interview"
        >
          + New Interview
        </button>
      </div>

      {sortedInterviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-2">No interviews yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Start by planning your first customer interview
          </p>
          <button
            onClick={() => setCurrentView('planner')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Plan Your First Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedInterviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              {/* Interview Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === interview.id ? null : interview.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getFormatIcon(interview.format)}</span>
                      <div>
                        <h3 className="font-bold text-gray-800">{interview.customerSegment}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(interview.date)}
                          {interview.duration && ` • ${interview.duration} min`}
                          {interview.interviewee && ` • ${interview.interviewee}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {interview.followUpNeeded && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded border border-yellow-300">
                          Follow-up needed
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {(interview.assumptionsAddressed || []).length} assumption{(interview.assumptionsAddressed || []).length !== 1 ? 's' : ''} tested
                      </span>
                      {(interview.keyInsights || []).length > 0 && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          {(interview.keyInsights || []).length} insight{(interview.keyInsights || []).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === interview.id ? null : interview.id);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label={expandedId === interview.id ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedId === interview.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this interview?')) deleteInterview(interview.id);
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
                  {/* Assumptions Tested */}
                  {(interview.assumptionsAddressed || []).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Assumptions Tested:</h4>
                      <div className="space-y-1">
                        {(interview.assumptionsAddressed || []).map((assumptionId) => (
                          <div
                            key={assumptionId}
                            className="text-sm text-gray-700 p-2 bg-white rounded border border-gray-200"
                          >
                            {getAssumptionText(assumptionId)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Notes:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                      {interview.notes}
                    </p>
                  </div>

                  {/* Key Insights */}
                  {(interview.keyInsights || []).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Key Insights:</h4>
                      <ul className="space-y-1">
                        {(interview.keyInsights || []).map((insight, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">💡</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Surprises */}
                  {interview.surprises && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Surprises:</h4>
                      <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                        {interview.surprises}
                      </p>
                    </div>
                  )}

                  {/* Next Action */}
                  {interview.nextAction && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Next Action:</h4>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                        {interview.nextAction}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
