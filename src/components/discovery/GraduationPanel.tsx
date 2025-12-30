/**
 * Graduation Panel Component
 * Displays summary and handles transition from Step 0 to Discovery
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { graduateToDiscovery, getRecommendedBeachhead } from '../../features/discovery/graduationService';
import { calculateBeachheadReadiness } from '../../config/validationConfig';

interface Segment {
  id: string;
  name: string;
  pain: number;
  access: number;
  willingness: number;
}

interface Customer {
  id: string;
  text: string;
  problems: string[];
}

interface Assumption {
  id: string;
  sourceText: string;
  sourceType: string;
  assumption: string;
  impactIfWrong: string;
  type?: string;
  segmentId?: string;
}

interface IdeaStatement {
  building: string;
  helps: string;
  achieve: string;
}

interface GraduationPanelProps {
  projectId: string;
  ideaStatement: IdeaStatement;
  customers: Customer[];
  segments: Segment[];
  assumptions: Assumption[];
  focusedSegmentId?: string;
  onGraduationComplete?: () => void;
}

export function GraduationPanel({
  projectId,
  ideaStatement,
  customers,
  segments,
  assumptions,
  focusedSegmentId,
  onGraduationComplete,
}: GraduationPanelProps) {
  const navigate = useNavigate();
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(focusedSegmentId || '');
  const [isGraduating, setIsGraduating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoBeachheadWarning, setShowNoBeachheadWarning] = useState(false);

  // Calculate recommended beachhead
  const recommendedSegment = useMemo(() => {
    return getRecommendedBeachhead(segments);
  }, [segments]);

  // Calculate readiness for selected segment
  const selectedSegment = useMemo(() => {
    return segments.find((s) => s.id === selectedSegmentId);
  }, [segments, selectedSegmentId]);

  const beachheadReadiness = useMemo(() => {
    if (!selectedSegment) return null;
    return calculateBeachheadReadiness(selectedSegment);
  }, [selectedSegment]);

  // Count problems
  const totalProblems = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.problems.length, 0);
  }, [customers]);

  // Handle graduation
  const handleGraduate = async () => {
    setError(null);

    // Warn if no segment selected
    if (!selectedSegmentId && !showNoBeachheadWarning) {
      setShowNoBeachheadWarning(true);
      return;
    }

    setIsGraduating(true);

    try {
      const step0Data = {
        ideaStatement,
        customers,
        segments,
        assumptions,
        focusedSegmentId: selectedSegmentId || undefined,
      };

      const result = await graduateToDiscovery(projectId, step0Data, selectedSegmentId || undefined);

      if (result.success) {
        onGraduationComplete?.();
        navigate(`/project/${projectId}/discovery`, {
          state: {
            message: `Graduated! ${result.assumptionsCreated} assumptions ready to validate.`,
            fromStep0: true,
          },
        });
      } else {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to graduate');
    } finally {
      setIsGraduating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🎓</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ready to Graduate to Discovery?</h2>
          <p className="text-sm text-gray-600">Review your work and select your beachhead segment</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{segments.length}</div>
          <div className="text-sm text-gray-600">Customer Segments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{totalProblems}</div>
          <div className="text-sm text-gray-600">Problems Identified</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{assumptions.length}</div>
          <div className="text-sm text-gray-600">Assumptions to Test</div>
        </div>
      </div>

      {/* Beachhead Selection */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Select Your Beachhead Segment</h3>

        {recommendedSegment && (
          <div className="mb-4 p-3 bg-white rounded-md border border-blue-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">🎯</span>
              <span className="font-medium text-blue-800">Recommended:</span>
              <span className="text-blue-700">{recommendedSegment.name}</span>
              <span className="text-blue-600">
                (Score: {recommendedSegment.pain * 2 + recommendedSegment.access + recommendedSegment.willingness})
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1 ml-7">
              Highest pain ({recommendedSegment.pain}/5) + Good access ({recommendedSegment.access}/5)
            </p>
          </div>
        )}

        <div className="mb-3">
          <select
            value={selectedSegmentId}
            onChange={(e) => {
              setSelectedSegmentId(e.target.value);
              setShowNoBeachheadWarning(false);
            }}
            className="w-full px-4 py-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select a beachhead segment...</option>
            {segments.map((segment) => {
              const score = segment.pain * 2 + segment.access + segment.willingness;
              const isRecommended = recommendedSegment?.id === segment.id;
              return (
                <option key={segment.id} value={segment.id}>
                  {segment.name} (Score: {score}){isRecommended ? ' ⭐ Recommended' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {selectedSegment && beachheadReadiness && (
          <div
            className={`p-3 rounded-md ${
              beachheadReadiness.isReady
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{beachheadReadiness.isReady ? '✅' : '⚠️'}</span>
              <span
                className={`text-sm font-medium ${
                  beachheadReadiness.isReady ? 'text-green-800' : 'text-yellow-800'
                }`}
              >
                {beachheadReadiness.guidance}
              </span>
            </div>
          </div>
        )}

        {showNoBeachheadWarning && !selectedSegmentId && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">No beachhead selected</p>
                <p className="text-xs text-yellow-700 mt-1">
                  We'll use the recommended segment ({recommendedSegment?.name || 'first segment'}) for you.
                  You can change this later in Discovery.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-blue-600 mt-3">
          💡 You can always come back and change your focus later
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isGraduating}
        >
          ← Back to Edit
        </button>

        <button
          onClick={handleGraduate}
          disabled={isGraduating}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isGraduating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Graduating...
            </>
          ) : (
            <>
              Graduate to Discovery
              <span className="text-lg">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
