// Industry variants — per-industry overrides on top of the canonical 16
// layer ontology. Each variant can rename layers and reword the core
// question. Adding/dropping layers is supported by the data model
// (layer_state rows are nullable per layer) but no current variant uses
// either; keep the layer set stable across variants for v1.

import { PK_LAYERS, type Industry, type PkLayer } from './layers';

export interface VentureSeed {
  name: string;
  industry: string;
  tagline: string;
  /** Optional per-layer claim seed for demo data. */
  seeds: Partial<Record<string, string>>;
}

interface LayerOverride {
  name?: string;
  q?: string;
}

interface IndustryVariant {
  /** Display name used in the switcher and headers. */
  label: string;
  /** Per-layer overrides (rename + question reword). */
  layerOverrides: Partial<Record<string, LayerOverride>>;
  /** Demo seed venture for this industry. */
  seed: VentureSeed;
}

const SOFTWARE: IndustryVariant = {
  label: 'Software',
  layerOverrides: {},
  seed: {
    name: 'PetFinder',
    industry: 'Software',
    tagline: 'Reunite lost dogs with their owners in the first golden 24 hours.',
    seeds: {
      worldImpact: 'Fewer pets lost permanently; less owner trauma in dense cities.',
      exit: 'Acquired by a pet-insurance carrier in year 5 as a retention channel.',
      sectorMapping: 'Pet insurers, microchip registries, vet networks, neighborhood apps, animal control.',
      competitiveMarket: 'Petco Love Lost; PawBoost; local Facebook groups; flyering.',
      marketExpansion: 'Cats; small mammals; international rollout; insurance bundling.',
      company: 'Lean software team, 20-30 ppl by year 3, neighborhood-led GTM.',
      businessModel: '$9/mo subscription + premium SMS broadcast credits.',
      customerSegment: 'Urban dog-owners 28–45 within 24h of loss.',
      solution: 'Geo-fenced alert network across nearby owners + walkers + vets.',
      problem: "After 24 hours a lost dog's recovery odds drop by 60%.",
      painScale: 'Major — 12% of dog-owners lose a pet each year; emotional + financial.',
      product: 'Mobile app with one-tap LOST broadcast; walker network alert.',
      requirements: '<10s alert time; works offline; verified owner ID.',
      design: 'Single big LOST button; map of nearby helpers; AirTag-style cards.',
      integrations: 'Twilio, Mapbox, Apple/Google location, microchip APIs.',
      production: 'iOS/Android RN app; serverless backend; Postgres + PostGIS.',
    },
  },
};

const BIOTECH: IndustryVariant = {
  label: 'Biotech',
  layerOverrides: {
    customerSegment: { name: 'Clinical Segment', q: 'Which clinicians at which sites have the buying authority and volume to matter?' },
    competitiveMarket: { name: 'Standard of Care', q: 'What\'s the current standard of care, and how does your assay compare on the deciding metric?' },
    businessModel: { name: 'Reimbursement Model', q: 'Per-test reagent? Lease the reader? CPT code path? Capitated?' },
    painScale: { name: 'Clinical Pain', q: 'Annoyance / Inconvenience / Quality-metric / Mortality / Regulatory mandate.' },
    solution: { name: 'Clinical Solution', q: 'How does the diagnostic alter management at the bedside, today?' },
    product: { name: 'Device & Reagent', q: 'Cartridge + reader + IVD label. What FDA path?' },
    integrations: { name: 'Lab & EHR Integrations', q: 'CLIA workflow, FHIR/HL7 hooks, laboratory information systems.' },
    production: { name: 'Manufacturing', q: 'Reagent batch, ISO 13485, cold chain, supplier qualification.' },
  },
  seed: {
    name: 'Refrane',
    industry: 'Biotech',
    tagline: 'Rapid sepsis triage at the bedside, before the lab gets a result.',
    seeds: {
      worldImpact: 'Lower sepsis mortality; reduced over-prescription of antibiotics.',
      exit: 'Strategic acquisition by a diagnostics major (BD, Roche).',
      sectorMapping: 'Hospital labs, ICU clinicians, infection-control teams, payer policy.',
      competitiveMarket: 'Procalcitonin; Cytovale IntelliSep; Inflammatix HostDx.',
      marketExpansion: 'Outpatient triage; antimicrobial stewardship adjuncts.',
      company: 'Regulated medtech; ~80 ppl by clearance; clinical & regulatory heavy.',
      businessModel: 'Per-test reagent + lease-style instrument placement.',
      customerSegment: 'ED clinicians at urban level-1 trauma centers (US).',
      solution: '<15-min point-of-care host-response panel from a finger-prick.',
      problem: 'Sepsis dx is delayed by 4–6h vs. lab; mortality climbs 8%/h.',
      painScale: 'Requirement — sepsis bundles are CMS-tracked quality metrics.',
      product: 'Cartridge-based reader, single-use 4-marker panel.',
      requirements: 'CLIA-waived path; <15min TAT; integrate with EHR.',
      design: 'Reader the size of a glucometer; bedside cart compatible.',
      integrations: 'Epic ADT/orders, FHIR, CLIA workflow.',
      production: 'Microfluidic chip mfg; ISO 13485 line; reagent cold chain.',
    },
  },
};

