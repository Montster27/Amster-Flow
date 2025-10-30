export type CustomerType = 'consumer' | 'business';

export interface FirstTarget {
  description: string;
  companySize?: string; // For B2B
  location?: string;
}

export interface Competitor {
  id: string;
  name: string;
  description: string;
  suppliers: string[];
  customers: string[];
  created: string;
}

export interface DecisionMaker {
  id: string;
  role: string;
  influence: 'decision-maker' | 'influencer' | 'payer';
  description: string;
  created: string;
}

export interface SectorMapData {
  customerType: CustomerType;
  firstTarget: FirstTarget;
  competitors: Competitor[];
  decisionMakers: DecisionMaker[]; // For consumer type
}
