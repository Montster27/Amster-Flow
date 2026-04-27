import { ReportLayout } from '../../../components/reports/ReportLayout';
import { ReportSection } from '../../../components/reports/ReportSection';
import type {
  BeachheadQualifiers,
  FounderMarketFit,
  IdeaStatement,
  SchlepAssessment,
  Segment,
  WhyNow,
} from '../../discovery/step0Store';
import type { QuickCheckSegment } from '../quickCheckStore';

interface Step0SummaryPageProps {
  idea: IdeaStatement;
  segments: Segment[];
  focusedSegmentId: number | null;
  founderMarketFit: FounderMarketFit;
  whyNow: WhyNow;
  schlepAssessment: SchlepAssessment;
  beachheadQualifiers: BeachheadQualifiers;
  quickCheckSegments: QuickCheckSegment[];
}

function ideaSentence(idea: IdeaStatement): string | null {
  const building = idea.building?.trim();
  const helps = idea.helps?.trim();
  const achieve = idea.achieve?.trim();
  if (!building && !helps && !achieve) return null;
  const parts: string[] = [];
  if (building) parts.push(building);
  if (helps) parts.push(`that helps ${helps}`);
  if (achieve) parts.push(achieve);
  return parts.join(' ');
}

function fmfHasContent(fmf: FounderMarketFit): boolean {
  return !!(
    fmf.directExperience ||
    fmf.domainCredibility?.trim() ||
    fmf.accessAdvantage ||
    fmf.whyNowForYou?.trim()
  );
}

function whyNowHasContent(whyNow: WhyNow): boolean {
  return !!(whyNow.catalystType || whyNow.elaboration?.trim());
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 700,
  color: '#6b7280',
  margin: '0 0 2px',
};

const valueStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#111827',
  margin: '0 0 8px',
  lineHeight: 1.5,
};

const catalystLabel: Record<string, string> = {
  technology: 'Technology shift',
  regulatory: 'Regulatory shift',
  behavioral: 'Behavioral shift',
  economic: 'Economic shift',
};

const directExperienceLabel: Record<string, string> = {
  yes: 'Yes — direct experience',
  adjacent: 'Adjacent experience',
  no: 'No direct experience',
};

const yesNoUnsureLabel: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  unsure: 'Unsure',
};

