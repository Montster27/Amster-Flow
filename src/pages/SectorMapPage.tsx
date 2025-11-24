/**
 * SectorMapPage - Page wrapper for the redesigned Sector Map Dashboard
 *
 * This page provides the route-level wrapper for the new sector map UI,
 * handling project ID from the route and data persistence.
 */

import { useParams } from 'react-router-dom';
import { useSectorMapData } from '../hooks/useSectorMapData';
import { SectorMapDashboard } from '../components/sector-map';

export function SectorMapPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { loading, error } = useSectorMapData(projectId);

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sector map...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Sector Map</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <SectorMapDashboard />;
}
