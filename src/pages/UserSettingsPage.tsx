import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { downloadUserData, deleteUserAccount, canDeleteAccount } from '../lib/dataPrivacy';
import { captureException } from '../lib/sentry';

export function UserSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [blockingOrgs, setBlockingOrgs] = useState<Array<{ id: string; name: string }>>([]);

  const handleExportData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await downloadUserData();
      const filename = `amsterflow-data-export-${new Date().toISOString().split('T')[0]}.json`;
      setSuccess(`✅ Success! Your data has been downloaded as "${filename}". Check your Downloads folder.`);

      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 10000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export data');
      captureException(error, {
        extra: { context: 'UserSettingsPage export' },
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDeletionEligibility = async () => {
    const result = await canDeleteAccount();
    setCanDelete(result.canDelete);
    setBlockingOrgs(result.blockingOrganizations || []);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const result = await deleteUserAccount(confirmEmail);

      if (result.success) {
        // User will be redirected to login by auth state change
        navigate('/login');
      } else {
        setDeleteError(result.error || 'Failed to delete account');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete account');
      setDeleteError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and privacy settings</p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">User ID:</span>
                <p className="text-gray-500 text-sm font-mono">{user?.id}</p>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Export Your Data
            </h2>
            <p className="text-gray-600 mb-4">
              Download all your data in JSON format. This includes your profile, projects,
              assumptions, interviews, and activity history.
            </p>

            {success && (
              <div className="mb-4 p-4 bg-green-100 border-2 border-green-400 rounded-lg shadow-sm animate-pulse">
                <p className="text-sm font-medium text-green-900">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportData}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing Download...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download My Data
                  </span>
                )}
              </button>
              {success && (
                <span className="text-green-600 font-medium text-sm">
                  ✓ Downloaded
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              GDPR Right to Data Portability - You have the right to receive your personal data
              in a structured, commonly used format.
            </p>
          </div>

          {/* Account Deletion */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-100">
            <h2 className="text-xl font-semibold text-red-900 mb-4">
              Delete Account
            </h2>
            <p className="text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={async () => {
                  await checkDeletionEligibility();
                  setShowDeleteConfirm(true);
                }}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                {canDelete === false && blockingOrgs.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      ⚠️ Cannot Delete Account
                    </p>
                    <p className="text-sm text-yellow-800 mb-2">
                      You are the sole owner of the following organization(s). Please transfer
                      ownership or delete the organization(s) before deleting your account:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-800">
                      {blockingOrgs.map(org => (
                        <li key={org.id}>{org.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {canDelete !== false && (
                  <>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-900 mb-2">
                        ⚠️ Warning: This action is permanent
                      </p>
                      <p className="text-sm text-red-800">
                        All your projects, interviews, assumptions, and data will be permanently deleted.
                        Please export your data before proceeding if you want to keep a copy.
                      </p>
                    </div>

                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <div>
                        <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm your email address to proceed:
                        </label>
                        <input
                          id="confirmEmail"
                          type="email"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          placeholder={user?.email || ''}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {deleteError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-800">{deleteError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={deleteLoading}
                          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setConfirmEmail('');
                            setDeleteError(null);
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {canDelete === false && (
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmEmail('');
                      setDeleteError(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              GDPR Right to Erasure - You have the right to request deletion of your personal data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
