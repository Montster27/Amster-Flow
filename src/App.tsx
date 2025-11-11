import { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuestionPanel } from './components/QuestionPanel';
import { ModuleReview } from './components/ModuleReview';
import { Summary } from './components/Summary';
import { useGuide } from './contexts/GuideContext';
import { useProjectData } from './hooks/useProjectData';
import { useDiscoveryData } from './hooks/useDiscoveryData';
import { useSectorMapData } from './hooks/useSectorMapData';
import { usePivotData } from './hooks/usePivotData';

// Lazy load heavy modules
const DiscoveryModule = lazy(() => import('./components/DiscoveryModule').then(m => ({ default: m.DiscoveryModule })));
const VisualSectorMapTool = lazy(() => import('./components/visual-sector-map/VisualSectorMapTool').then(m => ({ default: m.VisualSectorMapTool })));
const PivotModule = lazy(() => import('./components/pivot/PivotModule').then(m => ({ default: m.PivotModule })));

export interface ModuleData {
  title: string;
  intro: string;
  questions?: string[];
  hints?: string[];
  type?: 'standard' | 'discovery' | 'sectorMap' | 'pivot';
}

export interface QuestionsData {
  [key: string]: ModuleData;
}

// Runtime validation for questions.json
const validateQuestionsData = (data: any): data is QuestionsData => {
  if (!data || typeof data !== 'object') return false;

  return Object.values(data).every((module: any) => {
    if (!module || typeof module !== 'object') return false;
    if (typeof module.title !== 'string') return false;
    if (typeof module.intro !== 'string') return false;

    // Discovery, Sector Map, and Pivot modules don't need questions/hints
    if (module.type === 'discovery' || module.type === 'sectorMap' || module.type === 'pivot') {
      return true;
    }

    // Standard modules need questions and hints
    return (
      Array.isArray(module.questions) &&
      module.questions.every((q: any) => typeof q === 'string') &&
      Array.isArray(module.hints) &&
      module.hints.every((h: any) => typeof h === 'string')
    );
  });
};

interface AppProps {
  projectId?: string;
}

function App({ projectId }: AppProps = {}) {
  const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const {
    currentModule,
    setCurrentModule,
    markModuleComplete,
    setCurrentQuestionIndex,
  } = useGuide();

  // Sync with Supabase if projectId is provided
  const { loading: loadingProjectData, error: projectDataError } = useProjectData(projectId);
  const { loading: loadingDiscoveryData, error: discoveryDataError } = useDiscoveryData(projectId);
  const { loading: loadingSectorMapData, error: sectorMapDataError } = useSectorMapData(projectId);
  const { loading: loadingPivotData, error: pivotDataError } = usePivotData(projectId);

  // Load questions.json on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch('/questions.json');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        // Validate the data structure
        if (!validateQuestionsData(data)) {
          throw new Error('Invalid questions data format');
        }

        setQuestionsData(data);
      } catch (err) {
        console.error('Failed to load questions:', err);
        setLoadingError(
          err instanceof Error ? err.message : 'Failed to load guide. Please try again later.'
        );
      }
    };
    loadQuestions();
  }, []);

  if (loadingError || projectDataError || discoveryDataError || sectorMapDataError || pivotDataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Guide</h2>
          <p className="text-gray-600 mb-4">{loadingError || projectDataError || discoveryDataError || sectorMapDataError || pivotDataError}</p>
          <button
            onClick={() => {
              setLoadingError(null);
              setQuestionsData(null);
              window.location.reload();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            aria-label="Retry loading guide"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!questionsData || loadingProjectData || loadingDiscoveryData || loadingSectorMapData || loadingPivotData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!questionsData ? 'Loading your guide...' : 'Loading project data...'}
          </p>
        </div>
      </div>
    );
  }

  const modules = Object.keys(questionsData);
  const currentModuleData = questionsData[currentModule];
  const isDiscoveryModule = currentModuleData?.type === 'discovery';
  const isSectorMapModule = currentModuleData?.type === 'sectorMap';
  const isPivotModule = currentModuleData?.type === 'pivot';
  const isStandardModule = !isDiscoveryModule && !isSectorMapModule && !isPivotModule;

  const handleModuleComplete = () => {
    // For standard modules (problem, customer segments, solution), show review page
    if (isStandardModule) {
      setShowReview(true);
    } else {
      // For special modules, proceed directly
      proceedToNextModule();
    }
  };

  const proceedToNextModule = () => {
    markModuleComplete(currentModule);

    // Move to next module or show summary
    const currentIndex = modules.indexOf(currentModule);
    if (currentIndex < modules.length - 1) {
      setCurrentModule(modules[currentIndex + 1]);
      setShowReview(false);
    } else {
      setShowSummary(true);
      setShowReview(false);
    }
  };

  const handleConfirmReview = () => {
    proceedToNextModule();
  };

  const handleBackFromReview = () => {
    setShowReview(false);
  };

  const handleModuleClick = (module: string) => {
    setCurrentModule(module);
    setCurrentQuestionIndex(0);
    setShowSummary(false);
    setShowReview(false);
  };

  const handleViewSummary = () => {
    setShowSummary(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar modules={modules} onModuleClick={handleModuleClick} onViewSummary={handleViewSummary} />

      <main className="flex-1 overflow-y-auto">
        {showSummary ? (
          <Summary
            questionsData={questionsData}
            modules={modules}
          />
        ) : showReview && isStandardModule ? (
          <ModuleReview
            module={currentModule}
            moduleTitle={currentModuleData.title}
            questions={currentModuleData.questions!}
            onConfirm={handleConfirmReview}
            onBack={handleBackFromReview}
          />
        ) : isDiscoveryModule ? (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
            <DiscoveryModule projectId={projectId} />
          </Suspense>
        ) : isSectorMapModule ? (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
            <VisualSectorMapTool />
          </Suspense>
        ) : isPivotModule ? (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
            <PivotModule projectId={projectId!} onComplete={handleModuleComplete} />
          </Suspense>
        ) : (
          <QuestionPanel
            module={currentModule}
            moduleTitle={currentModuleData.title}
            intro={currentModuleData.intro}
            questions={currentModuleData.questions!}
            hints={currentModuleData.hints!}
            onComplete={handleModuleComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
