import { useState } from 'react';
import { useDiscovery2 } from '../../contexts/Discovery2Context';
import { Discovery2Assumption, AssumptionStatus } from '../../types/discovery';
import { AssumptionDetailDrawer2 } from './AssumptionDetailDrawer2';

interface RiskMatrix2Props {
  onAssumptionClick?: (assumption: Discovery2Assumption) => void;
}

export const RiskMatrix2 = ({ onAssumptionClick }: RiskMatrix2Props) => {
  const { assumptions } = useDiscovery2();
  const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);
  const [selectedAssumption, setSelectedAssumption] = useState<Discovery2Assumption | null>(null);

  // Calculate risk score for an assumption
  // Discovery2Assumption already has riskScore, but we calculate it dynamically
  const getRiskScore = (assumption: Discovery2Assumption): number => {
    // Use the built-in riskScore if available
    if (assumption.riskScore !== undefined) {
      return assumption.riskScore;
    }

    // Fallback calculation
    const statusWeight: Record<AssumptionStatus, number> = {
      untested: 5,
      testing: 4,
      invalidated: 3,
      validated: 1,
    };

    const baseRisk = statusWeight[assumption.status];
    const confidenceRisk = (6 - assumption.confidence) * 0.8;
    const importanceBoost = (assumption.importance || 3) * 0.5;

    return (baseRisk + confidenceRisk + importanceBoost) / 2.5;
  };

  // Categorize assumptions into quadrants
  const categorizeAssumption = (assumption: Discovery2Assumption): string => {
    const risk = getRiskScore(assumption);
    const confidence = assumption.confidence;

    const riskThreshold = 3;
    const confidenceThreshold = 3;

    if (risk > riskThreshold && confidence <= confidenceThreshold) {
      return 'critical';
    } else if (risk > riskThreshold && confidence > confidenceThreshold) {
      return 'monitor';
    } else if (risk <= riskThreshold && confidence <= confidenceThreshold) {
      return 'defer';
    } else {
      return 'safe';
    }
  };

  // Group assumptions by quadrant
  const quadrants = {
    critical: assumptions.filter((a) => categorizeAssumption(a) === 'critical'),
    monitor: assumptions.filter((a) => categorizeAssumption(a) === 'monitor'),
    defer: assumptions.filter((a) => categorizeAssumption(a) === 'defer'),
    safe: assumptions.filter((a) => categorizeAssumption(a) === 'safe'),
  };

  const quadrantConfig = {
    critical: {
      title: '🚨 Critical',
      subtitle: 'High Risk, Low Confidence',
      bg: 'bg-red-50',
      border: 'border-red-300',
      description: 'These assumptions pose high risk and need immediate validation',
    },
    monitor: {
      title: '👀 Monitor',
      subtitle: 'High Risk, High Confidence',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      description: 'Validated but still high-stakes - keep an eye on these',
    },
    defer: {
      title: '⏸️ Defer',
      subtitle: 'Low Risk, Low Confidence',
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      description: 'Low priority - validate when time permits',
    },
    safe: {
      title: '✅ Safe',
      subtitle: 'Low Risk, High Confidence',
      bg: 'bg-green-50',
      border: 'border-green-300',
      description: 'Well-validated and low risk',
    },
  };

  const AssumptionCard = ({ assumption }: { assumption: Discovery2Assumption }) => {
    const statusColors: Record<AssumptionStatus, string> = {
      untested: 'bg-gray-200 text-gray-700',
      testing: 'bg-blue-200 text-blue-700',
      validated: 'bg-green-200 text-green-700',
      invalidated: 'bg-red-200 text-red-700',
    };

    const handleClick = () => {
      setSelectedAssumption(assumption);
      onAssumptionClick?.(assumption);
    };

    return (
      <button
        onClick={handleClick}
        className="w-full text-left p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[assumption.status]} capitalize`}>
            {assumption.status}
          </span>
          <span className="text-xs text-gray-500">
            Confidence: {assumption.confidence}/5
          </span>
          {assumption.importance && (
            <span className="text-xs text-purple-600 font-medium">
              Importance: {assumption.importance}/5
            </span>
          )}
        </div>
        <p className="text-sm text-gray-800 font-medium line-clamp-2">
          {assumption.description}
        </p>
        {assumption.canvasArea && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
            {assumption.canvasArea}
          </span>
        )}
        {assumption.evidence.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            📊 {assumption.evidence.length} evidence item{assumption.evidence.length !== 1 ? 's' : ''}
          </p>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Risk Matrix</h2>
        <p className="text-sm text-gray-600">
          Visualize and prioritize assumptions based on risk and confidence
        </p>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">How to use this matrix:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Critical (top-left)</strong>: Focus here first - high risk, needs validation</li>
              <li>• <strong>Monitor (top-right)</strong>: Keep watching - validated but high stakes</li>
              <li>• <strong>Safe (bottom-right)</strong>: Well-validated, low risk</li>
              <li>• <strong>Defer (bottom-left)</strong>: Low priority - validate later</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 min-h-[600px]">
        {/* Critical */}
        <div
          className={`${quadrantConfig.critical.bg} ${quadrantConfig.critical.border} border-2 rounded-lg p-4 flex flex-col`}
          onMouseEnter={() => setHoveredQuadrant('critical')}
          onMouseLeave={() => setHoveredQuadrant(null)}
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {quadrantConfig.critical.title}
              <span className="text-xs font-normal text-gray-600 bg-white px-2 py-0.5 rounded-full">
                {quadrants.critical.length}
              </span>
            </h3>
            <p className="text-xs text-gray-600">{quadrantConfig.critical.subtitle}</p>
            {hoveredQuadrant === 'critical' && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {quadrantConfig.critical.description}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {quadrants.critical.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8 italic">
                No critical assumptions - great job! 🎉
              </p>
            ) : (
              quadrants.critical.map((assumption) => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>

        {/* Monitor */}
        <div
          className={`${quadrantConfig.monitor.bg} ${quadrantConfig.monitor.border} border-2 rounded-lg p-4 flex flex-col`}
          onMouseEnter={() => setHoveredQuadrant('monitor')}
          onMouseLeave={() => setHoveredQuadrant(null)}
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {quadrantConfig.monitor.title}
              <span className="text-xs font-normal text-gray-600 bg-white px-2 py-0.5 rounded-full">
                {quadrants.monitor.length}
              </span>
            </h3>
            <p className="text-xs text-gray-600">{quadrantConfig.monitor.subtitle}</p>
            {hoveredQuadrant === 'monitor' && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {quadrantConfig.monitor.description}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {quadrants.monitor.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8 italic">
                No assumptions to monitor
              </p>
            ) : (
              quadrants.monitor.map((assumption) => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>

        {/* Defer */}
        <div
          className={`${quadrantConfig.defer.bg} ${quadrantConfig.defer.border} border-2 rounded-lg p-4 flex flex-col`}
          onMouseEnter={() => setHoveredQuadrant('defer')}
          onMouseLeave={() => setHoveredQuadrant(null)}
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {quadrantConfig.defer.title}
              <span className="text-xs font-normal text-gray-600 bg-white px-2 py-0.5 rounded-full">
                {quadrants.defer.length}
              </span>
            </h3>
            <p className="text-xs text-gray-600">{quadrantConfig.defer.subtitle}</p>
            {hoveredQuadrant === 'defer' && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {quadrantConfig.defer.description}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {quadrants.defer.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8 italic">
                No deferred assumptions
              </p>
            ) : (
              quadrants.defer.map((assumption) => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>

        {/* Safe */}
        <div
          className={`${quadrantConfig.safe.bg} ${quadrantConfig.safe.border} border-2 rounded-lg p-4 flex flex-col`}
          onMouseEnter={() => setHoveredQuadrant('safe')}
          onMouseLeave={() => setHoveredQuadrant(null)}
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {quadrantConfig.safe.title}
              <span className="text-xs font-normal text-gray-600 bg-white px-2 py-0.5 rounded-full">
                {quadrants.safe.length}
              </span>
            </h3>
            <p className="text-xs text-gray-600">{quadrantConfig.safe.subtitle}</p>
            {hoveredQuadrant === 'safe' && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {quadrantConfig.safe.description}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {quadrants.safe.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8 italic">
                No safe assumptions yet
              </p>
            ) : (
              quadrants.safe.map((assumption) => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Summary Statistics</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{quadrants.critical.length}</p>
            <p className="text-xs text-gray-600">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{quadrants.monitor.length}</p>
            <p className="text-xs text-gray-600">Monitor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{quadrants.defer.length}</p>
            <p className="text-xs text-gray-600">Defer</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{quadrants.safe.length}</p>
            <p className="text-xs text-gray-600">Safe</p>
          </div>
        </div>
      </div>

      {/* Assumption Detail Drawer */}
      <AssumptionDetailDrawer2
        assumption={selectedAssumption}
        onClose={() => setSelectedAssumption(null)}
      />
    </div>
  );
};
