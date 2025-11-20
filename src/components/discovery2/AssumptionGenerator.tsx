import { useState, useEffect } from 'react';
import type { CanvasArea, AssumptionType, ConfidenceLevel } from '../../types/discovery';
import { captureException } from '../../lib/sentry';

interface AssumptionGeneratorProps {
  onClose: () => void;
  onSave: (assumption: NewAssumption) => void;
}

interface NewAssumption {
  type: AssumptionType;
  canvasArea: CanvasArea;
  description: string;
  importance: ConfidenceLevel;
  confidence: ConfidenceLevel;
  evidence: string[];
}

// LBMC area prompts to guide assumption generation
const CANVAS_AREA_PROMPTS: Record<CanvasArea, { title: string; prompts: string[] }> = {
  problem: {
    title: 'Problem',
    prompts: [
      'What problem are you solving?',
      'How painful is this problem for customers?',
      'Are customers actively seeking solutions?',
      'What triggers this problem?',
    ],
  },
  existingAlternatives: {
    title: 'Existing Alternatives',
    prompts: [
      'What do customers currently use?',
      'Why are existing solutions inadequate?',
      'What workarounds have customers created?',
      'What is the switching cost from alternatives?',
    ],
  },
  customerSegments: {
    title: 'Customer Segments',
    prompts: [
      'Who experiences this problem most acutely?',
      'What defines your customer segments?',
      'What are their key characteristics?',
      'How do they currently solve this problem?',
    ],
  },
  earlyAdopters: {
    title: 'Early Adopters',
    prompts: [
      'Who will try your solution first?',
      'What makes them early adopters?',
      'How can you reach them?',
      'What motivates them to try new solutions?',
    ],
  },
  solution: {
    title: 'Solution',
    prompts: [
      'What is your proposed solution?',
      'What are the minimum features needed?',
      'How does it solve the problem better?',
      'What makes it 10x better than alternatives?',
    ],
  },
  uniqueValueProposition: {
    title: 'Unique Value Proposition',
    prompts: [
      'Why should customers choose you?',
      'What unique benefit do you provide?',
      'How do you differentiate from competitors?',
      'What can you promise that others cannot?',
    ],
  },
  channels: {
    title: 'Channels',
    prompts: [
      'How will you reach customers?',
      'What channels do they already use?',
      'Which channels are most cost-effective?',
      'What is your customer acquisition strategy?',
    ],
  },
  revenueStreams: {
    title: 'Revenue Streams',
    prompts: [
      'How will you make money?',
      'What are customers willing to pay for?',
      'What pricing model will you use?',
      'What is the lifetime value of a customer?',
    ],
  },
  costStructure: {
    title: 'Cost Structure',
    prompts: [
      'What are your key costs?',
      'What resources are most expensive?',
      'How will costs scale with growth?',
      'What is your burn rate?',
    ],
  },
  keyMetrics: {
    title: 'Key Metrics',
    prompts: [
      'What numbers will tell you if you are succeeding?',
      'What is your North Star metric?',
      'What leading indicators should you track?',
      'How will you measure product-market fit?',
    ],
  },
  unfairAdvantage: {
    title: 'Unfair Advantage',
    prompts: [
      'What do you have that cannot be easily copied?',
      'What unique assets or capabilities do you possess?',
      'What barriers to entry can you create?',
      'What makes you defensible?',
    ],
  },
};

export function AssumptionGenerator({ onClose, onSave }: AssumptionGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [canvasArea, setCanvasArea] = useState<CanvasArea | null>(null);
  const [type, setType] = useState<AssumptionType>('customer');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<ConfidenceLevel>(3);
  const [confidence, setConfidence] = useState<ConfidenceLevel>(3);
  const [templates, setTemplates] = useState<any>(null);

  // Load assumption templates
  useEffect(() => {
    fetch('/discovery2-templates.json')
      .then((res) => res.json())
      .then((data) => setTemplates(data.assumptionTemplates))
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Failed to load templates');
        captureException(error, { extra: { context: 'AssumptionGenerator load' } });
      });
  }, []);

  const handleSubmit = () => {
    if (!canvasArea || !description.trim()) return;

    const newAssumption: NewAssumption = {
      type,
      canvasArea,
      description: description.trim(),
      importance,
      confidence,
      evidence: [],
    };

    onSave(newAssumption);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Assumption</h2>
              <p className="mt-1 text-sm text-gray-500">
                Step {step} of 3 - {step === 1 ? 'Select LBMC Area' : step === 2 ? 'Write Assumption' : 'Set Priority'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex gap-2">
              <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Which Lean Business Model Canvas area does this assumption relate to?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(CANVAS_AREA_PROMPTS) as CanvasArea[]).map((area) => (
                  <button
                    key={area}
                    onClick={() => setCanvasArea(area)}
                    className={`
                      p-4 border-2 rounded-lg text-left transition-all
                      ${canvasArea === area
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900">
                      {CANVAS_AREA_PROMPTS[area].title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && canvasArea && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {CANVAS_AREA_PROMPTS[canvasArea].title} Assumption
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use these prompts to guide your thinking:
                </p>
                <ul className="space-y-2 mb-6">
                  {CANVAS_AREA_PROMPTS[canvasArea].prompts.map((prompt, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">→</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assumption Type
                </label>
                <div className="flex gap-2">
                  {(['customer', 'problem', 'solution'] as AssumptionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium capitalize
                        ${type === t
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Assumption
                </label>

                {/* Template Prompts */}
                {templates && templates[canvasArea] && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      💡 {templates[canvasArea].description}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">Click a prompt to get started:</p>
                    <div className="flex flex-wrap gap-2">
                      {templates[canvasArea].prompts.map((prompt: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setDescription(prompt)}
                          className="text-xs px-3 py-1.5 bg-white border border-blue-300 rounded-full hover:bg-blue-100 transition-colors text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Small business owners are willing to pay $50/month for a simple accounting tool"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Importance (How critical is this assumption?)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Higher importance means validating this is more crucial to your business
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setImportance(level as ConfidenceLevel)}
                      className={`
                        flex-1 py-3 rounded-md text-sm font-medium border-2
                        ${importance === level
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Confidence (How sure are you this is true?)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Lower confidence means higher risk - this needs validation!
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setConfidence(level as ConfidenceLevel)}
                      className={`
                        flex-1 py-3 rounded-md text-sm font-medium border-2
                        ${confidence === level
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Risk Score Preview */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-900 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Risk Score: {(6 - confidence) * importance}
                </div>
                <p className="text-xs text-yellow-800">
                  Calculated as (6 - confidence) × importance. Higher score = higher risk, needs testing sooner.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => {
              if (step === 1) {
                onClose();
              } else {
                setStep((step - 1) as 1 | 2 | 3);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={() => {
              if (step === 3) {
                handleSubmit();
              } else {
                setStep((step + 1) as 1 | 2 | 3);
              }
            }}
            disabled={
              (step === 1 && !canvasArea) ||
              (step === 2 && !description.trim())
            }
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Create Assumption' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
