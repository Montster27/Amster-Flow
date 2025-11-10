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
}

export interface Connection {
  id: string;
  sourceActorId: string;
  targetActorId: string;
  type: ConnectionType;
  description: string;
  layer?: LayerType; // Which layer this connection belongs to
  created: string;
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
