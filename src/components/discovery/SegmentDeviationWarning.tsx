/**
 * Segment Deviation Warning Component
 * Displays warning when interviewing outside the beachhead segment
 */

import { useState } from 'react';
import type { BeachheadData } from '../../types/discovery';

interface SegmentDeviationWarningProps {
  currentSegment: string;
  beachhead: BeachheadData;
  onAcknowledge: (acknowledged: boolean, reason?: string) => void;
  acknowledged?: boolean;
}

export function SegmentDeviationWarning({
  currentSegment,
  beachhead,
  onAcknowledge,
  acknowledged = false,
}: SegmentDeviationWarningProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(acknowledged);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  // Check if segments match (case-insensitive, trimmed)
  const segmentsMatch =
    currentSegment.toLowerCase().trim() === beachhead.segmentName.toLowerCase().trim();

  // Don't show if segments match
  if (segmentsMatch) {
    return null;
  }

  // Don't show if already acknowledged
  if (isAcknowledged) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          Interviewing outside beachhead ({beachhead.segmentName})
          {reason && <span className="text-gray-400"> — {reason}</span>}
        </span>
        <button
          onClick={() => {
            setIsAcknowledged(false);
            onAcknowledge(false);
          }}
          className="text-blue-600 hover:text-blue-800 ml-auto"
        >
          Change
        </button>
      </div>
    );
  }

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
    onAcknowledge(true, reason || undefined);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div className="flex-shrink-0 text-yellow-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-800">Different segment detected</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Your beachhead is <span className="font-medium">"{beachhead.segmentName}"</span>, but you're
            interviewing <span className="font-medium">"{currentSegment}"</span>.
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Interviewing outside your focus is okay for exploration, but{' '}
            <span className="font-semibold">5 interviews with your beachhead</span> are required to
            validate Stage 1 assumptions.
          </p>

          {/* Reason Input */}
          {showReasonInput && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-yellow-800 mb-1">
                Why are you interviewing this segment? (optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Exploring adjacent market, referral from beachhead"
                className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAcknowledged}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleAcknowledge();
                  }
                }}
                className="w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm text-yellow-800">I understand — continue with this segment</span>
            </label>

            {!showReasonInput && (
              <button
                onClick={() => setShowReasonInput(true)}
                className="text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                Add reason
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline version for interview list
 */
export function SegmentDeviationBadge({
  beachheadName,
  interviewSegment,
}: {
  beachheadName: string;
  interviewSegment: string;
}) {
  const matches = beachheadName.toLowerCase().trim() === interviewSegment.toLowerCase().trim();

  if (matches) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Beachhead
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Outside beachhead
    </span>
  );
}

/**
 * Interview requirements display component
 */
export function InterviewRequirementsCard({
  stage1Interviews,
  stage1Required,
  beachheadInterviews,
  beachheadRequired,
  beachheadName,
}: {
  stage1Interviews: number;
  stage1Required: number;
  beachheadInterviews: number;
  beachheadRequired: number;
  beachheadName: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Interview Requirements</h4>

      <div className="space-y-3">
        {/* Stage 1 Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Stage 1 Interviews</span>
            <span
              className={`font-medium ${
                stage1Interviews >= stage1Required ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {stage1Interviews}/{stage1Required}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                stage1Interviews >= stage1Required ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((stage1Interviews / stage1Required) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Beachhead Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">
              Beachhead ({beachheadName})
            </span>
            <span
              className={`font-medium ${
                beachheadInterviews >= beachheadRequired ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {beachheadInterviews}/{beachheadRequired}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                beachheadInterviews >= beachheadRequired ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min((beachheadInterviews / beachheadRequired) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status message */}
      {stage1Interviews >= stage1Required && beachheadInterviews >= beachheadRequired ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Interview requirements met for Stage 1 validation
        </div>
      ) : (
        <div className="mt-3 text-xs text-gray-500">
          Complete these requirements to validate Stage 1 assumptions
        </div>
      )}
    </div>
  );
}
