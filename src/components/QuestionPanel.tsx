import { useState, useEffect } from 'react';
import { useGuideStore } from '../contexts/GuideContext';
import { useDiscoveryStore } from '../contexts/DiscoveryContext';
import { useSectorMapStore } from '../contexts/SectorMapContext';
import { findAllDuplicates, DuplicateMatch } from '../utils/deduplicationHelper';
import { DuplicateWarning } from './DuplicateWarning';
import { QuestionsData } from '../App';

interface QuestionPanelProps {
  module: string;
  moduleTitle: string;
  intro: string;
  questions: string[];
  hints: string[];
  onComplete: () => void;
  questionsData: QuestionsData;
}

export const QuestionPanel = ({
  module,
  moduleTitle,
  intro,
  questions,
  hints,
  onComplete,
  questionsData,
}: QuestionPanelProps) => {
  const { currentQuestionIndex, saveAnswer, getModuleProgress, setCurrentQuestionIndex, progress: moduleProgress } =
    useGuide();

  const { assumptions, interviews } = useDiscovery();
  const sectorMapStore = useSectorMap();

  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(true);

  const currentQuestion = questions[currentQuestionIndex];
  const currentHint = hints[Math.min(currentQuestionIndex, hints.length - 1)];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  // Load saved answer when question changes
  useEffect(() => {
    const moduleProgress = getModuleProgress(module);
    const savedAnswer = moduleProgress?.answers.find(
      (a) => a.questionIndex === currentQuestionIndex
    );
    setAnswer(savedAnswer?.answer || '');
    setShowHint(false);
    setDuplicates([]);
    setShowDuplicateWarning(true);
  }, [currentQuestionIndex, module, getModuleProgress]);

  // Check for duplicates when answer changes
  useEffect(() => {
    if (answer.length < 20) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(() => {
      const discoveryData = { assumptions, interviews };
      const matches = findAllDuplicates(
        answer,
        moduleProgress,
        questionsData,
        sectorMapStore,
        discoveryData,
        0.6
      );
      setDuplicates(matches);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [answer, moduleProgress, questionsData, sectorMapStore, assumptions, interviews]);

  const handleSaveAndContinue = () => {
    if (answer.trim()) {
      saveAnswer(module, currentQuestionIndex, answer);

      if (isLastQuestion) {
        onComplete();
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex-1 p-8 max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span id="module-title">{moduleTitle}</span>
          <span id="question-progress">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div
          className="w-full bg-gray-200 rounded-full h-2"
          role="progressbar"
          aria-labelledby="module-title"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Intro (only on first question) */}
      {currentQuestionIndex === 0 && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-gray-700">{intro}</p>
        </div>
      )}

      {/* Question */}
      <div className="mb-6">
        <h2 id="current-question" className="text-2xl font-bold text-gray-800 mb-4">{currentQuestion}</h2>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Share your thoughts here..."
          className="w-full h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
          aria-labelledby="current-question"
          aria-required="true"
        />

        {/* Duplicate Warning */}
        {showDuplicateWarning && duplicates.length > 0 && (
          <DuplicateWarning
            duplicates={duplicates}
            onDismiss={() => setShowDuplicateWarning(false)}
          />
        )}
      </div>

      {/* Hint */}
      <div className="mb-8">
        {!showHint ? (
          <button
            onClick={() => setShowHint(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            aria-label="Show hint for current question"
          >
            💡 Need a hint?
          </button>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200" role="note" aria-label="Hint">
            <p className="text-sm text-gray-700">{currentHint}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            currentQuestionIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-label="Go to previous question"
        >
          ← Back
        </button>

        <button
          onClick={handleSaveAndContinue}
          disabled={!answer.trim()}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            answer.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-label={isLastQuestion ? 'Complete this module' : 'Save answer and continue to next question'}
        >
          {isLastQuestion ? 'Complete Module ✓' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  );
};
