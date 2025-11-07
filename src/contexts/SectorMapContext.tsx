import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  CustomerType,
  FirstTarget,
  Competitor,
  DecisionMaker,
  SectorMapData,
} from '../types/sectorMap';
import { generateId } from '../utils/idGenerator';

interface SectorMapState extends SectorMapData {
  // Actions for customer type
  setCustomerType: (type: CustomerType) => void;

  // Actions for first target
  updateFirstTarget: (target: Partial<FirstTarget>) => void;

  // Actions for competitors
  addCompetitor: (name: string, description: string) => void;
  updateCompetitor: (id: string, updates: Partial<Competitor>) => void;
  deleteCompetitor: (id: string) => void;
  addSupplierToCompetitor: (competitorId: string, supplier: string) => void;
  removeSupplierFromCompetitor: (competitorId: string, supplier: string) => void;
  addCustomerToCompetitor: (competitorId: string, customer: string) => void;
  removeCustomerFromCompetitor: (competitorId: string, customer: string) => void;

  // Actions for decision makers (consumer type)
  addDecisionMaker: (role: string, influence: DecisionMaker['influence'], description: string) => void;
  updateDecisionMaker: (id: string, updates: Partial<DecisionMaker>) => void;
  deleteDecisionMaker: (id: string) => void;

  // Import/Export
  importData: (data: SectorMapData) => void;
  reset: () => void;
}

const SectorMapContext = createContext<SectorMapState | undefined>(undefined);

const initialState: SectorMapData = {
  customerType: 'business',
  firstTarget: {
    description: '',
    companySize: '',
    location: '',
  },
  competitors: [],
  decisionMakers: [],
};

export function SectorMapProvider({ children }: { children: ReactNode }) {
  const [customerType, setCustomerTypeState] = useState<CustomerType>(initialState.customerType);
  const [firstTarget, setFirstTarget] = useState<FirstTarget>(initialState.firstTarget);
  const [competitors, setCompetitors] = useState<Competitor[]>(initialState.competitors);
  const [decisionMakers, setDecisionMakers] = useState<DecisionMaker[]>(initialState.decisionMakers);

  const setCustomerType = useCallback((type: CustomerType) => {
    setCustomerTypeState(type);
  }, []);

  const updateFirstTarget = useCallback((target: Partial<FirstTarget>) => {
    setFirstTarget((prev) => ({ ...prev, ...target }));
  }, []);

  const addCompetitor = useCallback((name: string, description: string) => {
    const newCompetitor: Competitor = {
      id: generateId(),
      name,
      description,
      suppliers: [],
      customers: [],
      created: new Date().toISOString(),
    };
    setCompetitors((prev) => [...prev, newCompetitor]);
  }, []);

  const updateCompetitor = useCallback((id: string, updates: Partial<Competitor>) => {
    setCompetitors((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp))
    );
  }, []);

  const deleteCompetitor = useCallback((id: string) => {
    setCompetitors((prev) => prev.filter((comp) => comp.id !== id));
  }, []);

  const addSupplierToCompetitor = useCallback((competitorId: string, supplier: string) => {
    setCompetitors((prev) =>
      prev.map((comp) =>
        comp.id === competitorId
          ? { ...comp, suppliers: [...comp.suppliers, supplier] }
          : comp
      )
    );
  }, []);

  const removeSupplierFromCompetitor = useCallback((competitorId: string, supplier: string) => {
    setCompetitors((prev) =>
      prev.map((comp) =>
        comp.id === competitorId
          ? { ...comp, suppliers: comp.suppliers.filter((s) => s !== supplier) }
          : comp
      )
    );
  }, []);

  const addCustomerToCompetitor = useCallback((competitorId: string, customer: string) => {
    setCompetitors((prev) =>
      prev.map((comp) =>
        comp.id === competitorId
          ? { ...comp, customers: [...comp.customers, customer] }
          : comp
      )
    );
  }, []);

  const removeCustomerFromCompetitor = useCallback((competitorId: string, customer: string) => {
    setCompetitors((prev) =>
      prev.map((comp) =>
        comp.id === competitorId
          ? { ...comp, customers: comp.customers.filter((c) => c !== customer) }
          : comp
      )
    );
  }, []);

  const addDecisionMaker = useCallback((
    role: string,
    influence: DecisionMaker['influence'],
    description: string
  ) => {
    const newDecisionMaker: DecisionMaker = {
      id: generateId(),
      role,
      influence,
      description,
      created: new Date().toISOString(),
    };
    setDecisionMakers((prev) => [...prev, newDecisionMaker]);
  }, []);

  const updateDecisionMaker = useCallback((id: string, updates: Partial<DecisionMaker>) => {
    setDecisionMakers((prev) =>
      prev.map((dm) => (dm.id === id ? { ...dm, ...updates } : dm))
    );
  }, []);

  const deleteDecisionMaker = useCallback((id: string) => {
    setDecisionMakers((prev) => prev.filter((dm) => dm.id !== id));
  }, []);

  const importData = useCallback((data: SectorMapData) => {
    setCustomerTypeState(data.customerType);
    setFirstTarget(data.firstTarget);
    setCompetitors(data.competitors || []);
    setDecisionMakers(data.decisionMakers || []);
  }, []);

  const reset = useCallback(() => {
    setCustomerTypeState(initialState.customerType);
    setFirstTarget(initialState.firstTarget);
    setCompetitors(initialState.competitors);
    setDecisionMakers(initialState.decisionMakers);
  }, []);

  const value: SectorMapState = useMemo(
    () => ({
      customerType,
      firstTarget,
      competitors,
      decisionMakers,
      setCustomerType,
      updateFirstTarget,
      addCompetitor,
      updateCompetitor,
      deleteCompetitor,
      addSupplierToCompetitor,
      removeSupplierFromCompetitor,
      addCustomerToCompetitor,
      removeCustomerFromCompetitor,
      addDecisionMaker,
      updateDecisionMaker,
      deleteDecisionMaker,
      importData,
      reset,
    }),
    [
      customerType,
      firstTarget,
      competitors,
      decisionMakers,
      setCustomerType,
      updateFirstTarget,
      addCompetitor,
      updateCompetitor,
      deleteCompetitor,
      addSupplierToCompetitor,
      removeSupplierFromCompetitor,
      addCustomerToCompetitor,
      removeCustomerFromCompetitor,
      addDecisionMaker,
      updateDecisionMaker,
      deleteDecisionMaker,
      importData,
      reset,
    ]
  );

  return <SectorMapContext.Provider value={value}>{children}</SectorMapContext.Provider>;
}

export function useSectorMap() {
  const context = useContext(SectorMapContext);
  if (context === undefined) {
    throw new Error('useSectorMap must be used within a SectorMapProvider');
  }
  return context;
}
