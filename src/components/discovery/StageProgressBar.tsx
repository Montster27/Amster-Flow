/**
 * Stage Progress Bar Component
 * Visual progress indicator for validation stages
 */

import type { StageStatus } from '../../types/discovery';
import { VALIDATION_STAGES } from '../../types/discovery';

interface StageProgressBarProps {
  status: StageStatus;
  showDetails?: boolean;
}

export function StageProgressBar({ status, showDetails = true }: StageProgressBarProps) {
  const stageConfig = VALIDATION_STAGES[status.stage];

  // Calculate progress percentage
  const interviewProgress = Math.min(
    (status.interviewCount / stageConfig.minimumInterviews) * 100,
    100
  );

  const confidenceProgress = Math.min((status.avgConfidence / 5) * 100, 100);

  // Determine color based on stage status
  const getProgressColor = () => {
    if (status.canGraduate) return 'bg-green-500';
    if (!status.isUnlocked) return 'bg-gray-300';
    if (status.interviewCount > 0) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getConfidenceColor = () => {
    if (status.avgConfidence >= 4) return 'bg-green-500';
    if (status.avgConfidence >= 3) return 'bg-yellow-500';
    if (status.avgConfidence >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      {/* Interview Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Interviews</span>
          <span>
            {status.interviewCount}/{stageConfig.minimumInterviews}
            {status.interviewsNeeded > 0 && (
              <span className="text-gray-400 ml-1">({status.interviewsNeeded} needed)</span>
            )}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${interviewProgress}%` }}
          />
        </div>
      </div>

      {/* Confidence Progress */}
      {showDetails && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Avg Confidence</span>
            <span>{status.avgConfidence.toFixed(1)}/5</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getConfidenceColor()}`}
              style={{ width: `${confidenceProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assumption Stats */}
      {showDetails && status.totalAssumptions > 0 && (
        <div className="flex items-center gap-3 text-xs pt-1">
          {status.validatedCount > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {status.validatedCount} validated
            </span>
          )}
          {status.invalidatedCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {status.invalidatedCount} invalidated
            </span>
          )}
          {status.untestedCount > 0 && (
            <span className="flex items-center gap-1 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              {status.untestedCount} untested
            </span>
          )}
        </div>
      )}

      {/* Status Badge */}
      {status.canGraduate && (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium pt-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Stage Complete
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function StageProgressBadge({ status }: { status: StageStatus }) {
  if (status.canGraduate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Complete
      </span>
    );
  }

  if (!status.isUnlocked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Locked
      </span>
    );
  }

  const stageConfig = VALIDATION_STAGES[status.stage];
  const progress = Math.round((status.interviewCount / stageConfig.minimumInterviews) * 100);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
      {progress}% Complete
    </span>
  );
}
