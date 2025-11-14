/**
 * Data Privacy & GDPR Compliance Functions
 *
 * Provides user data export and account deletion functionality
 * in compliance with GDPR and privacy regulations.
 */

import { supabase } from './supabase';
import { captureException } from './sentry';

/**
 * Export all user data in JSON format (GDPR Right to Data Portability)
 *
 * Returns a comprehensive export including:
 * - Profile information
 * - Organization memberships
 * - Projects and associated data
 * - Assumptions, interviews, iterations
 * - Recent audit log entries
 */
export async function exportUserData(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('export_user_data');

    if (error) {
      console.error('Export user data error:', error);
      captureException(new Error(`Export failed: ${error.message}`), {
        extra: {
          context: 'exportUserData',
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          fullError: error,
        },
      });
      throw new Error(`Failed to export data: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`);
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to export user data');
    captureException(error, {
      extra: { context: 'exportUserData' },
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Download user data as a JSON file
 */
export async function downloadUserData(): Promise<void> {
  const result = await exportUserData();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to export data');
  }

  // Create a blob from the JSON data
  const jsonString = JSON.stringify(result.data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `amsterflow-data-export-${new Date().toISOString().split('T')[0]}.json`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Delete user account and all associated data (GDPR Right to Erasure)
 *
 * IMPORTANT: This is irreversible. User must confirm their email address.
 *
 * Deletes:
 * - All projects created by the user
 * - All assumptions, interviews, iterations
 * - Organization memberships
 * - User preferences
 * - Profile data
 *
 * Note: User cannot delete their account if they are the sole owner of any organization.
 */
export async function deleteUserAccount(
  confirmationEmail: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('delete_user_account', {
      p_user_id: null, // Use current user
      p_confirmation_email: confirmationEmail,
    });

    if (error) {
      throw error;
    }

    // Sign out the user after successful deletion
    await supabase.auth.signOut();

    const resultData = data as any;

    return {
      success: true,
      message: resultData?.message || 'Account deleted successfully',
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to delete account');

    // Don't capture to Sentry if it's a user error (sole owner, wrong email, etc.)
    if (!error.message.includes('sole owner') && !error.message.includes('does not match')) {
      captureException(error, {
        extra: { context: 'deleteUserAccount' },
      });
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if user can delete their account
 * (i.e., they are not the sole owner of any organizations)
 */
export async function canDeleteAccount(): Promise<{
  canDelete: boolean;
  blockingOrganizations?: Array<{ id: string; name: string }>;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { canDelete: false };
    }

    // Get organizations where user is the sole owner
    const { data: memberships, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name)')
      .eq('user_id', user.id)
      .eq('role', 'owner');

    if (error) {
      throw error;
    }

    const blockingOrgs: Array<{ id: string; name: string }> = [];

    // For each org where user is owner, check if there are other owners
    for (const membership of memberships || []) {
      const { data: otherOwners } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', membership.organization_id)
        .eq('role', 'owner')
        .neq('user_id', user.id);

      // If no other owners, this org blocks deletion
      if (!otherOwners || otherOwners.length === 0) {
        const org = membership.organizations as any;
        blockingOrgs.push({
          id: membership.organization_id,
          name: org?.name || 'Unknown Organization',
        });
      }
    }

    return {
      canDelete: blockingOrgs.length === 0,
      blockingOrganizations: blockingOrgs.length > 0 ? blockingOrgs : undefined,
    };
  } catch (err) {
    captureException(err instanceof Error ? err : new Error('Failed to check account deletion eligibility'), {
      extra: { context: 'canDeleteAccount' },
    });

    return { canDelete: false };
  }
}
