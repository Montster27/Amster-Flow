import { useParams, useNavigate } from 'react-router-dom';
import { Discovery2Module } from '../components/discovery2/Discovery2Module';
import { Discovery2Provider } from '../contexts/Discovery2Context';
import { useDiscovery2Data } from '../hooks/useDiscovery2Data';

/**
 * Discovery 2.0 Page
 * Wrapper page that provides Discovery2Context and data sync
 */
function Discovery2PageInner() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { loading, error } = useDiscovery2Data(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Discovery 2.0...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium mb-2">Error loading Discovery 2.0</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Back to Project Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Project
        </button>
      </div>

      <Discovery2Module />
    </div>
  );
}

export function Discovery2Page() {
  return (
    <Discovery2Provider>
      <Discovery2PageInner />
    </Discovery2Provider>
  );
}
