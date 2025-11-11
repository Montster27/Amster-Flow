import { createContext, useContext, useState, ReactNode } from 'react';
import type {
  DecisionPath,
  PivotDecision,
  Evidence,
  ReframingResponses,
  ConfidenceAssessment,
  PIVOTReadiness,
  PivotType,
  CognitiveBias,
  ProductMarketFit,
  RetentionMetrics,
  UnitEconomics,
  JobsToBeDone,
  PainPoint,
  Quote,
  Hypothesis,
} from '../types/pivot';

// Context state interface
interface PivotContextState {
  // Current decision data (synced to database)
  currentDecision: PivotDecision | null;
  mode: 'easy' | 'detailed';

  // Current step in the flow
  currentStep: 'pre-mortem' | 'progress' | 'reflection' | 'confidence' | 'decision' | 'evidence' | 'hypothesis' | 'mixed-methods' | 'trajectory' | 'pivot-types' | 'complete';

  // Methods to update decision data (all auto-save to database)
  setCurrentDecision: (decision: PivotDecision | null) => void;
  setMode: (mode: 'easy' | 'detailed') => void;
  setCurrentStep: (step: PivotContextState['currentStep']) => void;

  // Pre-mortem
  updatePreMortemInsights: (insights: string[]) => void;

  // Reframing responses
  updateReframingResponses: (responses: Partial<ReframingResponses>) => void;

  // Confidence assessment (Easy mode)
  updateConfidenceAssessment: (assessment: Partial<ConfidenceAssessment>) => void;

  // Decision
  setDecision: (decision: DecisionPath) => void;
  updateDecisionRationale: (rationale: string) => void;
  updateNextActions: (actions: string[]) => void;

  // PIVOT readiness
  updatePIVOTReadiness: (readiness: Partial<PIVOTReadiness>) => void;
  setRecommendedPivotType: (type: PivotType) => void;

  // Evidence (Detailed mode)
  addEvidence: (evidence: Evidence) => void;
  updateEvidence: (id: string, updates: Partial<Evidence>) => void;
  deleteEvidence: (id: string) => void;

  // Quantitative metrics (Detailed mode)
  updateProductMarketFit: (pmf: ProductMarketFit) => void;
  updateRetentionMetrics: (retention: RetentionMetrics) => void;
  updateUnitEconomics: (economics: UnitEconomics) => void;

  // Qualitative insights (Detailed mode)
  updateJobsToBeDone: (jobs: JobsToBeDone) => void;
  addPainPoint: (painPoint: PainPoint) => void;
  updatePainPoint: (id: string, updates: Partial<PainPoint>) => void;
  deletePainPoint: (id: string) => void;
  addCustomerQuote: (quote: Quote) => void;
  deleteCustomerQuote: (id: string) => void;

  // Hypothesis (Detailed mode)
  updateHypothesis: (hypothesis: Hypothesis) => void;

  // Reflection
  updateLessonsLearned: (lessons: string[]) => void;
  addBiasIdentified: (bias: CognitiveBias) => void;
  removeBiasIdentified: (bias: CognitiveBias) => void;
  updateConfidenceLevel: (level: number) => void;

  // Advisors
  updateAdvisorsConsulted: (advisors: string[]) => void;

  // Complete decision
  completeDecision: () => void;

  // Reset for new decision
  resetDecision: () => void;
}

const PivotContext = createContext<PivotContextState | undefined>(undefined);

// Export context for external use (e.g., in hooks)
export { PivotContext };
export type { PivotContextState };

