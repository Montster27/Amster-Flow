import { ReportLayout } from '../../../components/reports/ReportLayout';
import type { LeanCanvasCells } from './leanCanvasMapping';

interface LeanCanvasPageProps {
  cells: LeanCanvasCells;
}

const cellBaseStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  background: '#ffffff',
  pageBreakInside: 'avoid',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#475569',
  margin: '0 0 6px',
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: 4,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#0f172a',
  lineHeight: 1.45,
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  flex: 1,
  overflowWrap: 'break-word',
};

function Cell({
  title,
  body,
  style,
}: {
  title: string;
  body: string | undefined;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...cellBaseStyle, ...style }}>
      <p style={headerStyle}>{title}</p>
      {body ? <p style={bodyStyle}>{body}</p> : <div style={{ flex: 1 }} />}
    </div>
  );
}

export function LeanCanvasPage({ cells }: LeanCanvasPageProps) {
  return (
    <ReportLayout
      title="Lean Business Model Canvas"
      subtitle="Pre-filled from Step 0 and Quick Check data"
      footerNote="Lean Canvas · PivotKit"
    >
      {/* Top: 5 columns × 2 rows. Problem, UVP, Customer Segments span both rows. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: '230px 230px',
          gap: 4,
          marginBottom: 4,
        }}
      >
        <Cell title="Problem" body={cells.problem} style={{ gridRow: 'span 2' }} />
        <Cell title="Solution" body={cells.solution} />
        <Cell
          title="Unique Value Proposition"
          body={cells.uniqueValueProposition}
          style={{ gridRow: 'span 2' }}
        />
        <Cell title="Unfair Advantage" body={cells.unfairAdvantage} />
        <Cell title="Customer Segments" body={cells.customerSegments} style={{ gridRow: 'span 2' }} />
        <Cell title="Key Metrics" body={cells.keyMetrics} />
        <Cell title="Channels" body={cells.channels} />
      </div>

      {/* Bottom: 2 equal columns. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: '180px',
          gap: 4,
        }}
      >
        <Cell title="Cost Structure" body={cells.costStructure} />
        <Cell title="Revenue Streams" body={cells.revenueStreams} />
      </div>
    </ReportLayout>
  );
}
