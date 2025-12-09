import { useNavigate, useParams } from 'react-router-dom';
import { Step0Provider } from '../features/discovery/step0Store';
import { Step0FirstLook } from '../features/discovery/Step0FirstLook';

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
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/project/${projectId}/discovery`)}
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Discovery
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Project Home
            </button>
          </div>
        </div>
      </div>

      <Step0Provider>
        <Step0FirstLook />
      </Step0Provider>
    </div>
  );
}
