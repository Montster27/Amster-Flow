import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Discovery2Assumption, EnhancedInterview } from '../types/discovery';

interface Discovery2ContextType {
  assumptions: Discovery2Assumption[];
  addAssumption: (assumption: Discovery2Assumption) => Discovery2Assumption;
  updateAssumption: (id: string, updates: Partial<Discovery2Assumption>) => void;
  deleteAssumption: (id: string) => void;
  getAssumptionById: (id: string) => Discovery2Assumption | undefined;
  getAssumptionsByCanvasArea: (canvasArea: string) => Discovery2Assumption[];
  getHighPriorityAssumptions: () => Discovery2Assumption[];
  interviews: EnhancedInterview[];
  addInterview: (interview: EnhancedInterview) => void;
  updateInterview: (id: string, updates: Partial<EnhancedInterview>) => void;
  deleteInterview: (id: string) => void;
  getInterviewById: (id: string) => EnhancedInterview | undefined;
  importData: (data: { assumptions: Discovery2Assumption[]; interviews?: EnhancedInterview[] }) => void;
  reset: () => void;

  // Phase 1: System Structure Integration - Linking functions
  linkAssumptionToActor: (assumptionId: string, actorId: string) => void;
  unlinkAssumptionFromActor: (assumptionId: string, actorId: string) => void;
  linkAssumptionToConnection: (assumptionId: string, connectionId: string) => void;
  unlinkAssumptionFromConnection: (assumptionId: string, connectionId: string) => void;
  getAssumptionsByActor: (actorId: string) => Discovery2Assumption[];
  getAssumptionsByConnection: (connectionId: string) => Discovery2Assumption[];
}

const Discovery2Context = createContext<Discovery2ContextType | undefined>(undefined);

// Export the context for direct access when needed
export { Discovery2Context };

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
  const [interviews, setInterviews] = useState<EnhancedInterview[]>([]);

  const addAssumption = useCallback((assumption: Discovery2Assumption) => {
    setAssumptions((prev) => [...prev, assumption]);
    return assumption; // Return the assumption for immediate use
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

  // Interview management
  const addInterview = useCallback((interview: EnhancedInterview) => {
    setInterviews((prev) => [...prev, interview]);
  }, []);

  const updateInterview = useCallback((id: string, updates: Partial<EnhancedInterview>) => {
    setInterviews((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              ...updates,
              lastUpdated: new Date().toISOString(),
            }
          : i
      )
    );
  }, []);

  const deleteInterview = useCallback((id: string) => {
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const getInterviewById = useCallback(
    (id: string) => {
      return interviews.find((i) => i.id === id);
    },
    [interviews]
  );

  const importData = useCallback((data: { assumptions: Discovery2Assumption[]; interviews?: EnhancedInterview[] }) => {
    setAssumptions(data.assumptions);
    if (data.interviews) {
      setInterviews(data.interviews);
    }
  }, []);

  const reset = useCallback(() => {
    setAssumptions([]);
    setInterviews([]);
  }, []);

  // Phase 1: System Structure Integration - Linking implementations
  const linkAssumptionToActor = useCallback((assumptionId: string, actorId: string) => {
    setAssumptions((prev) =>
      prev.map((assumption) => {
        if (assumption.id === assumptionId) {
          const linkedActorIds = assumption.linkedActorIds || [];
          if (!linkedActorIds.includes(actorId)) {
            return {
              ...assumption,
              linkedActorIds: [...linkedActorIds, actorId],
              lastUpdated: new Date().toISOString(),
            };
          }
        }
        return assumption;
      })
    );
  }, []);

  const unlinkAssumptionFromActor = useCallback((assumptionId: string, actorId: string) => {
    setAssumptions((prev) =>
      prev.map((assumption) => {
        if (assumption.id === assumptionId && assumption.linkedActorIds) {
          return {
            ...assumption,
            linkedActorIds: assumption.linkedActorIds.filter((id) => id !== actorId),
            lastUpdated: new Date().toISOString(),
          };
        }
        return assumption;
      })
    );
  }, []);

  const linkAssumptionToConnection = useCallback((assumptionId: string, connectionId: string) => {
    setAssumptions((prev) =>
      prev.map((assumption) => {
        if (assumption.id === assumptionId) {
          const linkedConnectionIds = assumption.linkedConnectionIds || [];
          if (!linkedConnectionIds.includes(connectionId)) {
            return {
              ...assumption,
              linkedConnectionIds: [...linkedConnectionIds, connectionId],
              lastUpdated: new Date().toISOString(),
            };
          }
        }
        return assumption;
      })
    );
  }, []);

  const unlinkAssumptionFromConnection = useCallback((assumptionId: string, connectionId: string) => {
    setAssumptions((prev) =>
      prev.map((assumption) => {
        if (assumption.id === assumptionId && assumption.linkedConnectionIds) {
          return {
            ...assumption,
            linkedConnectionIds: assumption.linkedConnectionIds.filter((id) => id !== connectionId),
            lastUpdated: new Date().toISOString(),
          };
        }
        return assumption;
      })
    );
  }, []);

  const getAssumptionsByActor = useCallback(
    (actorId: string) => {
      return assumptions.filter((a) => a.linkedActorIds?.includes(actorId));
    },
    [assumptions]
  );

  const getAssumptionsByConnection = useCallback(
    (connectionId: string) => {
      return assumptions.filter((a) => a.linkedConnectionIds?.includes(connectionId));
    },
    [assumptions]
  );

  const value: Discovery2ContextType = {
    assumptions,
    addAssumption,
    updateAssumption,
    deleteAssumption,
    getAssumptionById,
    getAssumptionsByCanvasArea,
    getHighPriorityAssumptions,
    interviews,
    addInterview,
    updateInterview,
    deleteInterview,
    getInterviewById,
    importData,
    reset,
    // Phase 1: System Structure Integration
    linkAssumptionToActor,
    unlinkAssumptionFromActor,
    linkAssumptionToConnection,
    unlinkAssumptionFromConnection,
    getAssumptionsByActor,
    getAssumptionsByConnection,
  };

  return (
    <Discovery2Context.Provider value={value}>
      {children}
    </Discovery2Context.Provider>
  );
}
