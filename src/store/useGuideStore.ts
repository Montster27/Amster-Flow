import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const initialState = {
  currentModule: 'problem',
  currentQuestionIndex: 0,
  progress: {},
};

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentModule: (module) => set({ currentModule: module, currentQuestionIndex: 0 }),

      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

      saveAnswer: (module, questionIndex, answer) => {
        const progress = get().progress;
        const moduleProgress = progress[module] || {
          moduleName: module,
          answers: [],
          completed: false,
        };

        const existingAnswerIndex = moduleProgress.answers.findIndex(
          (a) => a.questionIndex === questionIndex
        );

        if (existingAnswerIndex >= 0) {
          moduleProgress.answers[existingAnswerIndex].answer = answer;
        } else {
          moduleProgress.answers.push({ questionIndex, answer });
        }

        set({
          progress: {
            ...progress,
            [module]: moduleProgress,
          },
        });
      },

      markModuleComplete: (module) => {
        const progress = get().progress;
        const moduleProgress = progress[module];

        if (moduleProgress) {
          set({
            progress: {
              ...progress,
              [module]: {
                ...moduleProgress,
                completed: true,
              },
            },
          });
        }
      },

      getModuleProgress: (module) => {
        return get().progress[module];
      },

      importProgress: (progress) => {
        set({ progress });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'amster-flow-storage',
      version: 1,
      partialize: (state) => ({
        currentModule: state.currentModule,
        currentQuestionIndex: state.currentQuestionIndex,
        progress: state.progress,
      }),
      migrate: (persistedState: any, _version: number) => {
        // Migration for version 1 - just return the state as is
        return persistedState;
      },
    }
  )
);