const HARDWARE: IndustryVariant = {
  label: 'Hardware',
  layerOverrides: {
    customerSegment: { name: 'Buyer & Operator', q: 'Who buys the unit and who operates it day-to-day? They\'re often different humans with different objections.' },
    competitiveMarket: { name: 'Competing Stacks', q: 'Manual jigs, legacy PLCs, in-house tooling — what do they run today?' },
    businessModel: { name: 'Capex / Subscription Mix', q: 'Capex + service contract? Subscription? Usage-based? Lease?' },
    solution: { name: 'Mechanism', q: 'The physics, the actuator, the closed-loop logic. Why does this work?' },
    product: { name: 'Bill of Materials', q: 'What is in the unit. Cost roll-up. Serviceable parts.' },
    requirements: { name: 'Operating Spec', q: 'Throughput, MTBF, environment, certifications.' },
    integrations: { name: 'Plant Integrations', q: 'PLC, MES, SCADA hooks, safety interlocks.' },
    production: { name: 'Manufacturing & Supply', q: 'CM partner, tooling lead time, supplier qualification, RMA path.' },
  },
  seed: {
    name: 'CalibraJig',
    industry: 'Hardware',
    tagline: 'Automated weld-line calibration that keeps mid-volume manufacturing lines running.',
    seeds: {
      worldImpact: 'Less rework, fewer line stops, less scrap in mid-volume manufacturing.',
      exit: 'Acquired by a Tier-1 industrial automation player (Rockwell, Siemens).',
      sectorMapping: 'Tier-1/Tier-2 OEMs, MES integrators, system integrators, OSHA auditors.',
      competitiveMarket: 'Manual jig + clipboard; Excel SPC; legacy PLC + custom code.',
      marketExpansion: 'Vision-based QA add-on; high-mix lines; subscription analytics.',
      company: 'Hard-tech; ~40 ppl by year 3; 2-3 lighthouse plants.',
      businessModel: '$45k unit + $9k/yr service; pay-per-correction tier in v2.',
      customerSegment: 'Plant managers at mid-volume metal-fab OEMs (Tier-2, US Midwest).',
      solution: 'Closed-loop laser sensor + servo correction at the weld station.',
      problem: 'Weld-line drift causes 4-7% scrap and weekly line stops.',
      painScale: 'Major — line stops cost $12-18k/hr.',
      product: 'Bolt-on sensor + controller; pre-calibrated for two weld geometries.',
      requirements: 'NEMA 4 enclosure; <50ms loop; MTBF > 8000 hrs.',
      design: 'Industrial gray box; magnetic mount; LED status; web-based config.',
      integrations: 'PLC (EtherNet/IP, PROFINET), MES (OPC UA), email alerting.',
      production: 'CM in Mexico for housings; sensor IP licensed in.',
    },
  },
};

