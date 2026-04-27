import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Step0Provider } from '../features/discovery/step0Store';
import { QuickCheckProvider } from '../features/quickcheck/quickCheckStore';
import {
  QUICK_CHECK_REPORT_PRINT_ID,
  QuickCheckReport,
} from '../features/quickcheck/report/QuickCheckReport';
import { exportPdfFromElement } from '../utils/pdfExport';

export function QuickCheckReportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await exportPdfFromElement(
        QUICK_CHECK_REPORT_PRINT_ID,
        `quick-check-report-${projectId ?? 'project'}.pdf`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF';
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quick Check
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Report</h1>
            <p className="text-sm text-gray-600">
              Step 0 summary and your starting Lean Business Model Canvas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/project/${projectId}/quick-check`)}
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Quick Check
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? 'Generating PDF…' : 'Download PDF'}
            </button>
          </div>
        </div>
        {downloadError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <p className="text-sm text-red-700">Couldn't download PDF: {downloadError}</p>
          </div>
        )}
      </div>

      <Step0Provider>
        <QuickCheckProvider>
          <QuickCheckReport projectId={projectId} />
        </QuickCheckProvider>
      </Step0Provider>
    </div>
  );
}
