import { useMemo } from 'react';
import { useDiscovery } from '../../contexts/DiscoveryContext';
import { useEnhancedInterviews } from '../../hooks/useEnhancedInterviews';
import type { Assumption, ValidationEffect } from '../../types/discovery';

interface AssumptionBoardProps {
  projectId?: string;
}

interface AssumptionValidationSummary {
  assumption: Assumption;
  supportsCount: number;
  contradictsCount: number;
  neutralCount: number;
  totalInterviews: number;
  netValidation: ValidationEffect;
  confidenceChange: number;
  lastTestedDate?: string;
}

export const AssumptionBoard = ({ projectId }: AssumptionBoardProps) => {
  const { assumptions } = useDiscovery();
  const { interviews, loading } = useEnhancedInterviews(projectId);

  // Calculate validation summary for each assumption
  const assumptionSummaries = useMemo(() => {
    const summaries: AssumptionValidationSummary[] = assumptions.map(assumption => {
      // Find all interviews that tagged this assumption
      const relevantInterviews = interviews.filter(interview =>
        interview.assumptionTags.some(tag => tag.assumptionId === assumption.id)
      );

      // Count validation effects
      let supportsCount = 0;
      let contradictsCount = 0;
      let neutralCount = 0;
      let totalConfidenceChange = 0;
      let lastTestedDate: string | undefined;

      relevantInterviews.forEach(interview => {
        const tags = interview.assumptionTags.filter(tag => tag.assumptionId === assumption.id);
        tags.forEach(tag => {
          if (tag.validationEffect === 'supports') supportsCount++;
          else if (tag.validationEffect === 'contradicts') contradictsCount++;
          else neutralCount++;

          totalConfidenceChange += tag.confidenceChange;
        });

        // Track most recent test
        if (!lastTestedDate || interview.date > lastTestedDate) {
          lastTestedDate = interview.date;
        }
      });

      // Determine net validation based on counts
      let netValidation: ValidationEffect = 'neutral';
      if (supportsCount > contradictsCount && supportsCount > 0) {
        netValidation = 'supports';
      } else if (contradictsCount > supportsCount && contradictsCount > 0) {
        netValidation = 'contradicts';
      }

      return {
        assumption,
        supportsCount,
        contradictsCount,
        neutralCount,
        totalInterviews: relevantInterviews.length,
        netValidation,
        confidenceChange: totalConfidenceChange,
        lastTestedDate,
      };
    });

    return summaries;
  }, [assumptions, interviews]);

  // Group by validation status
  const supportedAssumptions = useMemo(() =>
    assumptionSummaries.filter(s => s.netValidation === 'supports'),
    [assumptionSummaries]
  );

  const contradictedAssumptions = useMemo(() =>
    assumptionSummaries.filter(s => s.netValidation === 'contradicts'),
    [assumptionSummaries]
  );

  const neutralAssumptions = useMemo(() =>
    assumptionSummaries.filter(s => s.netValidation === 'neutral'),
    [assumptionSummaries]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'problem':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'customer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'solution':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'market':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'revenue':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderAssumptionCard = (summary: AssumptionValidationSummary) => {
    const { assumption, supportsCount, contradictsCount, neutralCount, totalInterviews, confidenceChange, lastTestedDate } = summary;

    return (
      <div
        key={assumption.id}
        className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow"
      >
        {/* Assumption Description */}
        <p className="text-sm font-medium text-gray-800 mb-3">
          {assumption.description}
        </p>

        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded border ${getTypeColor(assumption.type)}`}>
            {assumption.type}
          </span>
          {totalInterviews > 0 && (
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
              {totalInterviews} {totalInterviews === 1 ? 'interview' : 'interviews'}
            </span>
          )}
        </div>

        {/* Validation Stats */}
        {totalInterviews > 0 && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Validation breakdown:</span>
            </div>
            <div className="flex gap-2">
              {supportsCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">{supportsCount} supported</span>
                </div>
              )}
              {contradictsCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-gray-700">{contradictsCount} contradicted</span>
                </div>
              )}
              {neutralCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-gray-700">{neutralCount} neutral</span>
                </div>
              )}
            </div>

            {/* Confidence Change */}
            {confidenceChange !== 0 && (
              <div className="text-xs">
                <span className="text-gray-600">Confidence change: </span>
                <span className={confidenceChange > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {confidenceChange > 0 ? '+' : ''}{confidenceChange}
                </span>
              </div>
            )}

            {/* Last Tested */}
            {lastTestedDate && (
              <div className="text-xs text-gray-500">
                Last tested: {formatDate(lastTestedDate)}
              </div>
            )}
          </div>
        )}

        {/* Untested indicator */}
        {totalInterviews === 0 && (
          <div className="text-xs text-gray-500 italic">
            Not yet tested in interviews
          </div>
        )}

        {/* Current Status Badge */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <span className={`text-xs px-2 py-1 rounded border ${
            assumption.status === 'validated'
              ? 'bg-green-100 text-green-700 border-green-200'
              : assumption.status === 'invalidated'
              ? 'bg-red-100 text-red-700 border-red-200'
              : assumption.status === 'testing'
              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {assumption.status}
          </span>
          <span className="text-xs text-gray-500">
            Confidence: {assumption.confidence}/5
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assumption board...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Assumption Validation Board</h2>
        <p className="text-gray-600">
          Track which assumptions are being validated or contradicted by customer interviews
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-800">{assumptions.length}</div>
          <div className="text-sm text-gray-600">Total Assumptions</div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{supportedAssumptions.length}</div>
          <div className="text-sm text-green-600">Supported</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">{contradictedAssumptions.length}</div>
          <div className="text-sm text-red-600">Contradicted</div>
        </div>
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-700">{neutralAssumptions.length}</div>
          <div className="text-sm text-gray-600">Neutral / Untested</div>
        </div>
      </div>

      {/* No interviews message */}
      {interviews.length === 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center mb-6">
          <p className="text-blue-800 font-medium mb-2">
            No enhanced interviews yet
          </p>
          <p className="text-blue-600 text-sm">
            Conduct interviews using the enhanced interview system to see assumptions validated here
          </p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supported Column */}
        <div className="flex flex-col">
          <div className="bg-green-100 border-2 border-green-300 rounded-t-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-green-800 flex items-center gap-2">
                <span>✓</span>
                <span>Supported</span>
              </h3>
              <span className="text-sm font-medium text-green-700 bg-green-200 px-2 py-1 rounded">
                {supportedAssumptions.length}
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Validated by customer feedback
            </p>
          </div>
          <div className="bg-green-50 border-2 border-green-300 border-t-0 rounded-b-lg p-4 min-h-[400px]">
            {supportedAssumptions.length === 0 ? (
              <p className="text-sm text-green-600 text-center py-8 italic">
                No supported assumptions yet
              </p>
            ) : (
              supportedAssumptions.map(renderAssumptionCard)
            )}
          </div>
        </div>

        {/* Contradicted Column */}
        <div className="flex flex-col">
          <div className="bg-red-100 border-2 border-red-300 rounded-t-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                <span>✕</span>
                <span>Contradicted</span>
              </h3>
              <span className="text-sm font-medium text-red-700 bg-red-200 px-2 py-1 rounded">
                {contradictedAssumptions.length}
              </span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Need to pivot or reconsider
            </p>
          </div>
          <div className="bg-red-50 border-2 border-red-300 border-t-0 rounded-b-lg p-4 min-h-[400px]">
            {contradictedAssumptions.length === 0 ? (
              <p className="text-sm text-red-600 text-center py-8 italic">
                No contradicted assumptions yet
              </p>
            ) : (
              contradictedAssumptions.map(renderAssumptionCard)
            )}
          </div>
        </div>

        {/* Neutral / Untested Column */}
        <div className="flex flex-col">
          <div className="bg-gray-100 border-2 border-gray-300 rounded-t-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span>○</span>
                <span>Neutral / Untested</span>
              </h3>
              <span className="text-sm font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded">
                {neutralAssumptions.length}
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-1">
              Need more validation data
            </p>
          </div>
          <div className="bg-gray-50 border-2 border-gray-300 border-t-0 rounded-b-lg p-4 min-h-[400px]">
            {neutralAssumptions.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8 italic">
                No neutral assumptions
              </p>
            ) : (
              neutralAssumptions.map(renderAssumptionCard)
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How the board works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Supported:</strong> More interviews support than contradict this assumption</li>
          <li>• <strong>Contradicted:</strong> More interviews contradict than support this assumption</li>
          <li>• <strong>Neutral/Untested:</strong> Equal validation, or no interview data yet</li>
          <li>• Cards show validation breakdown, confidence changes, and last test date</li>
          <li>• Use the Enhanced Interview System to tag assumptions and update this board</li>
        </ul>
      </div>
    </div>
  );
};
