import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);

  // Get current organization from list
  const organization = organizations.find(org => org.id === currentOrgId) || null;

  // Initialize: Ensure user has an organization
  useEffect(() => {
    if (!user) return;

    const initializeUser = async () => {
      try {
        // 1. Check if profile exists (use maybeSingle to avoid 406 error)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // 2. Create profile if it doesn't exist
        if (!profile && !profileError) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
            });

          // Ignore conflict errors (profile already exists)
          if (insertError && insertError.code !== '23505') {
            console.error('Error creating profile:', insertError);
          }
        }

        // 3. Load ALL organizations user is a member of
        // Query memberships first, then load organizations separately to avoid RLS issues
        const { data: memberships, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);


        // CRITICAL: Only create org if query succeeded AND returned empty
        // Don't create if there was an error (prevents duplicate creation)
        if (memberError) {
          console.error('Error loading memberships:', memberError);
          throw new Error('Failed to load your organizations. Please refresh the page.');
        }

        let allOrgs: Organization[] = [];

        if (memberships && memberships.length > 0) {
          // Load organizations separately
          const orgIds = memberships.map(m => m.organization_id);
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .in('id', orgIds);


          if (orgsError) {
            console.error('Error loading organizations:', orgsError);
            throw new Error('Failed to load your organizations. Please refresh the page.');
          }

          allOrgs = orgsData || [];
        } else {
          // No memberships found - create first organization
          // Double-check by querying orgs created by this user to prevent duplicates
          const { data: existingOrgs } = await supabase
            .from('organizations')
            .select('*')
            .eq('created_by', user.id)
            .limit(1);

          if (existingOrgs && existingOrgs.length > 0) {
            // User created an org but isn't a member - fix the membership
            const existingOrg = existingOrgs[0];

            const { error: addMemberError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: existingOrg.id,
                user_id: user.id,
                role: 'owner',
              });

            if (addMemberError && addMemberError.code !== '23505') {
              // Ignore duplicate key errors
              console.error('Error adding user to existing org:', addMemberError);
            }

            allOrgs = [existingOrg];
          } else {
            // Truly no organization - create one
            const { data: newOrg, error: orgError } = await supabase
              .from('organizations')
              .insert({
                name: `${user.email?.split('@')[0]}'s Team`,
                created_by: user.id,
              })
              .select()
              .single();

            if (orgError) {
              console.error('Error creating organization:', orgError);
              throw new Error('Failed to create your organization. Please try again.');
            }

            // Add user as owner
            const { error: newMemberError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: newOrg.id,
                user_id: user.id,
                role: 'owner',
              });

            if (newMemberError) {
              console.error('Error adding organization member:', newMemberError);
              throw new Error('Failed to set up your organization. Please try again.');
            }

            allOrgs = [newOrg];
          }
        }


        if (allOrgs.length === 0) {
          throw new Error('No organizations found. Please contact support.');
        }

        setOrganizations(allOrgs);

        // 4. Set current organization (validate localStorage or use first one)
        const savedOrgId = localStorage.getItem('currentOrgId');

        // Validate that saved org ID exists in user's orgs
        const selectedOrg = (savedOrgId && allOrgs.find(org => org.id === savedOrgId)) || allOrgs[0];

        // Clear invalid localStorage value
        if (savedOrgId && !allOrgs.find(org => org.id === savedOrgId)) {
          localStorage.removeItem('currentOrgId');
        }

        setCurrentOrgId(selectedOrg.id);
        localStorage.setItem('currentOrgId', selectedOrg.id);

        // 5. Load projects for selected organization
        if (selectedOrg) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('organization_id', selectedOrg.id)
            .order('created_at', { ascending: false });

          if (projectsError) {
            console.error('Error loading projects:', projectsError);
            throw new Error('Failed to load projects. Please refresh the page.');
          }

          setProjects(projectsData || []);
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [user]);

  // Reload projects when organization changes
  useEffect(() => {
    if (!currentOrgId) {
      return;
    }


    const loadProjects = async () => {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);
    };

    loadProjects();
  }, [currentOrgId]);

  // const handleSwitchOrganization = (orgId: string) => {
  //   setCurrentOrgId(orgId);
  //   localStorage.setItem('currentOrgId', orgId);
  // };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization || !newProjectName.trim()) return;

    setCreateProjectError(null);

    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          organization_id: organization.id,
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw new Error('Failed to create project. Please try again.');
      }

      setProjects([newProject, ...projects]);
      setShowCreateProject(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setCreateProjectError(null);

      // Navigate to the project
      navigate(`/project/${newProject.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setCreateProjectError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
            >
              Sign Out
            </button>
          </div>
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ArmsterFlow</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:underline"
                >
                  Admin
                </button>
              )}
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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Projects</h2>
            <p className="text-gray-600 mt-1">Manage your Lean Canvas projects</p>
          </div>
          <button
            onClick={() => setShowCreateProject(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
          >
            + New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first Lean Canvas project to get started</p>
            <button
              onClick={() => setShowCreateProject(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateProject(false)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Startup Idea"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Brief description of your project..."
                />
              </div>
              {createProjectError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{createProjectError}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProject(false);
                    setCreateProjectError(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
