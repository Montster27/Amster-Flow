import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  Assumption,
  Interview,
  Iteration,
  AssumptionStatus,
  ConfidenceLevel,
  AssumptionType,
} from '../types/discovery';
import { generateId } from '../utils/idGenerator';

export type DiscoveryView = 'assumptions' | 'interviews' | 'board' | 'dashboard';

interface DiscoveryState {
  // UI State
  currentView: DiscoveryView;
  setCurrentView: (view: DiscoveryView) => void;

  // Assumptions
  assumptions: Assumption[];
  addAssumption: (type: AssumptionType, description: string) => void;
  updateAssumption: (id: string, updates: Partial<Assumption>) => void;
  deleteAssumption: (id: string) => void;
  updateAssumptionConfidence: (id: string, confidence: ConfidenceLevel) => void;
  updateAssumptionStatus: (id: string, status: AssumptionStatus) => void;
  addEvidenceToAssumption: (id: string, evidence: string) => void;

  // Interviews
  interviews: Interview[];
  addInterview: (interview: Omit<Interview, 'id'>) => void;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  deleteInterview: (id: string) => void;
  getInterviewsForAssumption: (assumptionId: string) => Interview[];

  // Iterations
  iterations: Iteration[];
  addIteration: (iteration: Omit<Iteration, 'id' | 'version'>) => void;
  getLatestIteration: () => Iteration | undefined;

  // Helper functions
  getAssumptionsByType: (type: AssumptionType) => Assumption[];
  getAssumptionsByStatus: (status: AssumptionStatus) => Assumption[];
  getUntestedAssumptions: () => Assumption[];
  getValidatedAssumptions: () => Assumption[];
  getInvalidatedAssumptions: () => Assumption[];

  // Import
  importData: (data: { assumptions: Assumption[]; interviews: Interview[]; iterations: Iteration[] }) => void;

  // Reset
  reset: () => void;
}

const DiscoveryContext = createContext<DiscoveryState | undefined>(undefined);

const initialState = {
  currentView: 'assumptions' as DiscoveryView,
  assumptions: [],
  interviews: [],
  iterations: [],
};

