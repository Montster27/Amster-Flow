import { usePivot } from '../../contexts/PivotContext';
import { usePivotData } from '../../hooks/usePivotData';
import { PreMortemExercise } from './PreMortemExercise';
import { ProgressSummary } from './ProgressSummary';
import { ReflectionPrompts } from './ReflectionPrompts';
import { ConfidenceAssessment } from './ConfidenceAssessment';
import { DecisionSelection } from './DecisionSelection';
import { EvidenceQualityPanel } from './EvidenceQualityPanel';
import { MixedMethodsPanel } from './MixedMethodsPanel';
import { HypothesisTracker } from './HypothesisTracker';
import { PMFTrajectory } from './PMFTrajectory';
import { PivotTypeRecommendations } from './PivotTypeRecommendations';
import { DetailedDecisionSelection } from './DetailedDecisionSelection';

interface PivotModuleProps {
  projectId: string;
  onComplete?: () => void;
}

/**
 * Pivot/Proceed Module Orchestrator
 *
 * Manages flow through either Easy or Detailed mode:
 *
 * Easy Mode Flow:
 * 1. Pre-Mortem Exercise (shared)
 * 2. Progress Summary (shared)
 * 3. Reflection Prompts
 * 4. Confidence Assessment
 * 5. Decision Selection
 * 6. Complete
 *
 * Detailed Mode Flow:
 * 1. Pre-Mortem Exercise (shared)
 * 2. Progress Summary (shared)
 * 3. Evidence Quality Panel
 * 4. Mixed-Methods Integration
 * 5. Hypothesis Tracking
 * 6. PMF Trajectory
 * 7. Pivot Type Recommendations
 * 8. Decision Selection (with PIVOT readiness)
 * 9. Complete
 *
 * All data auto-saves to Supabase via usePivotData hook
 */
