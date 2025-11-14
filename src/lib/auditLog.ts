/**
 * Audit Logging Utilities
 *
 * Provides helper functions to log security and compliance events
 * to the audit_log table via Supabase RPC functions.
 */

import { supabase } from './supabase';
import { captureException } from './sentry';

/**
 * Event types for audit logging
 */
export type AuditEventType =
  | 'auth.signup'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'auth.email_change'
  | 'member.added'
  | 'member.removed'
  | 'member.role_changed'
  | 'project.created'
  | 'project.deleted'
  | 'organization.created'
  | 'organization.deleted';

/**
 * Log an authentication event
 */
export async function logAuthEvent(
  eventType: 'auth.signup' | 'auth.login' | 'auth.logout' | 'auth.password_reset' | 'auth.email_change',
  userId: string,
  userEmail: string,
  options?: {
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_auth_event', {
      p_event_type: eventType,
      p_user_id: userId,
      p_user_email: userEmail,
      p_success: options?.success ?? true,
      p_error_message: options?.errorMessage ?? null,
      p_metadata: (options?.metadata ?? {}) as any,
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    // Don't fail the operation if audit logging fails
    // Just log to Sentry for monitoring
    captureException(err instanceof Error ? err : new Error('Audit log failed'), {
      extra: {
        eventType,
        userId,
        context: 'logAuthEvent',
      },
    });
  }
}

/**
 * Log a member operation (add, remove, role change)
 */
export async function logMemberEvent(
  eventType: 'member.added' | 'member.removed' | 'member.role_changed',
  userId: string,
  targetUserId: string,
  organizationId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_member_event', {
      p_event_type: eventType,
      p_user_id: userId,
      p_target_user_id: targetUserId,
      p_organization_id: organizationId,
      p_metadata: (metadata ?? {}) as any,
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    captureException(err instanceof Error ? err : new Error('Audit log failed'), {
      extra: {
        eventType,
        userId,
        targetUserId,
        organizationId,
        context: 'logMemberEvent',
      },
    });
  }
}

/**
 * Fetch audit logs for the current user
 * (Users can only see their own logs unless they're an admin)
 */
export async function getUserAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    captureException(error, {
      extra: { context: 'getUserAuditLogs' },
    });
    return [];
  }

  return data || [];
}

/**
 * Fetch audit logs for an organization (owners only)
 */
export async function getOrganizationAuditLogs(organizationId: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('target_organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    captureException(error, {
      extra: { organizationId, context: 'getOrganizationAuditLogs' },
    });
    return [];
  }

  return data || [];
}
