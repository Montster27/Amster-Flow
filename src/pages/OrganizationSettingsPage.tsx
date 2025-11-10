import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface MemberWithProfile extends OrganizationMember {
  profiles: Profile;
}

export function OrganizationSettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadOrganizationAndMembers = async () => {
      try {
        // Get user's organization membership (split query to avoid RLS join blocking)
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .limit(1);

        if (!memberships || memberships.length === 0) {
          navigate('/dashboard');
          return;
        }

        const userRole = memberships[0].role;
        const orgId = memberships[0].organization_id;

        // Load organization separately
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (!org) {
          navigate('/dashboard');
          return;
        }

        setOrganization(org);
        setCurrentUserRole(userRole);

        // Load all members (split query to avoid RLS join blocking)
        const { data: memberRows, error: memberError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', org.id)
          .order('joined_at', { ascending: true });


        if (memberError) {
          console.error('Failed to load members:', memberError);
          throw memberError;
        }

        if (!memberRows || memberRows.length === 0) {
          setMembers([]);
          return;
        }

        // Load profiles separately
        const userIds = memberRows.map(m => m.user_id);
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);


        if (profileError) {
          console.error('Failed to load profiles:', profileError);
        }

        // Combine members with profiles
        const membersWithProfiles = memberRows.map(member => ({
          ...member,
          profiles: profileRows?.find(p => p.id === member.user_id) || { id: member.user_id, email: 'Unknown', full_name: null },
        }));

        setMembers(membersWithProfiles as MemberWithProfile[]);
      } catch (err) {
        console.error('Error loading organization:', err);
        setError(err instanceof Error ? err.message : 'Failed to load organization settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationAndMembers();
  }, [user, navigate]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization || currentUserRole !== 'owner') return;

    setInviteError(null);
    setSuccessMessage(null);

    try {
      // Use the invite_user_to_organization function to handle everything
      const { data: result, error: inviteError } = await supabase.rpc('invite_user_to_organization', {
        p_organization_id: organization.id,
        p_user_email: inviteEmail.toLowerCase().trim(),
        p_role: inviteRole,
      });

      if (inviteError) {
        console.error('RPC error:', inviteError);
        throw new Error('Failed to invite member. Please try again.');
      }

      // Check if the function returned an error
      const resultObj = result as { success?: boolean; error?: string } | null;
      if (resultObj && !resultObj.success) {
        setInviteError(resultObj.error || 'Failed to invite member');
        return;
      }

      // Reload members (split query to avoid RLS join blocking)
      const { data: memberRows, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Error reloading members:', membersError);
        throw new Error('Member invited but failed to reload member list. Please refresh the page.');
      }

      if (memberRows && memberRows.length > 0) {
        // Load profiles separately
        const userIds = memberRows.map(m => m.user_id);
        const { data: profileRows, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
        }

        // Combine members with profiles
        const membersWithProfiles = memberRows.map(member => ({
          ...member,
          profiles: profileRows?.find(p => p.id === member.user_id) || { id: member.user_id, email: 'Unknown', full_name: null },
        }));

        setMembers(membersWithProfiles as MemberWithProfile[]);
      } else {
        setMembers([]);
      }

      // Show success message
      setSuccessMessage(`Successfully invited ${inviteEmail} to your organization!`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('editor');

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error inviting member:', err);
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member. Please try again.');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'owner' | 'editor' | 'viewer') => {
    if (!organization || currentUserRole !== 'owner') return;

    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) {
        console.error('Error changing role:', error);
        throw new Error('Failed to change role. Please try again.');
      }

      // Update local state
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ));

      setSuccessMessage('Member role updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error changing role:', err);
      setError(err instanceof Error ? err.message : 'Failed to change role. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!organization || currentUserRole !== 'owner') return;

    if (!confirm(`Remove ${memberEmail} from this organization? They will lose access to all projects.`)) {
      return;
    }

    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing member:', error);
        throw new Error('Failed to remove member. Please try again.');
      }

      setMembers(members.filter(m => m.id !== memberId));
      setSuccessMessage(`Successfully removed ${memberEmail} from your organization.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member. Please try again.');
      setTimeout(() => setError(null), 5000);
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
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Settings</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = currentUserRole === 'owner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ArmsterFlow</h1>
              {organization && (
                <p className="text-sm text-gray-600">{organization.name}</p>
              )}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </p>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Organization Settings</h2>
            <p className="text-gray-600 mt-1">Manage your team members and roles</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
            >
              + Invite Member
            </button>
          )}
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Name: </span>
              <span className="text-sm font-medium text-gray-900">{organization?.name}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Your Role: </span>
              <span className="text-sm font-medium text-gray-900 capitalize">{currentUserRole}</span>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.profiles.email}</p>
                  {member.profiles.full_name && (
                    <p className="text-sm text-gray-600">{member.profiles.full_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {isOwner && member.user_id !== user?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 capitalize">
                      {member.role}
                    </span>
                  )}
                  {isOwner && member.user_id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.profiles.email)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                  {member.user_id === user?.id && (
                    <span className="text-sm text-gray-500">(You)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isOwner && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Only organization owners can invite members and change roles.
            </p>
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowInviteModal(false);
            setInviteError(null);
          }}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Invite Team Member</h3>
            <form onSubmit={handleInviteMember}>
              <div className="mb-4">
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  User must already have an account with this email
                </p>
              </div>
              <div className="mb-6">
                <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="owner">Owner - Full access</option>
                  <option value="editor">Editor - Can create and edit</option>
                  <option value="viewer">Viewer - Read only</option>
                </select>
              </div>
              {inviteError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{inviteError}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteError(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
