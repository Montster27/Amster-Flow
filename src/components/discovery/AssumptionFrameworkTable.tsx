import { useMemo } from 'react';
import type {
  Assumption,
  PriorityLevel,
  ValidationStage,
  StageStatus,
  EnhancedInterview,
} from '../../types/discovery';
import { VALIDATION_STAGES, getStageForArea, CANVAS_AREA_LABELS } from '../../types/discovery';
import { evaluateAllStages } from '../../utils/stageEvaluation';
import { StageProgressBar } from './StageProgressBar';
import { StageWarningBanner } from './StageWarningBanner';

interface AssumptionFrameworkTableProps {
  assumptions: Assumption[];
  interviews?: EnhancedInterview[];
  onEdit: (assumption: Assumption) => void;
  onDelete: (id: string) => void;
}

// Priority badge colors
const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

// Stage color themes
const STAGE_COLORS: Record<ValidationStage, {
  border: string;
  bg: string;
  text: string;
  badge: string;
}> = {
  1: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-600',
  },
  2: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    badge: 'bg-purple-600',
  },
  3: {
    border: 'border-green-400',
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'bg-green-600',
  },
};

export function AssumptionFrameworkTable({
  assumptions,
  interviews = [],
  onEdit,
  onDelete,
}: AssumptionFrameworkTableProps) {
  // Evaluate all stage statuses
  const stageStatuses = useMemo(() => {
    return evaluateAllStages(assumptions, interviews);
  }, [assumptions, interviews]);

  // Group assumptions by validation stage
  const groupedAssumptions = useMemo(() => {
    const grouped: Record<ValidationStage, Assumption[]> = { 1: [], 2: [], 3: [] };

    assumptions.forEach((assumption) => {
      const stage = assumption.validationStage || getStageForArea(assumption.canvasArea);
      grouped[stage].push(assumption);
    });

    // Sort within each group by risk score (highest first), then by status
    const statusOrder: Record<string, number> = { untested: 0, testing: 1, validated: 2, invalidated: 3 };

    Object.keys(grouped).forEach((key) => {
      const stage = parseInt(key) as ValidationStage;
      grouped[stage].sort((a, b) => {
        // First by status (untested first)
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Then by risk score (highest first)
        const riskA = a.riskScore || (6 - a.confidence) * a.importance;
        const riskB = b.riskScore || (6 - b.confidence) * b.importance;
        return riskB - riskA;
      });
    });

    return grouped;
  }, [assumptions]);

  const renderAssumptionRow = (assumption: Assumption, _stageStatus: StageStatus) => {
    const stage = assumption.validationStage || getStageForArea(assumption.canvasArea);
    const isPreviousStageIncomplete = stage > 1 && !stageStatuses[stage - 1 as ValidationStage].canGraduate;

    return (
      <tr
        key={assumption.id}
        className={`hover:bg-gray-50 ${isPreviousStageIncomplete ? 'opacity-75' : ''}`}
      >
        {/* Priority */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[assumption.priority]}`}
          >
            {assumption.priority}
          </span>
        </td>

        {/* LBMC Area */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-xs font-medium text-gray-900">
            {CANVAS_AREA_LABELS[assumption.canvasArea]}
          </span>
        </td>

        {/* Assumption */}
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 max-w-md">{assumption.description}</div>
          {assumption.migratedFromStep0 && (
            <span className="inline-flex items-center mt-1 text-xs text-blue-600">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              From Step 0
            </span>
          )}
        </td>

        {/* Type */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-xs text-gray-500 capitalize">{assumption.type}</span>
        </td>

        {/* Risk Score */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
              (assumption.riskScore || 0) >= 15
                ? 'bg-red-100 text-red-800'
                : (assumption.riskScore || 0) >= 8
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {assumption.riskScore || (6 - assumption.confidence) * assumption.importance}
          </span>
        </td>

        {/* Importance */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assumption.importance}/5</td>

        {/* Confidence */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assumption.confidence}/5</td>

        {/* Interviews */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {assumption.interviewCount || 0}
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              assumption.status === 'validated'
                ? 'bg-green-100 text-green-800'
                : assumption.status === 'invalidated'
                ? 'bg-red-100 text-red-800'
                : assumption.status === 'testing'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {assumption.status}
          </span>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button onClick={() => onEdit(assumption)} className="text-blue-600 hover:text-blue-900 mr-4">
            Edit
          </button>
          <button onClick={() => onDelete(assumption.id)} className="text-red-600 hover:text-red-900">
            Delete
          </button>
        </td>
      </tr>
    );
  };

  const renderStageSection = (stage: ValidationStage) => {
    const stageConfig = VALIDATION_STAGES[stage];
    const colors = STAGE_COLORS[stage];
    const status = stageStatuses[stage];
    const stageAssumptions = groupedAssumptions[stage];
    const previousStageStatus = stage > 1 ? stageStatuses[(stage - 1) as ValidationStage] : null;

    return (
      <div key={stage} id={`stage-${stage}`} className="mb-8">
        {/* Stage Warning Banner */}
        {stage > 1 && (
          <StageWarningBanner
            stage={stage}
            status={status}
            previousStageStatus={previousStageStatus || undefined}
          />
        )}

        {/* Stage Header */}
        <div className={`${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-4 mb-4`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`${colors.badge} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                  Stage {stage}
                </span>
                <h3 className={`text-xl font-bold ${colors.text}`}>{stageConfig.name}</h3>
                {!status.isUnlocked && (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-200 text-gray-600">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-1 font-medium">{stageConfig.question}</p>
              <p className="text-xs text-gray-600 mb-3">{stageConfig.description}</p>

              {/* Stage Progress */}
              {stageAssumptions.length > 0 && (
                <div className="mt-3">
                  <StageProgressBar status={status} />
                </div>
              )}
            </div>

            {/* Stage Guidance */}
            <div className="ml-4 text-right">
              {status.canGraduate ? (
                <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2">
                  <p className="text-xs font-semibold text-green-800">✅ Stage Complete</p>
                  {stage < 3 && <p className="text-xs text-green-700">Ready for Stage {stage + 1}</p>}
                </div>
              ) : status.totalAssumptions > 0 && status.interviewCount > 0 ? (
                status.invalidatedCount > status.validatedCount ? (
                  <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                    <p className="text-xs font-semibold text-red-800">⚠️ Consider pivoting</p>
                    <p className="text-xs text-red-700">More assumptions invalidated</p>
                  </div>
                ) : (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
                    <p className="text-xs font-semibold text-yellow-800">🔬 Keep testing</p>
                    <p className="text-xs text-yellow-700">{status.recommendation}</p>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Assumptions Table */}
        {stageAssumptions.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LBMC Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assumption
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stageAssumptions.map((a) => renderAssumptionRow(a, status))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No assumptions in this stage yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Create assumptions for: {stageConfig.areas.map((a) => CANVAS_AREA_LABELS[a]).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Workflow Overview */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 Progressive Validation Workflow</h3>
        <p className="text-xs text-gray-700 mb-3">
          Validate your idea in stages. Complete Stage 1 before moving to Stage 2. If Stage 1 fails, pivot
          before investing in later stages.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span
              className={`w-3 h-3 rounded-full ${
                stageStatuses[1].canGraduate ? 'bg-green-500' : 'bg-blue-600'
              }`}
            />
            <span className="text-gray-600">Stage 1: Customer-Problem</span>
            {stageStatuses[1].canGraduate && <span className="text-green-600">✓</span>}
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-1">
            <span
              className={`w-3 h-3 rounded-full ${
                stageStatuses[2].canGraduate
                  ? 'bg-green-500'
                  : stageStatuses[2].isUnlocked
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            />
            <span className={stageStatuses[2].isUnlocked ? 'text-gray-600' : 'text-gray-400'}>
              Stage 2: Problem-Solution
            </span>
            {stageStatuses[2].canGraduate && <span className="text-green-600">✓</span>}
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-1">
            <span
              className={`w-3 h-3 rounded-full ${
                stageStatuses[3].canGraduate
                  ? 'bg-green-500'
                  : stageStatuses[3].isUnlocked
                  ? 'bg-green-600'
                  : 'bg-gray-300'
              }`}
            />
            <span className={stageStatuses[3].isUnlocked ? 'text-gray-600' : 'text-gray-400'}>
              Stage 3: Business Model
            </span>
            {stageStatuses[3].canGraduate && <span className="text-green-600">✓</span>}
          </div>
        </div>
      </div>

      {/* Render each stage */}
      {renderStageSection(1)}
      {renderStageSection(2)}
      {renderStageSection(3)}
    </div>
  );
}
