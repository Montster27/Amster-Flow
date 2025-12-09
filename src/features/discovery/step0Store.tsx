import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type Segment = {
  id: number;
  name: string;
  pain: number;
  access: number;
  willingness: number;
};

export type Benefit = {
  id: number;
  text: string;
  assumption: string;
  impactIfWrong: 'idea-dies' | 'shrinks' | 'nice-to-have' | '';
  mattersToFocused: boolean;
  focusedVersion: string;
  importanceToFocused?: number;
};

type Step0State = {
  part: number;
  customer: string;
  problem: string;
  benefitSummary: string;
  segments: Segment[];
  focusedSegmentId: number | null;
  focusJustification: string;
  benefits: Benefit[];
};

type Step0Actions = {
  setPart: (part: number) => void;
  setCustomer: (value: string) => void;
  setProblem: (value: string) => void;
  setBenefitSummary: (value: string) => void;
  addSegment: (name: string) => void;
  updateSegment: (id: number, field: keyof Omit<Segment, 'id'>, value: number) => void;
  setFocusedSegmentId: (id: number | null) => void;
  setFocusJustification: (value: string) => void;
  addBenefit: (text: string) => void;
  updateBenefit: (id: number, field: keyof Benefit, value: string | boolean | number) => void;
  reset: () => void;
};

const initialState: Step0State = {
  part: 1,
  customer: '',
  problem: '',
  benefitSummary: '',
  segments: [],
  focusedSegmentId: null,
  focusJustification: '',
  benefits: [],
};

const Step0Context = createContext<(Step0State & Step0Actions) | undefined>(undefined);

export function Step0Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Step0State>(initialState);

  const setPart = useCallback((part: number) => {
    setState((prev) => ({ ...prev, part }));
  }, []);

  const setCustomer = useCallback((customer: string) => {
    setState((prev) => ({ ...prev, customer }));
  }, []);

  const setProblem = useCallback((problem: string) => {
    setState((prev) => ({ ...prev, problem }));
  }, []);

  const setBenefitSummary = useCallback((benefitSummary: string) => {
    setState((prev) => ({ ...prev, benefitSummary }));
  }, []);

  const addSegment = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        { id: Date.now(), name, pain: 3, access: 3, willingness: 3 },
      ],
    }));
  }, []);

  const updateSegment = useCallback((id: number, field: keyof Omit<Segment, 'id'>, value: number) => {
    setState((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  }, []);

  const setFocusedSegmentId = useCallback((id: number | null) => {
    setState((prev) => ({ ...prev, focusedSegmentId: id }));
  }, []);

  const setFocusJustification = useCallback((value: string) => {
    setState((prev) => ({ ...prev, focusJustification: value }));
  }, []);

  const addBenefit = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      benefits: [
        ...prev.benefits,
        {
          id: Date.now(),
          text,
          assumption: '',
          impactIfWrong: '',
          mattersToFocused: false,
          focusedVersion: '',
          importanceToFocused: 3,
        },
      ],
    }));
  }, []);

  const updateBenefit = useCallback(
    (id: number, field: keyof Benefit, value: string | boolean | number) => {
      setState((prev) => ({
        ...prev,
        benefits: prev.benefits.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
      }));
    },
    []
  );

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo(
    () => ({
      ...state,
      setPart,
      setCustomer,
      setProblem,
      setBenefitSummary,
      addSegment,
      updateSegment,
      setFocusedSegmentId,
      setFocusJustification,
      addBenefit,
      updateBenefit,
      reset,
    }),
    [state, addBenefit, addSegment, reset, setBenefitSummary, setCustomer, setFocusJustification, setFocusedSegmentId, setPart, setProblem, updateBenefit, updateSegment]
  );

  return <Step0Context.Provider value={value}>{children}</Step0Context.Provider>;
}

export function useStep0Store() {
  const ctx = useContext(Step0Context);
  if (!ctx) {
    throw new Error('useStep0Store must be used within Step0Provider');
  }
  return ctx;
}
