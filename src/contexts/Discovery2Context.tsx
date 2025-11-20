import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Discovery2Assumption } from '../types/discovery';

interface Discovery2ContextType {
  assumptions: Discovery2Assumption[];
  addAssumption: (assumption: Discovery2Assumption) => void;
  updateAssumption: (id: string, updates: Partial<Discovery2Assumption>) => void;
  deleteAssumption: (id: string) => void;
  getAssumptionById: (id: string) => Discovery2Assumption | undefined;
  getAssumptionsByCanvasArea: (canvasArea: string) => Discovery2Assumption[];
  getHighPriorityAssumptions: () => Discovery2Assumption[];
  importData: (data: { assumptions: Discovery2Assumption[] }) => void;
  reset: () => void;
}

const Discovery2Context = createContext<Discovery2ContextType | undefined>(undefined);

export function useDiscovery2() {
  const context = useContext(Discovery2Context);
  if (!context) {
    throw new Error('useDiscovery2 must be used within Discovery2Provider');
  }
  return context;
}

interface Discovery2ProviderProps {
  children: ReactNode;
}

export function Discovery2Provider({ children }: Discovery2ProviderProps) {
  const [assumptions, setAssumptions] = useState<Discovery2Assumption[]>([]);

  const addAssumption = useCallback((assumption: Discovery2Assumption) => {
    setAssumptions((prev) => [...prev, assumption]);
  }, []);

  const updateAssumption = useCallback((id: string, updates: Partial<Discovery2Assumption>) => {
    setAssumptions((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...updates,
              lastUpdated: new Date().toISOString(),
            }
          : a
      )
    );
  }, []);

  const deleteAssumption = useCallback((id: string) => {
    setAssumptions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAssumptionById = useCallback(
    (id: string) => {
      return assumptions.find((a) => a.id === id);
    },
    [assumptions]
  );

  const getAssumptionsByCanvasArea = useCallback(
    (canvasArea: string) => {
      return assumptions.filter((a) => a.canvasArea === canvasArea);
    },
    [assumptions]
  );

  const getHighPriorityAssumptions = useCallback(() => {
    return assumptions.filter((a) => a.priority === 'high');
  }, [assumptions]);

  const importData = useCallback((data: { assumptions: Discovery2Assumption[] }) => {
    setAssumptions(data.assumptions);
  }, []);

  const reset = useCallback(() => {
    setAssumptions([]);
  }, []);

  const value: Discovery2ContextType = {
    assumptions,
    addAssumption,
    updateAssumption,
    deleteAssumption,
    getAssumptionById,
    getAssumptionsByCanvasArea,
    getHighPriorityAssumptions,
    importData,
    reset,
  };

  return (
    <Discovery2Context.Provider value={value}>
      {children}
    </Discovery2Context.Provider>
  );
}