export function Step0SummaryPage({
  idea,
  segments,
  focusedSegmentId,
  founderMarketFit,
  whyNow,
  schlepAssessment,
  beachheadQualifiers,
  quickCheckSegments,
}: Step0SummaryPageProps) {
  const focusedSegment = segments.find((s) => s.id === focusedSegmentId) ?? null;
  const beachheadQc = quickCheckSegments.find((s) => s.isBeachhead);
  const ideaText = ideaSentence(idea);

  const contacts = (beachheadQc?.contacts ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  return (
    <ReportLayout
      title="Step 0: First Look — Summary"
      subtitle={ideaText ?? undefined}
      footerNote="Step 0 summary · PivotKit"
    >
      {ideaText && (
        <ReportSection title="Your Idea">
          <p style={{ ...valueStyle, fontStyle: 'italic' }}>{ideaText}</p>
        </ReportSection>
      )}

      <section
        style={{
          marginBottom: 16,
          pageBreakInside: 'avoid',
          border: '2px solid #2563eb',
          borderRadius: 8,
          padding: 12,
          background: '#eff6ff',
        }}
      >
        <p
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700,
            color: '#1d4ed8',
            margin: '0 0 4px',
          }}
        >
          First Area of Focus
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
          {focusedSegment?.name ?? 'No segment selected yet'}
        </h2>

        {focusedSegment?.need && (
          <>
            <p style={labelStyle}>Top need</p>
            <p style={valueStyle}>{focusedSegment.need}</p>
          </>
        )}

        {(beachheadQualifiers.howSmall ||
          beachheadQualifiers.activelySolving ||
          beachheadQualifiers.canReachDirectly) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 8,
            }}
          >
            {beachheadQualifiers.howSmall && (
              <div>
                <p style={labelStyle}>How small</p>
                <p style={valueStyle}>{beachheadQualifiers.howSmall}</p>
              </div>
            )}
            {beachheadQualifiers.activelySolving && (
              <div>
                <p style={labelStyle}>Actively solving</p>
                <p style={valueStyle}>
                  {yesNoUnsureLabel[beachheadQualifiers.activelySolving] ?? beachheadQualifiers.activelySolving}
                </p>
              </div>
            )}
            {beachheadQualifiers.canReachDirectly && (
              <div>
                <p style={labelStyle}>Can reach directly</p>
                <p style={valueStyle}>
                  {yesNoUnsureLabel[beachheadQualifiers.canReachDirectly] ?? beachheadQualifiers.canReachDirectly}
                </p>
              </div>
            )}
          </div>
        )}

        {beachheadQc?.problem && (
          <>
            <p style={labelStyle}>Problem (in their words)</p>
            <p style={valueStyle}>{beachheadQc.problem}</p>
          </>
        )}

        {beachheadQc?.solution && (
          <>
            <p style={labelStyle}>Simplest test</p>
            <p style={valueStyle}>{beachheadQc.solution}</p>
          </>
        )}

        {beachheadQc?.hypothesis && (
          <>
            <p style={labelStyle}>Testable hypothesis</p>
            <p style={{ ...valueStyle, fontStyle: 'italic', color: '#065f46' }}>
              {beachheadQc.hypothesis}
            </p>
          </>
        )}

        {contacts.length > 0 && (
          <>
            <p style={labelStyle}>People to interview</p>
            <ul style={{ margin: '0 0 4px', paddingLeft: 18 }}>
              {contacts.map((c, i) => (
                <li key={i} style={{ fontSize: 12, color: '#111827', lineHeight: 1.5 }}>
                  {c}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {segments.length > 0 && (
        <ReportSection title="All Segments Considered">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {segments.map((seg) => {
              const isFocused = seg.id === focusedSegmentId;
              return (
                <li
                  key={seg.id}
                  style={{
                    fontSize: 12,
                    color: isFocused ? '#1d4ed8' : '#374151',
                    lineHeight: 1.6,
                    fontWeight: isFocused ? 600 : 400,
                  }}
                >
                  {seg.name}
                  {isFocused && ' ★ first area of focus'}
                  {seg.need && (
                    <span style={{ color: '#6b7280', fontWeight: 400 }}> — {seg.need}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </ReportSection>
      )}

      {fmfHasContent(founderMarketFit) && (
        <ReportSection title="Founder–Market Fit">
          {founderMarketFit.directExperience && (
            <>
              <p style={labelStyle}>Direct experience</p>
              <p style={valueStyle}>
                {directExperienceLabel[founderMarketFit.directExperience] ??
                  founderMarketFit.directExperience}
              </p>
            </>
          )}
          {founderMarketFit.domainCredibility?.trim() && (
            <>
              <p style={labelStyle}>Domain credibility</p>
              <p style={valueStyle}>{founderMarketFit.domainCredibility}</p>
            </>
          )}
          {founderMarketFit.accessAdvantage && (
            <>
              <p style={labelStyle}>Access advantage</p>
              <p style={valueStyle}>
                {founderMarketFit.accessAdvantage === 'yes' ? 'Yes' : 'No'}
              </p>
            </>
          )}
          {founderMarketFit.whyNowForYou?.trim() && (
            <>
              <p style={labelStyle}>Why now for you</p>
              <p style={valueStyle}>{founderMarketFit.whyNowForYou}</p>
            </>
          )}
        </ReportSection>
      )}

      {whyNowHasContent(whyNow) && (
        <ReportSection title="Why Now">
          {whyNow.catalystType && (
            <>
              <p style={labelStyle}>Catalyst</p>
              <p style={valueStyle}>{catalystLabel[whyNow.catalystType] ?? whyNow.catalystType}</p>
            </>
          )}
          {whyNow.elaboration?.trim() && (
            <>
              <p style={labelStyle}>What changed</p>
              <p style={valueStyle}>{whyNow.elaboration}</p>
            </>
          )}
        </ReportSection>
      )}

      {(schlepAssessment.attractiveness > 0 || schlepAssessment.messierAlternative?.trim()) && (
        <ReportSection title="Schlep Assessment">
          <p style={labelStyle}>Attractiveness</p>
          <p style={valueStyle}>{schlepAssessment.attractiveness} / 5</p>
          {schlepAssessment.messierAlternative?.trim() && (
            <>
              <p style={labelStyle}>Messier alternative considered</p>
              <p style={valueStyle}>{schlepAssessment.messierAlternative}</p>
            </>
          )}
        </ReportSection>
      )}
    </ReportLayout>
  );
}
