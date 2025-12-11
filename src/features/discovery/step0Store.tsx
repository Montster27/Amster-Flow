import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type ConfidenceLevel = 'interviewed-30' | 'several-told-me' | 'seems-logical' | '';

export type Segment = {
  id: number;
  name: string;
  customerId?: number; // Links to customer from Part 1
  problems: string[]; // Copied from customer for reference
  pain: number;
  access: number;
  willingness: number;
  confidenceLevel: ConfidenceLevel; // Affects score weighting
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
  problems: string[];
  benefits: string[];
};

type Step0State = {
  part: number;
  customers: Customer[];
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
  addCustomerProblem: (customerId: number, problem: string) => void;
  updateCustomerProblem: (customerId: number, index: number, problem: string) => void;
  removeCustomerProblem: (customerId: number, index: number) => void;
  addCustomerBenefit: (customerId: number, benefit: string) => void;
  updateCustomerBenefit: (customerId: number, index: number, benefit: string) => void;
  removeCustomerBenefit: (customerId: number, index: number) => void;
  addSegment: (name: string) => void;
  syncSegmentsFromCustomers: () => void;
  updateSegment: (id: number, field: keyof Omit<Segment, 'id' | 'name' | 'customerId' | 'problems'>, value: number | ConfidenceLevel) => void;
  setFocusedSegmentId: (id: number | null) => void;
  setFocusJustification: (value: string) => void;
  addBenefit: (text: string) => void;
  updateBenefit: (id: number, field: keyof Benefit, value: string | boolean | number) => void;
  reset: () => void;
  // Persistence helpers
  importData: (data: Step0State) => void;
  exportData: () => Step0State;
};

const initialState: Step0State = {
  part: 1,
  customers: [],
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
      customers: [...prev.customers, { id: Date.now(), text, problems: [], benefits: [] }],
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

  const addCustomerProblem = useCallback((customerId: number, problem: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, problems: [...c.problems, problem] } : c
      ),
    }));
  }, []);

  const updateCustomerProblem = useCallback((customerId: number, index: number, problem: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, problems: c.problems.map((p, i) => (i === index ? problem : p)) }
          : c
      ),
    }));
  }, []);

  const removeCustomerProblem = useCallback((customerId: number, index: number) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, problems: c.problems.filter((_, i) => i !== index) } : c
      ),
    }));
  }, []);

  const addCustomerBenefit = useCallback((customerId: number, benefit: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, benefits: [...c.benefits, benefit] } : c
      ),
    }));
  }, []);

  const updateCustomerBenefit = useCallback((customerId: number, index: number, benefit: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, benefits: c.benefits.map((b, i) => (i === index ? benefit : b)) }
          : c
      ),
    }));
  }, []);

  const removeCustomerBenefit = useCallback((customerId: number, index: number) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, benefits: c.benefits.filter((_, i) => i !== index) } : c
      ),
    }));
  }, []);

  const addSegment = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        { id: Date.now(), name, problems: [], pain: 3, access: 3, willingness: 3, confidenceLevel: '' },
      ],
    }));
  }, []);

  const syncSegmentsFromCustomers = useCallback(() => {
    setState((prev) => {
      // Get existing segment customerIds to avoid duplicates
      const existingCustomerIds = new Set(prev.segments.map((s) => s.customerId).filter(Boolean));

      // Create segments from customers that don't already have one
      const newSegments = prev.customers
        .filter((c) => c.text && !existingCustomerIds.has(c.id))
        .map((c) => ({
          id: Date.now() + c.id, // Ensure unique ID
          name: c.text,
          customerId: c.id,
          problems: [...c.problems],
          pain: 3,
          access: 3,
          willingness: 3,
          confidenceLevel: '' as ConfidenceLevel,
        }));

      // Also update existing segments with latest problems from their customers
      const updatedSegments = prev.segments.map((s) => {
        if (s.customerId) {
          const customer = prev.customers.find((c) => c.id === s.customerId);
          if (customer) {
            return { ...s, name: customer.text, problems: [...customer.problems] };
          }
        }
        return s;
      });

      return {
        ...prev,
        segments: [...updatedSegments, ...newSegments],
      };
    });
  }, []);

  const updateSegment = useCallback((id: number, field: keyof Omit<Segment, 'id' | 'name' | 'customerId' | 'problems'>, value: number | ConfidenceLevel) => {
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

  const importData = useCallback((data: Step0State) => {
    setState(data);
  }, []);

  const exportData = useCallback(() => state, [state]);

  const value = useMemo(
    () => ({
      ...state,
      setPart,
      addCustomer,
      updateCustomer,
      removeCustomer,
      addCustomerProblem,
      updateCustomerProblem,
      removeCustomerProblem,
      addCustomerBenefit,
      updateCustomerBenefit,
      removeCustomerBenefit,
      addSegment,
      syncSegmentsFromCustomers,
      updateSegment,
      setFocusedSegmentId,
      setFocusJustification,
      addBenefit,
      updateBenefit,
      reset,
      importData,
      exportData,
    }),
    [state, addBenefit, addCustomer, updateCustomer, removeCustomer, addCustomerProblem, updateCustomerProblem, removeCustomerProblem, addCustomerBenefit, updateCustomerBenefit, removeCustomerBenefit, addSegment, syncSegmentsFromCustomers, reset, setFocusJustification, setFocusedSegmentId, setPart, updateBenefit, updateSegment, importData, exportData]
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
