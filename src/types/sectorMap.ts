export type CustomerType = 'consumer' | 'business';

export type InfluenceLevel = 'decision-maker' | 'influencer' | 'payer';

export interface FirstTarget {
  description: string;
  companySize?: string; // For B2B
  location?: string;
  whoWillUse?: string; // For B2B - end users
  whoHasBudget?: string; // For B2B - decision maker with budget
  otherInfluencers?: string; // For B2B - other influential roles
}

export interface Competitor {
  id: string;
  name: string;
  description: string;
  suppliers: string[];
  customers: string[];
  supplierCompanies?: string; // For B2B - Who supplies the companies who would be your competitors?
  industryCustomers?: string; // For B2B - What different companies/Industries use your competitors products
  technicalRegulatoryChange?: string; // For B2B - Is there a major technical or regulatory change happening or about to happen?
  created: string;
}

export interface DecisionMaker {
  id: string;
  role: string;
  influence: InfluenceLevel;
  description: string;
  created: string;
}

export interface SectorMapData {
  customerType: CustomerType;
  firstTarget: FirstTarget;
  competitors: Competitor[];
  decisionMakers: DecisionMaker[]; // For consumer type
}
