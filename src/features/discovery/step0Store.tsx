import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type ConfidenceLevel = 'interviewed-30' | 'several-told-me' | 'seems-logical' | '';

// The 10 need categories for classifying benefits
export type NeedCategoryId =
  | 'functional'
  | 'efficiency'
  | 'economic'
  | 'emotional'
  | 'identity'
  | 'social'
  | 'control'
  | 'risk'
  | 'growth'
  | 'meaning'
  | '';

export type NeedCategory = {
  id: NeedCategoryId;
  name: string;
  description: string;
  signal: string;
  examples: string[];
};

export const NEED_CATEGORIES: NeedCategory[] = [
  {
    id: 'functional',
    name: 'Functional / Survival',
    description: 'Core requirements to live, work, or operate. Non-negotiable needs; failure creates immediate harm.',
    signal: 'I can\'t function without this.',
    examples: ['Access to food, water, shelter', 'Medicine for chronic conditions', 'Physical safety', 'Ability to earn income'],
  },
  {
    id: 'efficiency',
    name: 'Efficiency & Time-Saving',
    description: 'Reducing effort, friction, or wasted time. Customers value speed, automation, and simplification.',
    signal: 'This takes too long / too much effort.',
    examples: ['Saving time in daily tasks', 'Reducing manual effort', 'Automating repetitive work', 'Faster decision-making'],
  },
  {
    id: 'economic',
    name: 'Economic & Financial',
    description: 'Improving financial outcomes or reducing risk. Focus on money, predictability, and value.',
    signal: 'This saves me money / helps me make money.',
    examples: ['Lowering costs', 'Increasing income', 'Improving ROI', 'Reducing financial risk'],
  },
  {
    id: 'emotional',
    name: 'Emotional & Psychological',
    description: 'How the product makes the customer feel. Often invisible but extremely powerful.',
    signal: 'I feel better knowing this exists.',
    examples: ['Peace of mind', 'Reduced anxiety', 'Feeling in control', 'Confidence in decisions'],
  },
  {
    id: 'identity',
    name: 'Identity & Self-Image',
    description: 'How the product reflects who the customer is (or wants to be). Tied to ego and status.',
    signal: 'This says something about me.',
    examples: ['Looking successful or competent', 'Aligning with personal values', 'Signaling expertise'],
  },
  {
    id: 'social',
    name: 'Social & Relational',
    description: 'How the product affects relationships with others. Products often serve as social tools.',
    signal: 'People expect me to use this.',
    examples: ['Belonging to a community', 'Gaining social approval', 'Improving collaboration'],
  },
  {
    id: 'control',
    name: 'Control & Autonomy',
    description: 'Desire to make choices independently and retain agency. Customers value leverage.',
    signal: 'I don\'t want to be dependent on someone else.',
    examples: ['Control over schedule', 'Independence from intermediaries', 'Ability to customize'],
  },
  {
    id: 'risk',
    name: 'Risk Reduction & Safety',
    description: 'Avoiding negative outcomes. Distinct from emotional comfort—this is about prevention.',
    signal: 'What happens if this goes wrong?',
    examples: ['Error prevention', 'Compliance and legal safety', 'Data protection', 'Backup and recovery'],
  },
  {
    id: 'growth',
    name: 'Growth & Learning',
    description: 'Becoming better over time. These needs are future-oriented.',
    signal: 'This helps me get better.',
    examples: ['Skill development', 'Career advancement', 'Personal growth', 'Mastery'],
  },
  {
    id: 'meaning',
    name: 'Meaning & Impact',
    description: 'Desire to contribute beyond oneself. Common in mission-driven markets.',
    signal: 'This matters beyond just me.',
    examples: ['Making a positive impact', 'Acting ethically', 'Sustainability', 'Helping others'],
  },
];

// A benefit with its assigned need category
export type Benefit = {
  text: string;
  needCategory: NeedCategoryId;
};

export type Segment = {
  id: number;
  name: string;
  customerId?: number; // Links to customer from Part 1
  benefits: Benefit[]; // Copied from customer with need categories
  need: string; // Most important need for this segment
  accessRank: number; // 1-5 how easy to reach (used for ranking)
};

export type Customer = {
  id: number;
  text: string;
  benefits: Benefit[]; // Benefits with need category assignments
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
  updateCustomerBenefitNeedCategory: (customerId: number, index: number, needCategory: NeedCategoryId) => void;
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
        c.id === customerId
          ? { ...c, benefits: [...c.benefits, { text: benefit, needCategory: '' as NeedCategoryId }] }
          : c
      ),
    }));
  }, []);

  const updateCustomerBenefit = useCallback((customerId: number, index: number, benefit: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, benefits: c.benefits.map((b, i) => (i === index ? { ...b, text: benefit } : b)) }
          : c
      ),
    }));
  }, []);

  const updateCustomerBenefitNeedCategory = useCallback((customerId: number, index: number, needCategory: NeedCategoryId) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, benefits: c.benefits.map((b, i) => (i === index ? { ...b, needCategory } : b)) }
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
      updateCustomerBenefitNeedCategory,
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
    [state, updateIdea, addCustomer, updateCustomer, removeCustomer, addCustomerBenefit, updateCustomerBenefit, updateCustomerBenefitNeedCategory, removeCustomerBenefit, addSegment, syncSegmentsFromCustomers, updateSegmentNeed, updateSegmentAccessRank, setFocusedSegmentId, setPart, reset, setGraduated, getRecommendedBeachhead, importData, exportData]
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
