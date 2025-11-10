import { useState } from 'react';
import { VisualSectorMapProvider } from '../../contexts/VisualSectorMapContext';
import { ScopeDefinition } from './ScopeDefinition';
import { ActorManagement } from './ActorManagement';
import { ConnectionManagement } from './ConnectionManagement';
import { AnnotationManagement } from './AnnotationManagement';
import { InsightsSummary } from './InsightsSummary';

type Step = 'scope' | 'actors' | 'connections' | 'annotations' | 'insights';

export const VisualSectorMapTool = () => {
  const [currentStep, setCurrentStep] = useState<Step>('scope');

  const steps: { id: Step; label: string; number: number }[] = [
    { id: 'scope', label: 'Define Scope', number: 1 },
    { id: 'actors', label: 'Add Actors', number: 2 },
    { id: 'connections', label: 'Connect', number: 3 },
    { id: 'annotations', label: 'Annotate', number: 4 },
    { id: 'insights', label: 'Insights', number: 5 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 'scope':
        return <ScopeDefinition onContinue={() => setCurrentStep('actors')} />;
      case 'actors':
        return (
          <ActorManagement
            onContinue={() => setCurrentStep('connections')}
            onBack={() => setCurrentStep('scope')}
          />
        );
      case 'connections':
        return (
          <ConnectionManagement
            onContinue={() => setCurrentStep('annotations')}
            onBack={() => setCurrentStep('actors')}
          />
        );
      case 'annotations':
        return (
          <AnnotationManagement
            onContinue={() => setCurrentStep('insights')}
            onBack={() => setCurrentStep('connections')}
          />
        );
      case 'insights':
        return (
          <InsightsSummary
            onBack={() => setCurrentStep('annotations')}
            onExport={() => {
              // Handle export
              console.log('Export triggered');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <VisualSectorMapProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const isAccessible = index <= currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => isAccessible && setCurrentStep(step.id)}
                      disabled={!isAccessible}
                      className={`flex items-center gap-3 transition-all ${
                        isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? '✓' : step.number}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-blue-600'
                            : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">{renderStep()}</div>
      </div>
    </VisualSectorMapProvider>
  );
};
