// Visual Sector Map Types - Interactive network visualization

export type ActorCategory =
  | 'customer'      // 🧓 Customers / Users
  | 'provider'      // 🏢 Providers / Companies
  | 'regulator'     // 🏛️ Regulators / Policymakers
  | 'funder'        // 💰 Funders / Investors
  | 'partner'       // 🌐 Partners / Distributors
  | 'influencer';   // 🧠 Influencers / Experts

export type ConnectionType =
  | 'money'         // 💵 Money flow
  | 'information'   // 📢 Information flow
  | 'regulation'    // ⚖️ Regulation
  | 'support';      // ❤️ Support / trust

export type AnnotationType =
  | 'pain-point'    // ⚠️ Pain point
  | 'opportunity'   // 💡 Opportunity
  | 'uncertainty';  // ❓ Uncertainty / Hypothesis

export type AnnotationStatus =
  | 'validated'
  | 'unvalidated'
  | 'needs-interview';

export type LayerType =
  | 'value'         // Value Flow Layer: money, resources, incentives
  | 'information'   // Information Layer: communication, decisions
  | 'regulation';   // Regulation Layer: rules, compliance

export interface Position {
  x: number;
  y: number;
}

export interface Actor {
  id: string;
  name: string;
  category: ActorCategory;
  position: Position;
  description?: string;
  created: string;
  // Assumptions integration (Phase 1: bidirectional with Discovery)
  linkedAssumptions?: string[]; // Array of assumption IDs - maintained by linking hooks
  riskScore?: number; // 1-5: calculated from linked assumptions' status/confidence
  notes?: string; // Optional notes about this actor
}

export interface Connection {
  id: string;
  sourceActorId: string;
  targetActorId: string;
  type: ConnectionType;
  description: string;
  layer?: LayerType; // Which layer this connection belongs to
  created: string;
  // Assumptions integration (Phase 1: bidirectional with Discovery)
  linkedAssumptions?: string[]; // Array of assumption IDs - maintained by linking hooks
  riskScore?: number; // 1-5: calculated from linked assumptions
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  targetId: string; // Can be an actor ID or connection ID
  targetType: 'actor' | 'connection';
  content: string;
  status: AnnotationStatus;
  created: string;
}

export interface SectorMapScope {
  sector: string; // "What's the sector or problem area you're exploring?"
  question: string; // "What's the question you want to answer?"
}

export interface VisualSectorMapData {
  scope: SectorMapScope;
  actors: Actor[];
  connections: Connection[];
  annotations: Annotation[];
  activeLayers: LayerType[]; // Which layers are currently visible
}

// Color schemes for actor categories
export const ACTOR_COLORS: Record<ActorCategory, { bg: string; border: string; text: string }> = {
  customer: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  provider: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  regulator: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  funder: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  partner: { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800' },
  influencer: { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800' },
};

// Icons for actor categories (emoji)
export const ACTOR_ICONS: Record<ActorCategory, string> = {
  customer: '🧓',
  provider: '🏢',
  regulator: '🏛️',
  funder: '💰',
  partner: '🌐',
  influencer: '🧠',
};

// Icons for connection types
export const CONNECTION_ICONS: Record<ConnectionType, string> = {
  money: '💵',
  information: '📢',
  regulation: '⚖️',
  support: '❤️',
};

// Icons for annotation types
export const ANNOTATION_ICONS: Record<AnnotationType, string> = {
  'pain-point': '⚠️',
  'opportunity': '💡',
  'uncertainty': '❓',
};

// Labels for display
export const ACTOR_LABELS: Record<ActorCategory, string> = {
  customer: 'Customers / Users',
  provider: 'Providers / Companies',
  regulator: 'Regulators / Policymakers',
  funder: 'Funders / Investors',
  partner: 'Partners / Distributors',
  influencer: 'Influencers / Experts',
};

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  money: 'Money flow',
  information: 'Information flow',
  regulation: 'Regulation',
  support: 'Support / trust',
};

export const ANNOTATION_LABELS: Record<AnnotationType, string> = {
  'pain-point': 'Pain point',
  'opportunity': 'Opportunity',
  'uncertainty': 'Uncertainty / Hypothesis',
};

export const LAYER_LABELS: Record<LayerType, string> = {
  value: 'Value Flow Layer',
  information: 'Information Layer',
  regulation: 'Regulation Layer',
};

export const LAYER_DESCRIPTIONS: Record<LayerType, string> = {
  value: 'Money, resources, and incentives',
  information: 'Who talks to whom, how decisions are made',
  regulation: 'What rules shape the sector',
};

// Risk level colors and labels
export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export const RISK_COLORS: Record<RiskLevel, { border: string; bg: string; text: string; glow: string }> = {
  none: { border: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-600', glow: '' },
  low: { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', glow: 'shadow-green-200' },
  medium: { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', glow: 'shadow-yellow-200' },
  high: { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700', glow: 'shadow-red-200' },
};

export function getRiskLevel(riskScore: number | undefined): RiskLevel {
  if (!riskScore || riskScore === 0) return 'none';
  if (riskScore <= 2) return 'low';
  if (riskScore <= 3.5) return 'medium';
  return 'high';
}

/**
 * Calculate risk score (1-5) based on linked assumptions
 * @param assumptions - Array of assumptions from Discovery module
 * @returns Risk score from 1 (lowest) to 5 (highest)
 */
export function calculateRiskScore(assumptions: Array<{
  status: 'untested' | 'testing' | 'validated' | 'invalidated';
  confidence: number; // 1-5
}>): number {
  if (assumptions.length === 0) return 0;

  // Status weights (higher = more risky)
  const statusWeights = {
    validated: 1,    // Low risk - assumption proven true
    testing: 2,      // Low-medium risk - actively validating
    untested: 3.5,   // Medium-high risk - no validation yet
    invalidated: 5,  // High risk - assumption proven false
  };

  // Calculate average risk considering both status and confidence
  const totalRisk = assumptions.reduce((sum, assumption) => {
    const statusRisk = statusWeights[assumption.status];
    // Lower confidence = higher risk multiplier (inverted scale)
    const confidenceMultiplier = (6 - assumption.confidence) / 5; // 1.0 (low conf) to 0.2 (high conf)
    return sum + (statusRisk * (0.7 + confidenceMultiplier * 0.3)); // Weight status more than confidence
  }, 0);

  const avgRisk = totalRisk / assumptions.length;

  // Clamp to 1-5 range
  return Math.max(1, Math.min(5, Math.round(avgRisk * 10) / 10));
}
