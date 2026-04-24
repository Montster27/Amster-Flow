/**
 * JourneyProgress — Shows where the user is in the overall PivotKit flow.
 * Rendered at the top of Step 0, Quick Check, Discovery, and Pivot pages.
 */

interface Step {
  key: string;
  label: string;
  shortLabel: string;
}

const STEPS: Step[] = [
  { key: 'step0', label: 'First Look', shortLabel: 'First Look' },
  { key: 'quickcheck', label: 'Quick Check', shortLabel: 'Quick Check' },
  { key: 'sanitycheck', label: 'Sanity Check', shortLabel: 'Sanity Check' },
  { key: 'discovery', label: 'Discovery', shortLabel: 'Discovery' },
  { key: 'pivot', label: 'Decide', shortLabel: 'Decide' },
];

interface JourneyProgressProps {
  /** Which step is currently active */
  currentStep: 'step0' | 'quickcheck' | 'sanitycheck' | 'discovery' | 'pivot';
  /** Optional: sub-label under the current step (e.g. "Stage 1") */
  subLabel?: string;
  className?: string;
}

export function JourneyProgress({ currentStep, subLabel, className = '' }: JourneyProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className={`bg-white border-b border-slate-200 px-4 py-3 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => {
            const isComplete = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step indicator */}
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {/* Line before */}
                    {idx > 0 && (
                      <div className={`flex-1 h-0.5 ${isComplete || isCurrent ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    )}
                    {/* Circle */}
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isComplete
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isComplete ? '✓' : idx + 1}
                    </div>
                    {/* Line after */}
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 ${isComplete ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-xs mt-1 text-center whitespace-nowrap ${
                      isCurrent ? 'text-blue-600 font-semibold' : isComplete ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    {step.shortLabel}
                    {isCurrent && subLabel && (
                      <span className="block text-[10px] font-normal text-blue-400">{subLabel}</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
