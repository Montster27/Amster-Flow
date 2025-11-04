import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Assumption,
  Interview,
  Iteration,
  AssumptionStatus,
  ConfidenceLevel,
  AssumptionType,
} from '../types/discovery';
import { generateId } from '../utils/idGenerator';

export type DiscoveryView = 'assumptions' | 'planner' | 'log' | 'dashboard';

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

const initialState = {
  currentView: 'assumptions' as DiscoveryView,
  assumptions: [],
  interviews: [],
  iterations: [],
};

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // UI Actions
      setCurrentView: (view) => set({ currentView: view }),

      // Assumption Actions
      addAssumption: (type, description) => {
        const newAssumption: Assumption = {
          id: generateId(),
          type,
          description,
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          status: 'untested',
          confidence: 3, // Medium confidence by default
          evidence: [],
        };

        set((state) => ({
          assumptions: [...state.assumptions, newAssumption],
        }));
      },

      updateAssumption: (id, updates) => {
        set((state) => ({
          assumptions: state.assumptions.map((assumption) =>
            assumption.id === id
              ? { ...assumption, ...updates, lastUpdated: new Date().toISOString() }
              : assumption
          ),
        }));
      },

      deleteAssumption: (id) => {
        set((state) => ({
          assumptions: state.assumptions.filter((assumption) => assumption.id !== id),
          // Also remove references from interviews
          interviews: state.interviews.map((interview) => ({
            ...interview,
            assumptionsAddressed: interview.assumptionsAddressed.filter((aid) => aid !== id),
          })),
        }));
      },

      updateAssumptionConfidence: (id, confidence) => {
        get().updateAssumption(id, { confidence });
      },

      updateAssumptionStatus: (id, status) => {
        get().updateAssumption(id, { status });
      },

      addEvidenceToAssumption: (id, evidence) => {
        const assumption = get().assumptions.find((a) => a.id === id);
        if (assumption) {
          get().updateAssumption(id, {
            evidence: [...assumption.evidence, evidence],
          });
        }
      },

      // Interview Actions
      addInterview: (interview) => {
        const newInterview: Interview = {
          ...interview,
          id: generateId(),
        };

        set((state) => ({
          interviews: [...state.interviews, newInterview],
        }));

        // Automatically mark addressed assumptions as "testing"
        interview.assumptionsAddressed.forEach((assumptionId) => {
          const assumption = get().assumptions.find((a) => a.id === assumptionId);
          if (assumption && assumption.status === 'untested') {
            get().updateAssumptionStatus(assumptionId, 'testing');
          }
        });
      },

      updateInterview: (id, updates) => {
        set((state) => ({
          interviews: state.interviews.map((interview) =>
            interview.id === id ? { ...interview, ...updates } : interview
          ),
        }));
      },

      deleteInterview: (id) => {
        set((state) => ({
          interviews: state.interviews.filter((interview) => interview.id !== id),
        }));
      },

      getInterviewsForAssumption: (assumptionId) => {
        return get().interviews.filter((interview) =>
          interview.assumptionsAddressed.includes(assumptionId)
        );
      },

      // Iteration Actions
      addIteration: (iteration) => {
        const iterations = get().iterations;
        const version = iterations.length > 0 ? Math.max(...iterations.map((i) => i.version)) + 1 : 1;

        const newIteration: Iteration = {
          ...iteration,
          id: generateId(),
          version,
        };

        set((state) => ({
          iterations: [...state.iterations, newIteration],
        }));
      },

      getLatestIteration: () => {
        const iterations = get().iterations;
        if (iterations.length === 0) return undefined;
        return iterations.reduce((latest, current) =>
          current.version > latest.version ? current : latest
        );
      },

      // Helper Functions
      getAssumptionsByType: (type) => {
        return get().assumptions.filter((assumption) => assumption.type === type);
      },

      getAssumptionsByStatus: (status) => {
        return get().assumptions.filter((assumption) => assumption.status === status);
      },

      getUntestedAssumptions: () => {
        return get().getAssumptionsByStatus('untested');
      },

      getValidatedAssumptions: () => {
        return get().getAssumptionsByStatus('validated');
      },

      getInvalidatedAssumptions: () => {
        return get().getAssumptionsByStatus('invalidated');
      },

      // Import
      importData: (data) => {
        set({
          assumptions: data.assumptions || [],
          interviews: data.interviews || [],
          iterations: data.iterations || [],
        });
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'amster-flow-discovery-storage',
      version: 1,
      partialize: (state) => ({
        currentView: state.currentView,
        assumptions: state.assumptions,
        interviews: state.interviews,
        iterations: state.iterations,
      }),
      migrate: (persistedState: any, _version: number) => {
        // Migrate old data to ensure all required fields exist
        if (persistedState && persistedState.interviews) {
          persistedState.interviews = persistedState.interviews.map((interview: any) => ({
            ...interview,
            assumptionsAddressed: interview.assumptionsAddressed || [],
            keyInsights: interview.keyInsights || [],
            followUpNeeded: interview.followUpNeeded ?? false,
          }));
        }
        return persistedState;
      },
    }
  )
);