export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentViewState] = useState<DiscoveryView>(initialState.currentView);
  const [assumptions, setAssumptions] = useState<Assumption[]>(initialState.assumptions);
  const [interviews, setInterviews] = useState<Interview[]>(initialState.interviews);
  const [iterations, setIterations] = useState<Iteration[]>(initialState.iterations);

  const setCurrentView = useCallback((view: DiscoveryView) => {
    setCurrentViewState(view);
  }, []);

  const addAssumption = useCallback((type: AssumptionType, description: string, cluster: 'customer' | 'problem' | 'solution' = 'problem') => {
    const newAssumption: Assumption = {
      id: generateId(),
      type,
      description,
      cluster,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'untested',
      confidence: 3, // Medium confidence by default
      evidence: [],
    };
    setAssumptions((prev) => [...prev, newAssumption]);
  }, []);

  const updateAssumption = useCallback((id: string, updates: Partial<Assumption>) => {
    setAssumptions((prev) =>
      prev.map((assumption) =>
        assumption.id === id
          ? { ...assumption, ...updates, lastUpdated: new Date().toISOString() }
          : assumption
      )
    );
  }, []);

  const deleteAssumption = useCallback((id: string) => {
    setAssumptions((prev) => prev.filter((assumption) => assumption.id !== id));
    setInterviews((prev) =>
      prev.map((interview) => ({
        ...interview,
        assumptionsAddressed: interview.assumptionsAddressed.filter((aid) => aid !== id),
      }))
    );
  }, []);

  const updateAssumptionConfidence = useCallback((id: string, confidence: ConfidenceLevel) => {
    updateAssumption(id, { confidence });
  }, [updateAssumption]);

  const updateAssumptionStatus = useCallback((id: string, status: AssumptionStatus) => {
    updateAssumption(id, { status });
  }, [updateAssumption]);

  const addEvidenceToAssumption = useCallback((id: string, evidence: string) => {
    setAssumptions((prev) =>
      prev.map((assumption) =>
        assumption.id === id
          ? { ...assumption, evidence: [...assumption.evidence, evidence] }
          : assumption
      )
    );
  }, []);

  const addInterview = useCallback((interview: Omit<Interview, 'id'>) => {
    const newInterview: Interview = {
      ...interview,
      id: generateId(),
    };
    setInterviews((prev) => [...prev, newInterview]);

    // Automatically mark addressed assumptions as "testing"
    interview.assumptionsAddressed.forEach((assumptionId) => {
      setAssumptions((prev) =>
        prev.map((assumption) =>
          assumption.id === assumptionId && assumption.status === 'untested'
            ? { ...assumption, status: 'testing' as AssumptionStatus }
            : assumption
        )
      );
    });
  }, []);

  const updateInterview = useCallback((id: string, updates: Partial<Interview>) => {
    setInterviews((prev) =>
      prev.map((interview) => (interview.id === id ? { ...interview, ...updates } : interview))
    );
  }, []);

  const deleteInterview = useCallback((id: string) => {
    setInterviews((prev) => prev.filter((interview) => interview.id !== id));
  }, []);

  const getInterviewsForAssumption = useCallback((assumptionId: string) => {
    return interviews.filter((interview) =>
      interview.assumptionsAddressed.includes(assumptionId)
    );
  }, [interviews]);

  const addIteration = useCallback((iteration: Omit<Iteration, 'id' | 'version'>) => {
    setIterations((prev) => {
      const version = prev.length > 0 ? Math.max(...prev.map((i) => i.version)) + 1 : 1;
      const newIteration: Iteration = {
        ...iteration,
        id: generateId(),
        version,
      };
      return [...prev, newIteration];
    });
  }, []);

  const getLatestIteration = useCallback(() => {
    if (iterations.length === 0) return undefined;
    return iterations.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    );
  }, [iterations]);

  const getAssumptionsByType = useCallback((type: AssumptionType) => {
    return assumptions.filter((assumption) => assumption.type === type);
  }, [assumptions]);

  const getAssumptionsByStatus = useCallback((status: AssumptionStatus) => {
    return assumptions.filter((assumption) => assumption.status === status);
  }, [assumptions]);

  const getUntestedAssumptions = useCallback(() => {
    return getAssumptionsByStatus('untested');
  }, [getAssumptionsByStatus]);

  const getValidatedAssumptions = useCallback(() => {
    return getAssumptionsByStatus('validated');
  }, [getAssumptionsByStatus]);

  const getInvalidatedAssumptions = useCallback(() => {
    return getAssumptionsByStatus('invalidated');
  }, [getAssumptionsByStatus]);

  const importData = useCallback((data: { assumptions: Assumption[]; interviews: Interview[]; iterations: Iteration[] }) => {
    setAssumptions(data.assumptions || []);
    setInterviews(data.interviews || []);
    setIterations(data.iterations || []);
  }, []);

  const reset = useCallback(() => {
    setCurrentViewState(initialState.currentView);
    setAssumptions(initialState.assumptions);
    setInterviews(initialState.interviews);
    setIterations(initialState.iterations);
  }, []);

  const value: DiscoveryState = useMemo(
    () => ({
      currentView,
      setCurrentView,
      assumptions,
      addAssumption,
      updateAssumption,
      deleteAssumption,
      updateAssumptionConfidence,
      updateAssumptionStatus,
      addEvidenceToAssumption,
      interviews,
      addInterview,
      updateInterview,
      deleteInterview,
      getInterviewsForAssumption,
      iterations,
      addIteration,
      getLatestIteration,
      getAssumptionsByType,
      getAssumptionsByStatus,
      getUntestedAssumptions,
      getValidatedAssumptions,
      getInvalidatedAssumptions,
      importData,
      reset,
    }),
    [
      currentView,
      setCurrentView,
      assumptions,
      addAssumption,
      updateAssumption,
      deleteAssumption,
      updateAssumptionConfidence,
      updateAssumptionStatus,
      addEvidenceToAssumption,
      interviews,
      addInterview,
      updateInterview,
      deleteInterview,
      getInterviewsForAssumption,
      iterations,
      addIteration,
      getLatestIteration,
      getAssumptionsByType,
      getAssumptionsByStatus,
      getUntestedAssumptions,
      getValidatedAssumptions,
      getInvalidatedAssumptions,
      importData,
      reset,
    ]
  );

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery() {
  const context = useContext(DiscoveryContext);
  if (context === undefined) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
}
