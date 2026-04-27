import { useStep0Store } from '../../discovery/step0Store';
import { useQuickCheckStore } from '../quickCheckStore';
import { useStep0Data } from '../../../hooks/useStep0Data';
import { useQuickCheckData } from '../../../hooks/useQuickCheckData';
import { Step0SummaryPage } from './Step0SummaryPage';
import { LeanCanvasPage } from './LeanCanvasPage';
import { mapToLeanCanvas } from './leanCanvasMapping';

interface QuickCheckReportProps {
  projectId: string | undefined;
}

export const QUICK_CHECK_REPORT_PRINT_ID = 'quick-check-report-print';

export function QuickCheckReport({ projectId }: QuickCheckReportProps) {
  const { loading: step0Loading, error: step0Error } = useStep0Data(projectId);
  const { loading: qcLoading, error: qcError } = useQuickCheckData(projectId);

  const {
    idea,
    segments,
    focusedSegmentId,
    founderMarketFit,
    whyNow,
    schlepAssessment,
    beachheadQualifiers,
  } = useStep0Store();
  const { segments: quickCheckSegments } = useQuickCheckStore();

  const loading = step0Loading || qcLoading;
  const error = step0Error || qcError;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      </div>
    );
  }

  const cells = mapToLeanCanvas({
    idea,
    segments,
    focusedSegmentId,
    founderMarketFit,
    whyNow,
    beachheadQualifiers,
    quickCheckSegments,
  });

  return (
    <div
      id={QUICK_CHECK_REPORT_PRINT_ID}
      style={{
        background: '#f1f5f9',
        padding: '24px 0',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Step0SummaryPage
          idea={idea}
          segments={segments}
          focusedSegmentId={focusedSegmentId}
          founderMarketFit={founderMarketFit}
          whyNow={whyNow}
          schlepAssessment={schlepAssessment}
          beachheadQualifiers={beachheadQualifiers}
          quickCheckSegments={quickCheckSegments}
        />
      </div>
      <div>
        <LeanCanvasPage cells={cells} />
      </div>
    </div>
  );
}