export function PivotProvider({ children }: { children: ReactNode }) {
  const [currentDecision, setCurrentDecision] = useState<PivotDecision | null>(null);
  const [mode, setMode] = useState<'easy' | 'detailed'>('easy');
  const [currentStep, setCurrentStep] = useState<PivotContextState['currentStep']>('pre-mortem');

  // Helper to update current decision (this will trigger auto-save via usePivotData hook)
  const updateDecision = (updates: Partial<PivotDecision>) => {
    setCurrentDecision(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Pre-mortem insights
  const updatePreMortemInsights = (insights: string[]) => {
    updateDecision({ preMortemInsights: insights });
  };

  // Reframing responses
  const updateReframingResponses = (responses: Partial<ReframingResponses>) => {
    updateDecision({
      reframingResponses: {
        ...currentDecision?.reframingResponses,
        ...responses,
      } as ReframingResponses,
    });
  };

  // Confidence assessment
  const updateConfidenceAssessment = (assessment: Partial<ConfidenceAssessment>) => {
    updateDecision({
      confidenceAssessment: {
        ...currentDecision?.confidenceAssessment,
        ...assessment,
      } as ConfidenceAssessment,
    });
  };

  // Decision
  const setDecision = (decision: DecisionPath) => {
    updateDecision({ decision });
  };

  const updateDecisionRationale = (rationale: string) => {
    updateDecision({ decisionRationale: rationale });
  };

  const updateNextActions = (actions: string[]) => {
    updateDecision({ nextActions: actions });
  };

  // PIVOT readiness
  const updatePIVOTReadiness = (readiness: Partial<PIVOTReadiness>) => {
    updateDecision({
      pivotReadiness: {
        ...currentDecision?.pivotReadiness,
        ...readiness,
      } as PIVOTReadiness,
    });
  };

  const setRecommendedPivotType = (type: PivotType) => {
    updateDecision({ recommendedPivotType: type });
  };

  // Evidence management
  const addEvidence = (evidence: Evidence) => {
    const contradictoryEvidence = [...(currentDecision?.contradictoryEvidence || [])];
    if (evidence.contradicts) {
      contradictoryEvidence.push(evidence);
    }
    updateDecision({ contradictoryEvidence });
  };

  const updateEvidence = (id: string, updates: Partial<Evidence>) => {
    const contradictoryEvidence = currentDecision?.contradictoryEvidence?.map(e =>
      e.id === id ? { ...e, ...updates } : e
    ) || [];
    updateDecision({ contradictoryEvidence });
  };

  const deleteEvidence = (id: string) => {
    const contradictoryEvidence = currentDecision?.contradictoryEvidence?.filter(e => e.id !== id) || [];
    updateDecision({ contradictoryEvidence });
  };

  // Quantitative metrics
  const updateProductMarketFit = (pmf: ProductMarketFit) => {
    updateDecision({ productMarketFit: pmf });
  };

  const updateRetentionMetrics = (retention: RetentionMetrics) => {
    updateDecision({ retentionMetrics: retention });
  };

  const updateUnitEconomics = (economics: UnitEconomics) => {
    updateDecision({ unitEconomics: economics });
  };

  // Qualitative insights
  const updateJobsToBeDone = (jobs: JobsToBeDone) => {
    updateDecision({ jobsToBeDone: jobs });
  };

  const addPainPoint = (painPoint: PainPoint) => {
    const painPoints = [...(currentDecision?.painPoints || []), painPoint];
    updateDecision({ painPoints });
  };

  const updatePainPoint = (id: string, updates: Partial<PainPoint>) => {
    const painPoints = currentDecision?.painPoints?.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ) || [];
    updateDecision({ painPoints });
  };

  const deletePainPoint = (id: string) => {
    const painPoints = currentDecision?.painPoints?.filter(p => p.id !== id) || [];
    updateDecision({ painPoints });
  };

  const addCustomerQuote = (quote: Quote) => {
    const customerQuotes = [...(currentDecision?.customerQuotes || []), quote];
    updateDecision({ customerQuotes });
  };

  const deleteCustomerQuote = (id: string) => {
    const customerQuotes = currentDecision?.customerQuotes?.filter(q => q.id !== id) || [];
    updateDecision({ customerQuotes });
  };

  // Hypothesis
  const updateHypothesis = (hypothesis: Hypothesis) => {
    updateDecision({ hypothesisTested: hypothesis });
  };

  // Reflection
  const updateLessonsLearned = (lessons: string[]) => {
    updateDecision({ lessonsLearned: lessons });
  };

  const addBiasIdentified = (bias: CognitiveBias) => {
    const biases = [...(currentDecision?.biasesIdentified || [])];
    if (!biases.includes(bias)) {
      biases.push(bias);
      updateDecision({ biasesIdentified: biases });
    }
  };

  const removeBiasIdentified = (bias: CognitiveBias) => {
    const biases = currentDecision?.biasesIdentified?.filter(b => b !== bias) || [];
    updateDecision({ biasesIdentified: biases });
  };

  const updateConfidenceLevel = (level: number) => {
    updateDecision({ confidenceLevel: level });
  };

  // Advisors
  const updateAdvisorsConsulted = (advisors: string[]) => {
    updateDecision({ externalAdvisorsConsulted: advisors });
  };

  // Complete decision
  const completeDecision = () => {
    updateDecision({
      completedAt: new Date().toISOString(),
    });
    setCurrentStep('complete');
  };

  // Reset for new decision
  const resetDecision = () => {
    setCurrentDecision(null);
    setMode('easy');
    setCurrentStep('pre-mortem');
  };

  const value: PivotContextState = {
    currentDecision,
    mode,
    currentStep,
    setCurrentDecision,
    setMode,
    setCurrentStep,
    updatePreMortemInsights,
    updateReframingResponses,
    updateConfidenceAssessment,
    setDecision,
    updateDecisionRationale,
    updateNextActions,
    updatePIVOTReadiness,
    setRecommendedPivotType,
    addEvidence,
    updateEvidence,
    deleteEvidence,
    updateProductMarketFit,
    updateRetentionMetrics,
    updateUnitEconomics,
    updateJobsToBeDone,
    addPainPoint,
    updatePainPoint,
    deletePainPoint,
    addCustomerQuote,
    deleteCustomerQuote,
    updateHypothesis,
    updateLessonsLearned,
    addBiasIdentified,
    removeBiasIdentified,
    updateConfidenceLevel,
    updateAdvisorsConsulted,
    completeDecision,
    resetDecision,
  };

  return <PivotContext.Provider value={value}>{children}</PivotContext.Provider>;
}

export function usePivot() {
  const context = useContext(PivotContext);
  if (context === undefined) {
    throw new Error('usePivot must be used within a PivotProvider');
  }
  return context;
}

// Export for external access to set initial decision data (from database)
export function useSetInitialDecision() {
  const context = useContext(PivotContext);
  if (context === undefined) {
    throw new Error('useSetInitialDecision must be used within a PivotProvider');
  }
  return (decision: PivotDecision | null) => {
    // This is used by usePivotData hook to set initial data from database
    const setCurrentDecision = (context as any).setCurrentDecision;
    if (setCurrentDecision) {
      setCurrentDecision(decision);
    }
  };
}
