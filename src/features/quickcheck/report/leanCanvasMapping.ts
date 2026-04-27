import type {
  BeachheadQualifiers,
  FounderMarketFit,
  IdeaStatement,
  Segment,
  WhyNow,
} from '../../discovery/step0Store';
import type { QuickCheckSegment } from '../quickCheckStore';

export type LeanCanvasCells = {
  problem?: string;
  customerSegments?: string;
  uniqueValueProposition?: string;
  solution?: string;
  channels?: string;
  revenueStreams?: string;
  costStructure?: string;
  keyMetrics?: string;
  unfairAdvantage?: string;
};

export type LeanCanvasInput = {
  idea: IdeaStatement;
  segments: Segment[];
  focusedSegmentId: number | null;
  founderMarketFit: FounderMarketFit;
  whyNow: WhyNow;
  beachheadQualifiers: BeachheadQualifiers;
  quickCheckSegments: QuickCheckSegment[];
};

function nonEmpty(s: string | undefined | null): string | undefined {
  if (!s) return undefined;
  const trimmed = s.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function joinNonEmpty(parts: (string | undefined | null)[], sep = ' '): string | undefined {
  const filtered = parts.map((p) => p?.trim()).filter((p): p is string => !!p && p.length > 0);
  return filtered.length > 0 ? filtered.join(sep) : undefined;
}

function buildIdeaSentence(idea: IdeaStatement): string | undefined {
  const building = nonEmpty(idea.building);
  const helps = nonEmpty(idea.helps);
  const achieve = nonEmpty(idea.achieve);
  if (!building && !helps && !achieve) return undefined;
  const parts: string[] = [];
  if (building) parts.push(building);
  if (helps) parts.push(`that helps ${helps}`);
  if (achieve) parts.push(achieve);
  return parts.join(' ');
}

function describeFounderMarketFit(fmf: FounderMarketFit): string | undefined {
  const pieces: string[] = [];
  if (nonEmpty(fmf.directExperience) && fmf.directExperience !== 'no') {
    const label =
      fmf.directExperience === 'yes'
        ? 'Direct experience with this problem.'
        : fmf.directExperience === 'adjacent'
          ? 'Adjacent experience with this problem.'
          : '';
    if (label) pieces.push(label);
  }
  const credibility = nonEmpty(fmf.domainCredibility);
  if (credibility) pieces.push(credibility);
  if (fmf.accessAdvantage === 'yes') {
    pieces.push('Has unique access to this customer.');
  }
  const why = nonEmpty(fmf.whyNowForYou);
  if (why) pieces.push(why);
  return pieces.length > 0 ? pieces.join(' ') : undefined;
}

function describeWhyNow(whyNow: WhyNow): string | undefined {
  const catalyst = nonEmpty(whyNow.catalystType);
  const elaboration = nonEmpty(whyNow.elaboration);
  if (!catalyst && !elaboration) return undefined;
  const parts: string[] = [];
  if (catalyst) {
    const label = catalyst.charAt(0).toUpperCase() + catalyst.slice(1);
    parts.push(`${label} shift:`);
  }
  if (elaboration) parts.push(elaboration);
  return parts.join(' ');
}

export function mapToLeanCanvas(input: LeanCanvasInput): LeanCanvasCells {
  const {
    idea,
    segments,
    focusedSegmentId,
    founderMarketFit,
    whyNow,
    beachheadQualifiers,
    quickCheckSegments,
  } = input;

  const focusedSegment = segments.find((s) => s.id === focusedSegmentId);
  const beachhead = quickCheckSegments.find((s) => s.isBeachhead);

  const problem =
    nonEmpty(beachhead?.problem) ?? nonEmpty(focusedSegment?.need);

  const customerSegments = joinNonEmpty(
    [
      nonEmpty(focusedSegment?.name),
      nonEmpty(beachheadQualifiers.howSmall),
    ],
    ' — '
  );

  const uniqueValueProposition = buildIdeaSentence(idea);

  const solution = nonEmpty(beachhead?.solution) ?? nonEmpty(idea.building);

  const contactsList = (beachhead?.contacts ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const channels = contactsList.length > 0 ? contactsList.join(', ') : undefined;

  const fmfText = describeFounderMarketFit(founderMarketFit);
  const whyNowText = describeWhyNow(whyNow);
  const unfairAdvantage = joinNonEmpty([fmfText, whyNowText], ' ');

  return {
    problem,
    customerSegments,
    uniqueValueProposition,
    solution,
    channels,
    revenueStreams: undefined,
    costStructure: undefined,
    keyMetrics: undefined,
    unfairAdvantage,
  };
}
