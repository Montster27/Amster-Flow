import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuestionPanel } from './components/QuestionPanel';
import { ModuleReview } from './components/ModuleReview';
import { Summary } from './components/Summary';
import { DiscoveryModule } from './components/DiscoveryModule';
import { SectorMapModule } from './components/SectorMapModule';
import { useGuideStore } from './store/useGuideStore';

export interface ModuleData {
  title: string;
  intro: string;
  questions?: string[];
  hints?: string[];
  type?: 'standard' | 'discovery' | 'sectorMap';
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

    // Discovery and Sector Map modules don't need questions/hints
    if (module.type === 'discovery' || module.type === 'sectorMap') {
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

function App() {
  const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const {
    currentModule,
    setCurrentModule,
    markModuleComplete,
    setCurrentQuestionIndex,
    reset,
  } = useGuideStore();

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

  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Guide</h2>
          <p className="text-gray-600 mb-4">{loadingError}</p>
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

  if (!questionsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your guide...</p>
        </div>
      </div>
    );
  }

  const modules = Object.keys(questionsData);
  const currentModuleData = questionsData[currentModule];
  const isDiscoveryModule = currentModuleData?.type === 'discovery';
  const isSectorMapModule = currentModuleData?.type === 'sectorMap';
  const isStandardModule = !isDiscoveryModule && !isSectorMapModule;

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

  const handleStartOver = () => {
    setShowConfirmReset(true);
  };

  const confirmReset = () => {
    reset();
    setShowSummary(false);
    setCurrentModule(modules[0]);
    setShowConfirmReset(false);
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
            onStartOver={handleStartOver}
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
          <DiscoveryModule />
        ) : isSectorMapModule ? (
          <SectorMapModule />
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

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowConfirmReset(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-dialog-title" className="text-xl font-bold text-gray-800 mb-2">
              Start Over?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure? This will clear all your answers and progress.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                aria-label="Cancel and keep answers"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                aria-label="Confirm and delete all answers"
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
