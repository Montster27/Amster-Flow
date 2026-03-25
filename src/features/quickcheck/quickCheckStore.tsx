import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type QuickCheckSegment = {
  segmentId: number;
  segmentName: string;
  isBeachhead: boolean;
  problem: string;
  contacts: string[];
  solution: string;
  hypothesis: string;
};

type QuickCheckState = {
  segments: QuickCheckSegment[];
  beachheadCompleted: boolean;
};

type QuickCheckActions = {
  updateSegmentField: (segmentId: number, field: keyof QuickCheckSegment, value: string | string[] | boolean) => void;
  updateSegmentContact: (segmentId: number, index: number, value: string) => void;
  setBeachheadCompleted: (completed: boolean) => void;
  importData: (data: QuickCheckState) => void;
  exportData: () => QuickCheckState;
  reset: () => void;
  getBeachhead: () => QuickCheckSegment | undefined;
  getParkedSegments: () => QuickCheckSegment[];
  canGraduate: () => boolean;
};

const initialState: QuickCheckState = {
  segments: [],
  beachheadCompleted: false,
};

function generateHypothesis(segment: QuickCheckSegment): string {
  const problem = segment.problem.trim();
  const solution = segment.solution.trim();
  if (!problem && !solution) return '';
  const problemPart = problem || '[describe the problem]';
  const solutionPart = solution || '[describe your solution]';
  return `We believe ${segment.segmentName} will adopt our solution because ${problemPart}, if we build ${solutionPart}.`;
}

const QuickCheckContext = createContext<(QuickCheckState & QuickCheckActions) | undefined>(undefined);

export function QuickCheckProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuickCheckState>(initialState);

  const updateSegmentField = useCallback((segmentId: number, field: keyof QuickCheckSegment, value: string | string[] | boolean) => {
    setState((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => {
        if (s.segmentId !== segmentId) return s;
        const updated = { ...s, [field]: value };
        updated.hypothesis = generateHypothesis(updated);
        return updated;
      }),
    }));
  }, []);

  const updateSegmentContact = useCallback((segmentId: number, index: number, value: string) => {
    setState((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => {
        if (s.segmentId !== segmentId) return s;
        const contacts = [...s.contacts];
        contacts[index] = value;
        return { ...s, contacts };
      }),
    }));
  }, []);

  const setBeachheadCompleted = useCallback((completed: boolean) => {
    setState((prev) => ({ ...prev, beachheadCompleted: completed }));
  }, []);

  const importData = useCallback((data: QuickCheckState) => {
    setState(data);
  }, []);

  const exportData = useCallback(() => state, [state]);

  const reset = useCallback(() => setState(initialState), []);

  const getBeachhead = useCallback(() => {
    return state.segments.find((s) => s.isBeachhead);
  }, [state.segments]);

  const getParkedSegments = useCallback(() => {
    return state.segments.filter((s) => !s.isBeachhead);
  }, [state.segments]);

  const canGraduate = useCallback(() => {
    const beachhead = state.segments.find((s) => s.isBeachhead);
    if (!beachhead) return false;
    return (
      beachhead.problem.trim().length > 0 &&
      beachhead.contacts.some((c) => c.trim().length > 0) &&
      beachhead.solution.trim().length > 0
    );
  }, [state.segments]);

  const value = useMemo(
    () => ({
      ...state,
      updateSegmentField,
      updateSegmentContact,
      setBeachheadCompleted,
      importData,
      exportData,
      reset,
      getBeachhead,
      getParkedSegments,
      canGraduate,
    }),
    [state, updateSegmentField, updateSegmentContact, setBeachheadCompleted, importData, exportData, reset, getBeachhead, getParkedSegments, canGraduate]
  );

  return <QuickCheckContext.Provider value={value}>{children}</QuickCheckContext.Provider>;
}

export function useQuickCheckStore() {
  const ctx = useContext(QuickCheckContext);
  if (!ctx) {
    throw new Error('useQuickCheckStore must be used within QuickCheckProvider');
  }
  return ctx;
}
