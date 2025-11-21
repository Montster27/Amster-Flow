import { useState, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuestionPanel } from './components/QuestionPanel';
import { ModuleReview } from './components/ModuleReview';
import { Summary } from './components/Summary';
import { useGuide } from './contexts/GuideContext';
import { useProjectContext } from './contexts/ProjectDataContext';
import { Routes, Route } from 'react-router-dom';
import { AdminNewsletter } from './pages/AdminNewsletter';

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

interface AppProps {
  projectId?: string;
}

function App({ projectId }: AppProps = {}) {
  const { questionsData } = useProjectContext();
  const [showSummary, setShowSummary] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const {
    currentModule,
    setCurrentModule,
    markModuleComplete,
    setCurrentQuestionIndex,
  } = useGuide();

  // questionsData is guaranteed to be present here because of ProjectDataProvider
  if (!questionsData) return null;

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
    <Routes>
      <Route path="/admin/newsletter" element={<AdminNewsletter />} />
      <Route path="*" element={
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar modules={modules} onModuleClick={handleModuleClick} onViewSummary={handleViewSummary} projectId={projectId} />

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
      } />
    </Routes>
  );
}

export default App;

