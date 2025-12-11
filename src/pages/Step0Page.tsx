import { useNavigate, useParams } from 'react-router-dom';
import { Step0Provider } from '../features/discovery/step0Store';
import { Step0FirstLook } from '../features/discovery/Step0FirstLook';
import { useStep0Data } from '../hooks/useStep0Data';

function Step0Content({ projectId }: { projectId: string | undefined }) {
  const { loading, error } = useStep0Data(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return <Step0FirstLook />;
}

export function Step0Page() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 0</p>
            <h1 className="text-2xl font-bold text-gray-900">The First Look</h1>
            <p className="text-sm text-gray-600">Pick one customer, one problem, and tighten your first assumptions.</p>
          </div>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <Step0Provider>
        <Step0Content projectId={projectId} />
      </Step0Provider>
    </div>
  );
}
