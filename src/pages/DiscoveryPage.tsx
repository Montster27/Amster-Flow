import { useParams, useNavigate } from 'react-router-dom';
import { DiscoveryModule } from '../components/discovery/DiscoveryModule';
import { DiscoveryProvider } from '../contexts/DiscoveryContext';
import { useDiscoveryData } from '../hooks/useDiscoveryData';

/**
 * Discovery Page
 * Wrapper page that provides DiscoveryContext and data sync
 */
function DiscoveryPageInner() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { loading, error } = useDiscoveryData(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Discovery...</p>
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
          <p className="text-red-600 font-medium mb-2">Error loading Discovery</p>
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

  return <DiscoveryModule projectId={projectId} onBack={() => navigate(`/project/${projectId}`)} />;
}

export function DiscoveryPage() {
  return (
    <DiscoveryProvider>
      <DiscoveryPageInner />
    </DiscoveryProvider>
  );
}
