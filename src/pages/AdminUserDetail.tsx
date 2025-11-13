import { useState, useEffect } from 'react';
import { captureException } from '../lib/sentry';

import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

import { useAdmin } from '../hooks/useAdmin';

import { supabase } from '../lib/supabase';

import type { Database } from '../types/database';


type Profile = Database['public']['Tables']['profiles']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];

interface ProjectWithOrg extends Project {
  organization_name: string;
  user_role: string;
}

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<ProjectWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Load user data
  useEffect(() => {
    if (!userId || !isAdmin) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, is_admin, created_at, updated_at')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Get user's organization memberships
        const { data: membershipsData, error: membershipsError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('user_id', userId);

        if (membershipsError) throw membershipsError;
        setMemberships(membershipsData || []);

        // Get organizations
        const orgIds = membershipsData?.map(m => m.organization_id) || [];
        if (orgIds.length > 0) {
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .in('id', orgIds);

          if (orgsError) throw orgsError;
          setOrganizations(orgsData || []);

          // Get all projects from these organizations (exclude soft-deleted)
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('organization_id', orgIds)
            .order('created_at', { ascending: false });

          if (projectsError) throw projectsError;

          // Combine with organization names and user roles
          const projectsWithOrg: ProjectWithOrg[] = (projectsData || []).map(project => {
            const org = orgsData?.find(o => o.id === project.organization_id);
            const membership = membershipsData?.find(m => m.organization_id === project.organization_id);

            return {
              ...project,
              organization_name: org?.name || 'Unknown',
              user_role: membership?.role || 'unknown',
            };
          });

          setProjects(projectsWithOrg);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error loading user data'); captureException(error, { extra: { userId, context: 'AdminUserDetail load' } });
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, isAdmin]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-red-600">Admin Panel</h1>
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ← Back to Admin
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : !profile ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">User not found</p>
          </div>
        ) : (
          <>
            {/* User Profile Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-lg text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                  <p className="text-lg text-gray-900">{profile.full_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                  <p className="text-sm text-gray-600 font-mono">{profile.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Admin Status</label>
                  <p className="text-lg text-gray-900">
                    {profile.is_admin ? (
                      <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded">
                        Admin
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 rounded">
                        Regular User
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                  <p className="text-lg text-gray-900">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-lg text-gray-900">
                    {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Organizations */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Organizations ({organizations.length})
              </h2>
              {organizations.length === 0 ? (
                <p className="text-gray-600">User is not a member of any organizations</p>
              ) : (
                <div className="space-y-3">
                  {organizations.map((org) => {
                    const membership = memberships.find(m => m.organization_id === org.id);
                    return (
                      <div
                        key={org.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-500">
                            Created {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded ${
                            membership?.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : membership?.role === 'editor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {membership?.role || 'Unknown'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Projects ({projects.length})
              </h2>
              {projects.length === 0 ? (
                <p className="text-gray-600">User has no projects</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs text-gray-500">
                            Organization: {project.organization_name}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              project.user_role === 'owner'
                                ? 'bg-purple-100 text-purple-800'
                                : project.user_role === 'editor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.user_role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/project/${project.id}`)}
                        className="ml-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View Project →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
