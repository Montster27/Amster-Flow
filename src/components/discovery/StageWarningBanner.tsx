/**
 * Stage Warning Banner Component
 * Displays soft-lock warnings for stages that aren't yet validated
 */

import { useState } from 'react';
import type { ValidationStage, StageStatus } from '../../types/discovery';
import { VALIDATION_STAGES } from '../../types/discovery';

interface StageWarningBannerProps {
  stage: ValidationStage;
  status: StageStatus;
  previousStageStatus?: StageStatus;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export function StageWarningBanner({
  stage,
  status,
  previousStageStatus,
  onDismiss,
  dismissible = true,
}: StageWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if stage is unlocked and previous stage is complete
  if (status.isUnlocked && (!previousStageStatus || previousStageStatus.canGraduate)) {
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  const stageConfig = VALIDATION_STAGES[stage];
  const previousStage = stage > 1 ? stage - 1 : null;
  const previousStageConfig = previousStage ? VALIDATION_STAGES[previousStage as ValidationStage] : null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Determine warning type and message
  const isLocked = !status.isUnlocked;
  const isPreviousIncomplete = previousStageStatus && !previousStageStatus.canGraduate;

  return (
    <div
      className={`rounded-lg p-4 mb-4 border ${
        isLocked ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`}>
          {isLocked ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${isLocked ? 'text-gray-700' : 'text-yellow-800'}`}>
            {isLocked
              ? `Stage ${stage}: ${stageConfig.name} is locked`
              : `Stage ${stage}: ${stageConfig.name} - Previous stage incomplete`}
          </h4>
          <p className={`text-sm mt-1 ${isLocked ? 'text-gray-600' : 'text-yellow-700'}`}>
            {isLocked ? (
              <>
                Complete{' '}
                <span className="font-medium">
                  Stage {previousStage}: {previousStageConfig?.name}
                </span>{' '}
                validation before working on this stage.
              </>
            ) : (
              <>
                We recommend completing{' '}
                <span className="font-medium">
                  Stage {previousStage}: {previousStageConfig?.name}
                </span>{' '}
                first. You can still work here, but validating earlier assumptions provides a stronger foundation.
              </>
            )}
          </p>

          {/* Progress hint for previous stage */}
          {isPreviousIncomplete && previousStageStatus && (
            <div className="mt-2 text-xs text-yellow-600">
              <span className="font-medium">Stage {previousStage} progress:</span>{' '}
              {previousStageStatus.interviewCount}/{VALIDATION_STAGES[previousStage as ValidationStage].minimumInterviews} interviews,{' '}
              {previousStageStatus.validatedCount}/{previousStageStatus.totalAssumptions} assumptions validated
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && !isLocked && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-yellow-400 hover:text-yellow-600 transition-colors"
            title="Dismiss warning"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* CTA for locked stages */}
      {isLocked && previousStage && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a
            href={`#stage-${previousStage}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Go to Stage {previousStage} →
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Inline warning for assumption cards
 */
export function StageInlineWarning({ stage }: { stage: ValidationStage }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Stage {stage - 1} not validated
    </div>
  );
}