export function PivotModule({ projectId, onComplete }: PivotModuleProps) {
  const { currentStep, setCurrentStep, mode, setMode, currentDecision, completeDecision } = usePivot();
  const { loading, error } = usePivotData(projectId);

  // If no mode selected yet, show mode selection
  const showModeSelection = !currentDecision?.mode;

  const handleModeSelect = (selectedMode: 'easy' | 'detailed') => {
    setMode(selectedMode);
    setCurrentStep('pre-mortem');
  };

  const handleStepComplete = (nextStep: typeof currentStep) => {
    setCurrentStep(nextStep);
  };

  const handleComplete = () => {
    completeDecision();
    if (onComplete) {
      onComplete();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading decision framework...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Mode Selection Screen
  if (!currentDecision || showModeSelection) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Pivot or Proceed Framework
          </h1>
          <p className="text-lg text-gray-600">
            Make evidence-based decisions about your venture's direction using research-backed frameworks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Easy Mode */}
          <div
            onClick={() => handleModeSelect('easy')}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-300 hover:border-blue-400 cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ⚡
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Easy Mode</h2>
              <p className="text-sm text-gray-600">Guided reflection • 20-30 minutes</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <p className="text-sm text-gray-700">
                  Pre-mortem exercise to combat optimism bias
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <p className="text-sm text-gray-700">
                  Progress summary against benchmarks
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <p className="text-sm text-gray-700">
                  Reflection prompts to overcome biases
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <p className="text-sm text-gray-700">
                  Confidence assessment across 5 dimensions
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <p className="text-sm text-gray-700">
                  Three-path decision (Proceed/Patch/Pivot)
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Best for:</strong> Quick decision with cognitive debiasing
              </p>
            </div>
          </div>

          {/* Detailed Mode */}
          <div
            onClick={() => handleModeSelect('detailed')}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-300 hover:border-purple-400 cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🔬
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Detailed Mode</h2>
              <p className="text-sm text-gray-600">Evidence-based analysis • 60-90 minutes</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  Everything in Easy Mode, plus:
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  Evidence quality scoring (4 dimensions)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  Mixed-methods integration (quant + qual)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  Hypothesis tracking system
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  PMF trajectory prediction
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  10 pivot type recommendations
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <p className="text-sm text-gray-700">
                  PIVOT readiness checklist
                </p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>Best for:</strong> High-stakes decisions requiring deep analysis
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Your choice is saved. You can switch modes later if needed.
          </p>
        </div>
      </div>
    );
  }

  // Render current step based on mode
  const renderStep = () => {
    // Shared steps (both modes)
    if (currentStep === 'pre-mortem') {
      return (
        <PreMortemExercise
          onContinue={() => handleStepComplete('progress')}
        />
      );
    }

    if (currentStep === 'progress') {
      return (
        <ProgressSummary
          onContinue={() => {
            if (mode === 'easy') {
              handleStepComplete('reflection');
            } else {
              handleStepComplete('evidence');
            }
          }}
          onBack={() => handleStepComplete('pre-mortem')}
        />
      );
    }

    // Easy Mode specific steps
    if (mode === 'easy') {
      if (currentStep === 'reflection') {
        return (
          <ReflectionPrompts
            onContinue={() => handleStepComplete('confidence')}
            onBack={() => handleStepComplete('progress')}
          />
        );
      }

      if (currentStep === 'confidence') {
        return (
          <ConfidenceAssessment
            onContinue={() => handleStepComplete('decision')}
            onBack={() => handleStepComplete('reflection')}
          />
        );
      }

      if (currentStep === 'decision') {
        return (
          <DecisionSelection
            onContinue={() => handleStepComplete('complete')}
            onBack={() => handleStepComplete('confidence')}
          />
        );
      }
    }

    // Detailed Mode specific steps
    if (mode === 'detailed') {
      if (currentStep === 'evidence') {
        return (
          <EvidenceQualityPanel
            onContinue={() => handleStepComplete('mixed-methods')}
            onBack={() => handleStepComplete('progress')}
          />
        );
      }

      if (currentStep === 'mixed-methods') {
        return (
          <MixedMethodsPanel
            onContinue={() => handleStepComplete('hypothesis')}
            onBack={() => handleStepComplete('evidence')}
          />
        );
      }

      if (currentStep === 'hypothesis') {
        return (
          <HypothesisTracker
            onContinue={() => handleStepComplete('trajectory')}
            onBack={() => handleStepComplete('mixed-methods')}
          />
        );
      }

      if (currentStep === 'trajectory') {
        return (
          <PMFTrajectory
            onContinue={() => handleStepComplete('pivot-types')}
            onBack={() => handleStepComplete('hypothesis')}
          />
        );
      }

      if (currentStep === 'pivot-types') {
        return (
          <PivotTypeRecommendations
            onContinue={() => handleStepComplete('decision')}
            onBack={() => handleStepComplete('trajectory')}
          />
        );
      }

      if (currentStep === 'decision') {
        return (
          <DetailedDecisionSelection
            onContinue={() => handleStepComplete('complete')}
            onBack={() => handleStepComplete('pivot-types')}
          />
        );
      }
    }

    // Completion screen
    if (currentStep === 'complete') {
      return (
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
              ✓
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Decision Complete!
            </h1>
            <p className="text-lg text-gray-600">
              You've completed a rigorous, evidence-based decision process.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Your Decision: <span className="capitalize text-blue-600">{currentDecision.decision}</span>
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Rationale:</h3>
                <p className="text-gray-600">{currentDecision.decisionRationale}</p>
              </div>

              {currentDecision.nextActions && currentDecision.nextActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Next Actions:</h3>
                  <ul className="space-y-2">
                    {currentDecision.nextActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">{index + 1}.</span>
                        <span className="text-gray-600">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentDecision.recommendedPivotType && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommended Pivot Type:</h3>
                  <p className="text-gray-600 capitalize">
                    {currentDecision.recommendedPivotType.replace(/-/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
            >
              Finish & Return to Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Export as PDF
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              All your decisions and analysis are automatically saved to your project.
            </p>
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Unknown step: {currentStep}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress indicator */}
      {currentStep !== 'complete' && (
        <div className="bg-white border-b border-gray-200 py-4 px-8 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-700">
                {mode === 'easy' ? '⚡ Easy Mode' : '🔬 Detailed Mode'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {['pre-mortem', 'progress', mode === 'easy' ? 'reflection' : 'evidence',
                mode === 'easy' ? 'confidence' : 'mixed-methods', 'decision'].map((step, index, arr) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`h-2 rounded-full flex-1 ${
                    arr.indexOf(currentStep as any) >= index
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}></div>
                  {index < arr.length - 1 && (
                    <div className="w-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Render current step */}
      <div className="py-8">
        {renderStep()}
      </div>
    </div>
  );
}
