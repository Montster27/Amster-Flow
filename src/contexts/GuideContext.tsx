import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Answer {
  questionIndex: number;
  answer: string;
}

export interface ModuleProgress {
  moduleName: string;
  answers: Answer[];
  completed: boolean;
}

interface GuideState {
  currentModule: string;
  currentQuestionIndex: number;
  progress: Record<string, ModuleProgress>;
  setCurrentModule: (module: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  saveAnswer: (module: string, questionIndex: number, answer: string) => void;
  markModuleComplete: (module: string) => void;
  getModuleProgress: (module: string) => ModuleProgress | undefined;
  importProgress: (progress: Record<string, ModuleProgress>) => void;
  reset: () => void;
}

const GuideContext = createContext<GuideState | undefined>(undefined);

const initialState = {
  currentModule: 'problem',
  currentQuestionIndex: 0,
  progress: {},
};

export function GuideProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModuleState] = useState(initialState.currentModule);
  const [currentQuestionIndex, setCurrentQuestionIndexState] = useState(initialState.currentQuestionIndex);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>(initialState.progress);

  const setCurrentModule = useCallback((module: string) => {
    setCurrentModuleState(module);
    setCurrentQuestionIndexState(0);
  }, []);

  const setCurrentQuestionIndex = useCallback((index: number) => {
    setCurrentQuestionIndexState(index);
  }, []);

  const saveAnswer = useCallback((module: string, questionIndex: number, answer: string) => {
    setProgress((prevProgress) => {
      const moduleProgress = prevProgress[module] || {
        moduleName: module,
        answers: [],
        completed: false,
      };

      const existingAnswerIndex = moduleProgress.answers.findIndex(
        (a) => a.questionIndex === questionIndex
      );

      const updatedAnswers = [...moduleProgress.answers];
      if (existingAnswerIndex >= 0) {
        updatedAnswers[existingAnswerIndex] = { questionIndex, answer };
      } else {
        updatedAnswers.push({ questionIndex, answer });
      }

      return {
        ...prevProgress,
        [module]: {
          ...moduleProgress,
          answers: updatedAnswers,
        },
      };
    });
  }, []);

  const markModuleComplete = useCallback((module: string) => {
    setProgress((prevProgress) => {
      const moduleProgress = prevProgress[module];
      if (!moduleProgress) return prevProgress;

      return {
        ...prevProgress,
        [module]: {
          ...moduleProgress,
          completed: true,
        },
      };
    });
  }, []);

  const getModuleProgress = useCallback((module: string) => {
    return progress[module];
  }, [progress]);

  const importProgress = useCallback((newProgress: Record<string, ModuleProgress>) => {
    setProgress(newProgress);
  }, []);

  const reset = useCallback(() => {
    setCurrentModuleState(initialState.currentModule);
    setCurrentQuestionIndexState(initialState.currentQuestionIndex);
    setProgress(initialState.progress);
  }, []);

  const value: GuideState = {
    currentModule,
    currentQuestionIndex,
    progress,
    setCurrentModule,
    setCurrentQuestionIndex,
    saveAnswer,
    markModuleComplete,
    getModuleProgress,
    importProgress,
    reset,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const context = useContext(GuideContext);
  if (context === undefined) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
}
