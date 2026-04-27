import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QuickCheckProvider, useQuickCheckStore } from './quickCheckStore';
import { useQuickCheckData } from '../../hooks/useQuickCheckData';
import { JourneyProgress } from '../../components/ui/JourneyProgress';
import { QuickCheckPart1 } from './QuickCheckPart1';
import { QuickCheckPart2 } from './QuickCheckPart2';

function QuickCheckShell() {
  const { projectId } = useParams<{ projectId: string }>();
  const { loading, error } = useQuickCheckData(projectId);
  const { beachheadCompleted } = useQuickCheckStore();

  const [part, setPart] = useState<0 | 1>(0);
  const [partInitialized, setPartInitialized] = useState(false);

  // Pick the initial part once data has loaded.
  useEffect(() => {
    if (!loading && !partInitialized) {
      setPart(beachheadCompleted ? 1 : 0);
      setPartInitialized(true);
    }
  }, [loading, beachheadCompleted, partInitialized]);

  if (loading || !partInitialized) {
    return (
      <>
        <JourneyProgress currentStep="quickcheck" />
        <div className="max-w-3xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-64 bg-slate-200 rounded" />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <JourneyProgress currentStep="quickcheck" />
        <div className="max-w-3xl mx-auto p-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <JourneyProgress currentStep="quickcheck" subLabel={`Part ${part + 1} of 2`} />
      {part === 0 && <QuickCheckPart1 onNext={() => setPart(1)} />}
      {part === 1 && <QuickCheckPart2 onBack={() => setPart(0)} />}
    </>
  );
}

export default function QuickCheckPage() {
  return (
    <QuickCheckProvider>
      <QuickCheckShell />
    </QuickCheckProvider>
  );
}
