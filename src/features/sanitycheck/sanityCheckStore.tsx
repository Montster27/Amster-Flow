import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type SanitySignal = 'yes' | 'no' | 'unclear' | null;
export type SanityContactStatus = 'not_started' | 'done' | 'unreachable';

export type SanityContact = {
  index: number;           // 0/1/2 — stable slot from Quick Check contacts array
  name: string;
  status: SanityContactStatus;
  hasProblem: SanitySignal;   // "Did they confirm the problem exists?"
  isSolving: SanitySignal;    // "Are they actively trying to solve it today?"
  notes: string;
  interviewedAt: string | null;
};

type SanityCheckState = {
  contacts: SanityContact[];
  acknowledgedLatentWarning: boolean;
  completed: boolean;
};

type SanityCheckActions = {
  updateContact: (index: number, patch: Partial<SanityContact>) => void;
  setAcknowledgedLatentWarning: (value: boolean) => void;
  setCompleted: (value: boolean) => void;
  importData: (data: SanityCheckState) => void;
  exportData: () => SanityCheckState;
  reset: () => void;
  /** Counts toward gate: contacts who confirmed problem exists. */
  problemConfirmedCount: () => number;
  /** Counts toward gate: contacts actively trying to solve it (rules out latent). */
  activelySolvingCount: () => number;
  /** Counts contacts whose outreach has been resolved (done OR unreachable). */
  resolvedCount: () => number;
  /** Gate: ≥2 confirmed problem AND ≥2 actively solving. */
  canGraduate: () => boolean;
};

const initialState: SanityCheckState = {
  contacts: [],
  acknowledgedLatentWarning: false,
  completed: false,
};

const SanityCheckContext = createContext<(SanityCheckState & SanityCheckActions) | undefined>(undefined);

export function SanityCheckProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SanityCheckState>(initialState);

  const updateContact = useCallback((index: number, patch: Partial<SanityContact>) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.index === index ? { ...c, ...patch } : c)),
    }));
  }, []);

  const setAcknowledgedLatentWarning = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, acknowledgedLatentWarning: value }));
  }, []);

  const setCompleted = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, completed: value }));
  }, []);

  const importData = useCallback((data: SanityCheckState) => {
    setState(data);
  }, []);

  const exportData = useCallback(() => state, [state]);

  const reset = useCallback(() => setState(initialState), []);

  const problemConfirmedCount = useCallback(
    () => state.contacts.filter((c) => c.status === 'done' && c.hasProblem === 'yes').length,
    [state.contacts]
  );

  const activelySolvingCount = useCallback(
    () => state.contacts.filter((c) => c.status === 'done' && c.isSolving === 'yes').length,
    [state.contacts]
  );

  const resolvedCount = useCallback(
    () => state.contacts.filter((c) => c.status === 'done' || c.status === 'unreachable').length,
    [state.contacts]
  );

  const canGraduate = useCallback(
    () => problemConfirmedCount() >= 2 && activelySolvingCount() >= 2,
    [problemConfirmedCount, activelySolvingCount]
  );

  const value = useMemo(
    () => ({
      ...state,
      updateContact,
      setAcknowledgedLatentWarning,
      setCompleted,
      importData,
      exportData,
      reset,
      problemConfirmedCount,
      activelySolvingCount,
      resolvedCount,
      canGraduate,
    }),
    [
      state,
      updateContact,
      setAcknowledgedLatentWarning,
      setCompleted,
      importData,
      exportData,
      reset,
      problemConfirmedCount,
      activelySolvingCount,
      resolvedCount,
      canGraduate,
    ]
  );

  return <SanityCheckContext.Provider value={value}>{children}</SanityCheckContext.Provider>;
}

export function useSanityCheckStore() {
  const ctx = useContext(SanityCheckContext);
  if (!ctx) {
    throw new Error('useSanityCheckStore must be used within SanityCheckProvider');
  }
  return ctx;
}
