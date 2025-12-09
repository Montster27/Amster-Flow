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

export type Customer = {
  id: number;
  text: string;
};

type Step0State = {
  part: number;
  customers: Customer[];
  problem: string;
  benefitSummary: string;
  segments: Segment[];
  focusedSegmentId: number | null;
  focusJustification: string;
  benefits: Benefit[];
};

type Step0Actions = {
  setPart: (part: number) => void;
  addCustomer: (text: string) => void;
  updateCustomer: (id: number, text: string) => void;
  removeCustomer: (id: number) => void;
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
  customers: [],
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

  const addCustomer = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, { id: Date.now(), text }],
    }));
  }, []);

  const updateCustomer = useCallback((id: number, text: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, text } : c)),
    }));
  }, []);

  const removeCustomer = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
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
      addCustomer,
      updateCustomer,
      removeCustomer,
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
    [state, addBenefit, addCustomer, updateCustomer, removeCustomer, addSegment, reset, setBenefitSummary, setFocusJustification, setFocusedSegmentId, setPart, setProblem, updateBenefit, updateSegment]
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
