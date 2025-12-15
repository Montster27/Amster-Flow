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

export type Assumption = {
  id: number;
  sourceText: string; // Original problem or benefit text
  sourceType: 'problem' | 'benefit';
  assumption: string; // Reframed as testable assumption
  impactIfWrong: 'idea-dies' | 'shrinks' | 'nice-to-have' | '';
};

export type Customer = {
  id: number;
  text: string;
  problems: string[];
};

// The user's one-sentence idea
export type IdeaStatement = {
  building: string; // "I'm building..."
  helps: string; // "that helps..."
  achieve: string; // "do X better/faster/cheaper"
};

type Step0State = {
  part: number;
  idea: IdeaStatement;
  customers: Customer[];
  segments: Segment[];
  focusedSegmentId: number | null;
  focusJustification: string;
  assumptions: Assumption[];
};

type Step0Actions = {
  setPart: (part: number) => void;
  // Idea actions
  updateIdea: (field: keyof IdeaStatement, value: string) => void;
  // Customer actions
  addCustomer: (text: string) => void;
  updateCustomer: (id: number, text: string) => void;
  removeCustomer: (id: number) => void;
  addCustomerProblem: (customerId: number, problem: string) => void;
  updateCustomerProblem: (customerId: number, index: number, problem: string) => void;
  removeCustomerProblem: (customerId: number, index: number) => void;
  // Segment actions
  addSegment: (name: string) => void;
  syncSegmentsFromCustomers: () => void;
  updateSegment: (id: number, field: keyof Omit<Segment, 'id' | 'name' | 'customerId' | 'problems'>, value: number | ConfidenceLevel) => void;
  setFocusedSegmentId: (id: number | null) => void;
  setFocusJustification: (value: string) => void;
  // Assumption actions
  syncAssumptionsFromCustomers: () => void;
  updateAssumption: (id: number, field: keyof Omit<Assumption, 'id' | 'sourceText' | 'sourceType'>, value: string) => void;
  // Lifecycle
  reset: () => void;
  // Persistence helpers
  importData: (data: Step0State) => void;
  exportData: () => Step0State;
};

const initialState: Step0State = {
  part: 0, // Start at Part 0 (Your Idea)
  idea: { building: '', helps: '', achieve: '' },
  customers: [],
  segments: [],
  focusedSegmentId: null,
  focusJustification: '',
  assumptions: [],
};

const Step0Context = createContext<(Step0State & Step0Actions) | undefined>(undefined);

export function Step0Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Step0State>(initialState);

  const setPart = useCallback((part: number) => {
    setState((prev) => ({ ...prev, part }));
  }, []);

  // Idea actions
  const updateIdea = useCallback((field: keyof IdeaStatement, value: string) => {
    setState((prev) => ({
      ...prev,
      idea: { ...prev.idea, [field]: value },
    }));
  }, []);

  // Customer actions
  const addCustomer = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, { id: Date.now(), text, problems: [] }],
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

  // Segment actions
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
      const existingCustomerIds = new Set(prev.segments.map((s) => s.customerId).filter(Boolean));

      const newSegments = prev.customers
        .filter((c) => c.text && !existingCustomerIds.has(c.id))
        .map((c) => ({
          id: Date.now() + c.id,
          name: c.text,
          customerId: c.id,
          problems: [...c.problems],
          pain: 3,
          access: 3,
          willingness: 3,
          confidenceLevel: '' as ConfidenceLevel,
        }));

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

  // Assumption actions - auto-populate from customer problems
  const syncAssumptionsFromCustomers = useCallback(() => {
    setState((prev) => {
      const existingSources = new Set(prev.assumptions.map((a) => `${a.sourceType}-${a.sourceText}`));

      // Get problems from all customers
      const allProblems = prev.customers.flatMap((c) =>
        c.problems.filter((p) => p.trim()).map((problem) => ({
          text: problem,
          type: 'problem' as const,
        }))
      );

      // Create new assumptions for problems not already tracked
      const newAssumptions = allProblems
        .filter((p) => !existingSources.has(`${p.type}-${p.text}`))
        .map((p, idx) => ({
          id: Date.now() + idx,
          sourceText: p.text,
          sourceType: p.type,
          assumption: '',
          impactIfWrong: '' as const,
        }));

      return {
        ...prev,
        assumptions: [...prev.assumptions, ...newAssumptions],
      };
    });
  }, []);

  const updateAssumption = useCallback(
    (id: number, field: keyof Omit<Assumption, 'id' | 'sourceText' | 'sourceType'>, value: string) => {
      setState((prev) => ({
        ...prev,
        assumptions: prev.assumptions.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
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
      updateIdea,
      addCustomer,
      updateCustomer,
      removeCustomer,
      addCustomerProblem,
      updateCustomerProblem,
      removeCustomerProblem,
      addSegment,
      syncSegmentsFromCustomers,
      updateSegment,
      setFocusedSegmentId,
      setFocusJustification,
      syncAssumptionsFromCustomers,
      updateAssumption,
      reset,
      importData,
      exportData,
    }),
    [state, updateIdea, addCustomer, updateCustomer, removeCustomer, addCustomerProblem, updateCustomerProblem, removeCustomerProblem, addSegment, syncSegmentsFromCustomers, reset, setFocusJustification, setFocusedSegmentId, setPart, updateSegment, syncAssumptionsFromCustomers, updateAssumption, importData, exportData]
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