const FINTECH: IndustryVariant = {
  label: 'Fintech',
  layerOverrides: {
    customerSegment: { name: 'Counterparty', q: 'Who\'s on the other side of the transaction, and who has the budget to pay you for the rails?' },
    competitiveMarket: { name: 'Incumbent Workflow', q: 'In-house treasury, bookkeeper + spreadsheets, established providers — who do they pay today?' },
    businessModel: { name: 'Take Rate / Float', q: 'Per-transaction fee, monthly platform fee, float on balances, interchange share?' },
    solution: { name: 'Payment / Risk Mechanism', q: 'How does the money move, and who absorbs which risks at each step?' },
    product: { name: 'Product & API', q: 'Dashboard, embeddable SDK, ledger surface, reporting.' },
    requirements: { name: 'Compliance Spec', q: 'KYC/AML, state licensing, SOC 2, PCI scope, banking partners.' },
    integrations: { name: 'Network Integrations', q: 'Card networks, ACH, RTP, banking-as-a-service partners.' },
    production: { name: 'Ledger & Settlement', q: 'Double-entry ledger, settlement timing, reconciliation, dispute path.' },
  },
  seed: {
    name: 'Reconcile',
    industry: 'Fintech',
    tagline: 'Auto-reconciliation for SMB treasury teams that hate spreadsheets.',
    seeds: {
      worldImpact: 'Fewer SMB owners losing weekends to month-end close.',
      exit: 'Strategic acquisition by an accounting platform (QuickBooks, Xero) or a bank-as-a-service vendor.',
      sectorMapping: 'Banks, card networks, accounting platforms, KYC vendors, state regulators.',
      competitiveMarket: 'Bookkeeper + spreadsheets; in-house treasury; legacy ERP modules.',
      marketExpansion: 'Mid-market; international; cash-forecasting layer.',
      company: 'Regulated fintech; ~60 ppl by Series B; banking + ops heavy.',
      businessModel: '$199/mo platform fee + 5bps on reconciled volume.',
      customerSegment: 'CFOs at SMBs with 2-10 bank accounts and >$5M revenue.',
      solution: 'Connector to bank feeds + ML-based matching to AP/AR.',
      problem: 'Month-end takes 4-6 days because bank, ERP, and AR are out of sync.',
      painScale: 'Major — late close = late investor reporting = lost financing options.',
      product: 'Web dashboard + connectors to Plaid + QuickBooks/Xero.',
      requirements: 'SOC 2, PCI-DSS scope minimal, MFA, audit log.',
      design: 'Spreadsheet-like reconciliation grid; row-level diffs; CSV export.',
      integrations: 'Plaid, Stripe, QuickBooks, Xero, common SMB banks.',
      production: 'Postgres ledger; Sidekiq; async match worker; daily settlement reports.',
    },
  },
};

const VARIANTS: Readonly<Record<Industry, IndustryVariant>> = Object.freeze({
  software: SOFTWARE,
  biotech:  BIOTECH,
  hardware: HARDWARE,
  fintech:  FINTECH,
});

/** Layers as they appear for a given industry, with overrides applied. */
export function layersFor(industry: Industry): PkLayer[] {
  const overrides = VARIANTS[industry]?.layerOverrides ?? {};
  return PK_LAYERS.map((L) => {
    const o = overrides[L.id];
    if (!o) return L;
    return { ...L, name: o.name ?? L.name, q: o.q ?? L.q };
  });
}

/** Single layer with overrides applied. */
export function layerFor(industry: Industry, layerId: string): PkLayer | undefined {
  const base = PK_LAYERS.find((L) => L.id === layerId);
  if (!base) return undefined;
  const o = VARIANTS[industry]?.layerOverrides?.[layerId];
  if (!o) return base;
  return { ...base, name: o.name ?? base.name, q: o.q ?? base.q };
}

/** Demo venture seed for the industry — used for placeholders / fixtures. */
export function ventureSeed(industry: Industry): VentureSeed {
  return VARIANTS[industry].seed;
}

export function industryLabel(industry: Industry): string {
  return VARIANTS[industry].label;
}

export const INDUSTRIES: readonly Industry[] = ['software', 'biotech', 'hardware', 'fintech'];

/** Diff between two industry variants — used by the switcher to warn the
 *  founder before applying. Returns the layers whose name or question
 *  would change. */
export function diffIndustries(from: Industry, to: Industry): Array<{
  layerId: string;
  fromName: string;
  toName: string;
  changed: boolean;
}> {
  return PK_LAYERS.map((L) => {
    const fromL = layerFor(from, L.id)!;
    const toL = layerFor(to, L.id)!;
    return {
      layerId: L.id,
      fromName: fromL.name,
      toName: toL.name,
      changed: fromL.name !== toL.name || fromL.q !== toL.q,
    };
  });
}
