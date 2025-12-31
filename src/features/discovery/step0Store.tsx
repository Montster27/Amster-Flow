import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type ConfidenceLevel = 'interviewed-30' | 'several-told-me' | 'seems-logical' | '';

export type Segment = {
  id: number;
  name: string;
  customerId?: number; // Links to customer from Part 1
  benefits: string[]; // Copied from customer for reference
  need: string; // Most important need for this segment
  accessRank: number; // 1-5 how easy to reach (used for ranking)
};

export type Customer = {
  id: number;
  text: string;
  benefits: string[]; // What benefits does this solution provide for them?
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
  hasGraduated: boolean; // V2: Track if user has graduated to Discovery
};

type Step0Actions = {
  setPart: (part: number) => void;
  // Idea actions
  updateIdea: (field: keyof IdeaStatement, value: string) => void;
  // Customer actions
  addCustomer: (text: string) => void;
  updateCustomer: (id: number, text: string) => void;
  removeCustomer: (id: number) => void;
  addCustomerBenefit: (customerId: number, benefit: string) => void;
  updateCustomerBenefit: (customerId: number, index: number, benefit: string) => void;
  removeCustomerBenefit: (customerId: number, index: number) => void;
  // Segment actions
  addSegment: (name: string) => void;
  syncSegmentsFromCustomers: () => void;
  updateSegmentNeed: (id: number, need: string) => void;
  updateSegmentAccessRank: (id: number, rank: number) => void;
  setFocusedSegmentId: (id: number | null) => void;
  // Lifecycle
  reset: () => void;
  // V2: Graduation action
  setGraduated: (graduated: boolean) => void;
  getRecommendedBeachhead: () => Segment | null;
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
  hasGraduated: false,
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
      customers: [...prev.customers, { id: Date.now(), text, benefits: [] }],
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

  // Segment actions
  const addSegment = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        { id: Date.now(), name, benefits: [], need: '', accessRank: 3 },
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
          benefits: [...c.benefits],
          need: '',
          accessRank: 3,
        }));

      const updatedSegments = prev.segments.map((s) => {
        if (s.customerId) {
          const customer = prev.customers.find((c) => c.id === s.customerId);
          if (customer) {
            return { ...s, name: customer.text, benefits: [...customer.benefits] };
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

  const updateSegmentNeed = useCallback((id: number, need: string) => {
    setState((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => (s.id === id ? { ...s, need } : s)),
    }));
  }, []);

  const updateSegmentAccessRank = useCallback((id: number, rank: number) => {
    setState((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => (s.id === id ? { ...s, accessRank: rank } : s)),
    }));
  }, []);

  const setFocusedSegmentId = useCallback((id: number | null) => {
    setState((prev) => ({ ...prev, focusedSegmentId: id }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  // V2: Graduation action
  const setGraduated = useCallback((graduated: boolean) => {
    setState((prev) => ({ ...prev, hasGraduated: graduated }));
  }, []);

  // V2: Get recommended beachhead based on highest access rank (easiest to reach)
  const getRecommendedBeachhead = useCallback(() => {
    if (state.segments.length === 0) return null;

    // Sort by accessRank descending (highest = easiest to reach)
    const sorted = [...state.segments].sort((a, b) => b.accessRank - a.accessRank);
    return sorted[0] || null;
  }, [state.segments]);

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
      addCustomerBenefit,
      updateCustomerBenefit,
      removeCustomerBenefit,
      addSegment,
      syncSegmentsFromCustomers,
      updateSegmentNeed,
      updateSegmentAccessRank,
      setFocusedSegmentId,
      reset,
      setGraduated,
      getRecommendedBeachhead,
      importData,
      exportData,
    }),
    [state, updateIdea, addCustomer, updateCustomer, removeCustomer, addCustomerBenefit, updateCustomerBenefit, removeCustomerBenefit, addSegment, syncSegmentsFromCustomers, updateSegmentNeed, updateSegmentAccessRank, setFocusedSegmentId, setPart, reset, setGraduated, getRecommendedBeachhead, importData, exportData]
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
