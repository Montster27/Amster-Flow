import { useState, useMemo } from 'react';
import { EnhancedAssumption, AssumptionType, EnhancedInterview } from '../../types/discovery';

interface AssumptionBoardProps {
  assumptions: EnhancedAssumption[];
  interviews: EnhancedInterview[];
  onAssumptionClick: (assumptionId: string) => void;
  onPlanFollowUp: (assumptionId: string) => void;
}

type SortOption = 'recent' | 'impact' | 'confidence';
type ColumnType = 'supported' | 'contradicted' | 'neutral';

export const AssumptionBoard = ({
  assumptions,
  interviews,
  onAssumptionClick,
  onPlanFollowUp,
}: AssumptionBoardProps) => {
  const [filterType, setFilterType] = useState<AssumptionType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedAssumption, setSelectedAssumption] = useState<EnhancedAssumption | null>(null);

  // Calculate net validation effect for each assumption
  const enhancedAssumptions = useMemo(() => {
    return assumptions.map(assumption => {
      // Find all interviews that tagged this assumption
      const taggingInterviews = interviews.filter(interview =>
        interview.assumptionTags.some(tag => tag.assumptionId === assumption.id)
      );

      const supportingCount = taggingInterviews.filter(interview =>
        interview.assumptionTags.find(tag => tag.assumptionId === assumption.id)?.validationEffect === 'supports'
      ).length;

      const contradictingCount = taggingInterviews.filter(interview =>
        interview.assumptionTags.find(tag => tag.assumptionId === assumption.id)?.validationEffect === 'contradicts'
      ).length;

      const neutralCount = taggingInterviews.filter(interview =>
        interview.assumptionTags.find(tag => tag.assumptionId === assumption.id)?.validationEffect === 'neutral'
      ).length;

      // Calculate net confidence change
      const confidenceChanges = taggingInterviews.map(interview => {
        const tag = interview.assumptionTags.find(tag => tag.assumptionId === assumption.id);
        return tag?.confidenceChange || 0;
      });
      const netConfidenceChange = confidenceChanges.reduce((sum, change) => sum + change, 0);

      // Get last interview date
      const lastInterviewDate = taggingInterviews.length > 0
        ? taggingInterviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : undefined;

      // Determine net column
      let column: ColumnType;
      if (supportingCount > contradictingCount && supportingCount > neutralCount) {
        column = 'supported';
      } else if (contradictingCount > supportingCount && contradictingCount > neutralCount) {
        column = 'contradicted';
      } else {
        column = 'neutral';
      }

      return {
        ...assumption,
        evidenceCount: taggingInterviews.length,
        supportingCount,
        contradictingCount,
        netConfidenceChange,
        lastInterviewDate,
        column,
      };
    });
  }, [assumptions, interviews]);

  // Filter assumptions
  const filteredAssumptions = useMemo(() => {
    return enhancedAssumptions.filter(assumption =>
      filterType === 'all' || assumption.type === filterType
    );
  }, [enhancedAssumptions, filterType]);

  // Sort assumptions
  const sortedAssumptions = useMemo(() => {
    return [...filteredAssumptions].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (!a.lastInterviewDate && !b.lastInterviewDate) return 0;
          if (!a.lastInterviewDate) return 1;
          if (!b.lastInterviewDate) return -1;
          return new Date(b.lastInterviewDate).getTime() - new Date(a.lastInterviewDate).getTime();
        case 'impact':
          return Math.abs(b.netConfidenceChange) - Math.abs(a.netConfidenceChange);
        case 'confidence':
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });
  }, [filteredAssumptions, sortBy]);

  // Group by column
  const columns = useMemo(() => {
    const supported = sortedAssumptions.filter(a => a.column === 'supported');
    const contradicted = sortedAssumptions.filter(a => a.column === 'contradicted');
    const neutral = sortedAssumptions.filter(a => a.column === 'neutral');

    return { supported, contradicted, neutral };
  }, [sortedAssumptions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getQuotesForAssumption = (assumptionId: string) => {
    return interviews
      .filter(interview =>
        interview.assumptionTags.some(tag => tag.assumptionId === assumptionId)
      )
      .flatMap(interview => {
        const tag = interview.assumptionTags.find(tag => tag.assumptionId === assumptionId);
        return tag?.quote
          ? [{
              quote: tag.quote,
              effect: tag.validationEffect,
              date: interview.date,
              segment: interview.segmentName,
            }]
          : [];
      });
  };

  const AssumptionCard = ({ assumption }: { assumption: typeof enhancedAssumptions[0] }) => (
    <div
      onClick={() => setSelectedAssumption(assumption)}
      className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
    >
      <p className="text-sm font-medium text-gray-800 mb-3">{assumption.description}</p>

      <div className="space-y-2">
        {/* Evidence Count */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {assumption.evidenceCount} {assumption.evidenceCount === 1 ? 'interview' : 'interviews'}
          </span>
          {assumption.lastInterviewDate && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              Last: {formatDate(assumption.lastInterviewDate)}
            </span>
          )}
        </div>

        {/* Validation Breakdown */}
        {assumption.evidenceCount > 0 && (
          <div className="flex gap-2 text-xs">
            {assumption.supportingCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                {assumption.supportingCount} ✓
              </span>
            )}
            {assumption.contradictingCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                {assumption.contradictingCount} ✗
              </span>
            )}
            {assumption.evidenceCount - assumption.supportingCount - assumption.contradictingCount > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {assumption.evidenceCount - assumption.supportingCount - assumption.contradictingCount} ~
              </span>
            )}
          </div>
        )}

        {/* Net Confidence Change */}
        {assumption.netConfidenceChange !== 0 && (
          <div className={`text-xs font-medium ${
            assumption.netConfidenceChange > 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            Confidence: {assumption.netConfidenceChange > 0 ? '+' : ''}{assumption.netConfidenceChange}
          </div>
        )}

        {/* Type Badge */}
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
            {assumption.type}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header & Controls */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Assumption Board</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter by Type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AssumptionType | 'all')}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="customer">Customer</option>
              <option value="problem">Problem</option>
              <option value="solution">Solution</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="impact">Most Impacted</option>
              <option value="confidence">Confidence Level</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supported Column */}
        <div>
          <div className="bg-green-100 border-2 border-green-300 rounded-t-lg p-3 mb-4">
            <h3 className="font-bold text-green-800 flex items-center justify-between">
              <span>✓ Supported</span>
              <span className="text-sm font-normal">({columns.supported.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {columns.supported.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No supported assumptions yet</p>
              </div>
            ) : (
              columns.supported.map(assumption => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>

        {/* Contradicted Column */}
        <div>
          <div className="bg-red-100 border-2 border-red-300 rounded-t-lg p-3 mb-4">
            <h3 className="font-bold text-red-800 flex items-center justify-between">
              <span>✗ Contradicted</span>
              <span className="text-sm font-normal">({columns.contradicted.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {columns.contradicted.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No contradicted assumptions yet</p>
              </div>
            ) : (
              columns.contradicted.map(assumption => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>

        {/* Neutral/Untested Column */}
        <div>
          <div className="bg-gray-100 border-2 border-gray-300 rounded-t-lg p-3 mb-4">
            <h3 className="font-bold text-gray-800 flex items-center justify-between">
              <span>~ Neutral / Untested</span>
              <span className="text-sm font-normal">({columns.neutral.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {columns.neutral.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No neutral assumptions yet</p>
              </div>
            ) : (
              columns.neutral.map(assumption => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAssumption && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAssumption(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {selectedAssumption.description}
                  </h3>
                  <div className="flex gap-2 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {selectedAssumption.type}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      Confidence: {selectedAssumption.confidence}/5
                    </span>
                    {selectedAssumption.netConfidenceChange !== 0 && (
                      <span className={`px-2 py-1 rounded ${
                        selectedAssumption.netConfidenceChange > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedAssumption.netConfidenceChange > 0 ? '+' : ''}{selectedAssumption.netConfidenceChange}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssumption(null)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{selectedAssumption.supportingCount}</div>
                  <div className="text-sm text-green-600">Supporting</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{selectedAssumption.contradictingCount}</div>
                  <div className="text-sm text-red-600">Contradicting</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {selectedAssumption.evidenceCount - selectedAssumption.supportingCount - selectedAssumption.contradictingCount}
                  </div>
                  <div className="text-sm text-gray-600">Neutral</div>
                </div>
              </div>

              {/* Interview Quotes */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Interview Evidence:</h4>
                {getQuotesForAssumption(selectedAssumption.id).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No quotes recorded for this assumption yet.</p>
                ) : (
                  <div className="space-y-3">
                    {getQuotesForAssumption(selectedAssumption.id).map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          item.effect === 'supports'
                            ? 'bg-green-50 border-green-400'
                            : item.effect === 'contradicts'
                            ? 'bg-red-50 border-red-400'
                            : 'bg-gray-50 border-gray-400'
                        }`}
                      >
                        <p className="text-sm text-gray-700 italic mb-2">"{item.quote}"</p>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{item.segment}</span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    onPlanFollowUp(selectedAssumption.id);
                    setSelectedAssumption(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                >
                  Plan Follow-up Interview
                </button>
                <button
                  onClick={() => {
                    onAssumptionClick(selectedAssumption.id);
                    setSelectedAssumption(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
