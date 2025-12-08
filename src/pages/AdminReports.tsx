import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { useAdminDiscoveryReports } from '../hooks/useAdminDiscoveryReports';
import { useAdminSectorMapReports } from '../hooks/useAdminSectorMapReports';
import { DateRangePicker } from '../components/admin-reports/DateRangePicker';
import { SegmentationFilters } from '../components/admin-reports/SegmentationFilters';
import { DiscoverySummary } from '../components/admin-reports/DiscoverySummary';
import { SectorMapSummary } from '../components/admin-reports/SectorMapSummary';
import { DataTable, ExportButton } from '../components/admin-reports/DataTable';
import type { ReportFilters, ProjectDiscoveryDetail, ProjectSectorMapDetail } from '../types/adminReports';

type ActiveTab = 'discovery' | 'sectorMap';

export function AdminReports() {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('discovery');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: { startDate: null, endDate: null },
    organizationIds: [],
    userIds: [],
  });

  // Fetch data for both tabs
  const discoveryData = useAdminDiscoveryReports(filters);
  const sectorMapData = useAdminSectorMapReports(filters);

  // Use organizations and users from whichever data is available first
  const organizations = discoveryData.organizations.length > 0
    ? discoveryData.organizations
    : sectorMapData.organizations;
  const users = discoveryData.users.length > 0
    ? discoveryData.users
    : sectorMapData.users;

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const discoveryTableColumns = [
    { key: 'projectName', label: 'Project', sortable: true },
    { key: 'organizationName', label: 'Organization', sortable: true },
    { key: 'creatorName', label: 'Creator', sortable: true },
    { key: 'assumptionCount', label: 'Assumptions', sortable: true },
    { key: 'interviewCount', label: 'Interviews', sortable: true },
    {
      key: 'validationRate',
      label: 'Validation Rate',
      sortable: true,
      format: (value: unknown) => (
        <span className={`font-medium ${
          (value as number) >= 50 ? 'text-green-600' :
          (value as number) >= 25 ? 'text-yellow-600' : 'text-gray-600'
        }`}>
          {(value as number).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'avgConfidence',
      label: 'Avg Confidence',
      sortable: true,
      format: (value: unknown) => (value as number).toFixed(1),
    },
    {
      key: 'lastActivityDate',
      label: 'Last Activity',
      sortable: true,
      format: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : '-',
    },
  ];

  const sectorMapTableColumns = [
    { key: 'projectName', label: 'Project', sortable: true },
    { key: 'organizationName', label: 'Organization', sortable: true },
    { key: 'creatorName', label: 'Creator', sortable: true },
    {
      key: 'hasTargetCustomer',
      label: 'Target Customer',
      sortable: true,
      format: (value: unknown) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? 'Defined' : 'Not Set'}
        </span>
      ),
    },
    {
      key: 'customerType',
      label: 'Customer Type',
      sortable: true,
      format: (value: unknown) =>
        value ? (
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            value === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {value === 'business' ? 'B2B' : 'B2C'}
          </span>
        ) : '-',
    },
    { key: 'competitorCount', label: 'Competitors', sortable: true },
    {
      key: 'hasVisualMap',
      label: 'Visual Map',
      sortable: true,
      format: (value: unknown) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    { key: 'actorCount', label: 'Actors', sortable: true },
    {
      key: 'lastActivityDate',
      label: 'Last Activity',
      sortable: true,
      format: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : '-',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-blue-600">Admin Reports</h1>
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-gray-600 hover:text-gray-700 hover:underline"
              >
                Back to Admin Panel
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-6 items-end">
            <DateRangePicker
              value={filters.dateRange}
              onChange={dateRange => setFilters({ ...filters, dateRange })}
            />
            <SegmentationFilters
              organizations={organizations}
              users={users}
              selectedOrganizations={filters.organizationIds}
              selectedUsers={filters.userIds}
              onOrganizationsChange={organizationIds =>
                setFilters({ ...filters, organizationIds })
              }
              onUsersChange={userIds => setFilters({ ...filters, userIds })}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`${
                activeTab === 'discovery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Customer Discovery
            </button>
            <button
              onClick={() => setActiveTab('sectorMap')}
              className={`${
                activeTab === 'sectorMap'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Sector Map
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {(discoveryData.error || sectorMapData.error) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              {activeTab === 'discovery' ? discoveryData.error : sectorMapData.error}
            </p>
          </div>
        )}

        {/* Content */}
        {activeTab === 'discovery' ? (
          <div className="space-y-6">
            <DiscoverySummary
              summary={discoveryData.summary}
              details={discoveryData.details}
              loading={discoveryData.loading}
            />

            {/* Project Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Project Breakdown</h2>
                {discoveryData.projectDetails.length > 0 && (
                  <ExportButton
                    data={discoveryData.projectDetails}
                    columns={discoveryTableColumns}
                    filename="discovery-report.csv"
                  />
                )}
              </div>
              <DataTable<ProjectDiscoveryDetail>
                columns={discoveryTableColumns}
                data={discoveryData.projectDetails}
                onRowClick={project => navigate(`/admin/project/${project.projectId}`)}
                loading={discoveryData.loading}
                emptyMessage="No discovery data available for the selected filters"
                keyField="projectId"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <SectorMapSummary
              summary={sectorMapData.summary}
              details={sectorMapData.details}
              loading={sectorMapData.loading}
            />

            {/* Project Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Project Breakdown</h2>
                {sectorMapData.projectDetails.length > 0 && (
                  <ExportButton
                    data={sectorMapData.projectDetails}
                    columns={sectorMapTableColumns}
                    filename="sector-map-report.csv"
                  />
                )}
              </div>
              <DataTable<ProjectSectorMapDetail>
                columns={sectorMapTableColumns}
                data={sectorMapData.projectDetails}
                onRowClick={project => navigate(`/admin/project/${project.projectId}`)}
                loading={sectorMapData.loading}
                emptyMessage="No sector map data available for the selected filters"
                keyField="projectId"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
