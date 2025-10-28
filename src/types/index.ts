// Central Type Definitions

// Re-export existing types from App.tsx for centralization
export interface ModuleData {
  title: string;
  intro: string;
  questions?: string[]; // Optional for non-question-based modules
  hints?: string[];
  type?: 'standard' | 'discovery'; // Module type
}

export interface QuestionsData {
  [key: string]: ModuleData;
}

export interface Answer {
  questionIndex: number;
  answer: string;
}

export interface ModuleProgress {
  moduleName: string;
  answers: Answer[];
  completed: boolean;
}

// Re-export Discovery types
export * from './discovery';
