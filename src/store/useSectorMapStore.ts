import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useSectorMapStore = create<SectorMapState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Customer type actions
      setCustomerType: (type) => set({ customerType: type }),

      // First target actions
      updateFirstTarget: (target) => {
        set((state) => ({
          firstTarget: { ...state.firstTarget, ...target },
        }));
      },

      // Competitor actions
      addCompetitor: (name, description) => {
        const newCompetitor: Competitor = {
          id: generateId(),
          name,
          description,
          suppliers: [],
          customers: [],
          created: new Date().toISOString(),
        };
        set((state) => ({
          competitors: [...state.competitors, newCompetitor],
        }));
      },

      updateCompetitor: (id, updates) => {
        set((state) => ({
          competitors: state.competitors.map((comp) =>
            comp.id === id ? { ...comp, ...updates } : comp
          ),
        }));
      },

      deleteCompetitor: (id) => {
        set((state) => ({
          competitors: state.competitors.filter((comp) => comp.id !== id),
        }));
      },

      addSupplierToCompetitor: (competitorId, supplier) => {
        const competitor = get().competitors.find((c) => c.id === competitorId);
        if (competitor) {
          get().updateCompetitor(competitorId, {
            suppliers: [...competitor.suppliers, supplier],
          });
        }
      },

      removeSupplierFromCompetitor: (competitorId, supplier) => {
        const competitor = get().competitors.find((c) => c.id === competitorId);
        if (competitor) {
          get().updateCompetitor(competitorId, {
            suppliers: competitor.suppliers.filter((s) => s !== supplier),
          });
        }
      },

      addCustomerToCompetitor: (competitorId, customer) => {
        const competitor = get().competitors.find((c) => c.id === competitorId);
        if (competitor) {
          get().updateCompetitor(competitorId, {
            customers: [...competitor.customers, customer],
          });
        }
      },

      removeCustomerFromCompetitor: (competitorId, customer) => {
        const competitor = get().competitors.find((c) => c.id === competitorId);
        if (competitor) {
          get().updateCompetitor(competitorId, {
            customers: competitor.customers.filter((c) => c !== customer),
          });
        }
      },

      // Decision maker actions
      addDecisionMaker: (role, influence, description) => {
        const newDecisionMaker: DecisionMaker = {
          id: generateId(),
          role,
          influence,
          description,
          created: new Date().toISOString(),
        };
        set((state) => ({
          decisionMakers: [...state.decisionMakers, newDecisionMaker],
        }));
      },

      updateDecisionMaker: (id, updates) => {
        set((state) => ({
          decisionMakers: state.decisionMakers.map((dm) =>
            dm.id === id ? { ...dm, ...updates } : dm
          ),
        }));
      },

      deleteDecisionMaker: (id) => {
        set((state) => ({
          decisionMakers: state.decisionMakers.filter((dm) => dm.id !== id),
        }));
      },

      // Import/Export
      importData: (data) => {
        set({
          customerType: data.customerType,
          firstTarget: data.firstTarget,
          competitors: data.competitors || [],
          decisionMakers: data.decisionMakers || [],
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'amster-flow-sector-map-storage',
    }
  )
);
