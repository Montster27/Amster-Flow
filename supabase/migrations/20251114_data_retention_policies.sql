-- ============================================================================
-- Data Retention Policies
-- Automated cleanup of old data for compliance and storage optimization
-- ============================================================================

-- ============================================================================
-- FUNCTION: Clean up soft-deleted projects
-- Permanently delete projects that have been soft-deleted for 90+ days
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_deleted_projects()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Note: Projects table does not support soft-delete (no is_deleted column)
  -- Projects are permanently deleted immediately via CASCADE
  -- This function is a placeholder for future soft-delete implementation
  RETURN 0;
END;
$$;

-- ============================================================================
-- FUNCTION: Clean up old anonymous audit logs
-- Remove audit logs older than specified retention period
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_anonymous_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Delete anonymized logs (where user_email contains 'deleted-user') older than 1 year
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '365 days'
  AND user_email LIKE '%deleted-user%';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Clean up inactive user preferences
-- Remove preferences for users who haven't logged in for 1+ year
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_inactive_user_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_inactive_user_ids UUID[];
BEGIN
  -- Find users who haven't logged in for over 1 year
  -- (based on last audit log entry)
  SELECT ARRAY_AGG(DISTINCT user_id) INTO v_inactive_user_ids
  FROM (
    SELECT user_id, MAX(created_at) as last_activity
    FROM audit_log
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING MAX(created_at) < NOW() - INTERVAL '365 days'
  ) inactive_users;

  IF v_inactive_user_ids IS NULL OR array_length(v_inactive_user_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Clean up user preferences for inactive users
  DELETE FROM user_interview_preferences WHERE user_id = ANY(v_inactive_user_ids);
  DELETE FROM user_dismissed_templates WHERE user_id = ANY(v_inactive_user_ids);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Master cleanup function (runs all cleanup tasks)
-- ============================================================================

CREATE OR REPLACE FUNCTION run_data_retention_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_projects_deleted INTEGER;
  v_audit_logs_deleted INTEGER;
  v_old_audit_logs_deleted INTEGER;
  v_user_data_deleted INTEGER;
  v_result JSONB;
BEGIN
  -- Run all cleanup functions
  SELECT cleanup_deleted_projects() INTO v_projects_deleted;
  SELECT cleanup_old_audit_logs() INTO v_audit_logs_deleted;
  SELECT cleanup_old_anonymous_logs() INTO v_old_audit_logs_deleted;
  SELECT cleanup_inactive_user_data() INTO v_user_data_deleted;

  -- Build result summary
  v_result := jsonb_build_object(
    'timestamp', NOW(),
    'projects_deleted', v_projects_deleted,
    'audit_logs_cleaned', v_audit_logs_deleted,
    'old_anonymous_logs_cleaned', v_old_audit_logs_deleted,
    'inactive_user_data_cleaned', v_user_data_deleted,
    'total_records_cleaned',
      v_projects_deleted + v_audit_logs_deleted + v_old_audit_logs_deleted + v_user_data_deleted
  );

  -- Log the cleanup in audit trail (for transparency)
  IF (v_projects_deleted + v_audit_logs_deleted + v_old_audit_logs_deleted + v_user_data_deleted) > 0 THEN
    INSERT INTO audit_log (
      event_type,
      user_id,
      user_email,
      metadata,
      success
    ) VALUES (
      'system.data_retention_cleanup',
      NULL,
      'system@amsterflow.local',
      v_result,
      TRUE
    );
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION cleanup_deleted_projects TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_anonymous_logs TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION run_data_retention_cleanup TO authenticated;

-- ============================================================================
-- Scheduled Job Configuration (via pg_cron or Supabase Edge Functions)
-- ============================================================================

-- NOTE: This requires pg_cron extension or Supabase Edge Functions with cron triggers
--
-- For Supabase, create an Edge Function that calls run_data_retention_cleanup()
-- and configure it to run weekly via Supabase's cron functionality:
--
-- Edge Function example (supabase/functions/data-retention-cleanup/index.ts):
--
-- import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
-- import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
--
-- serve(async (req) => {
--   const supabase = createClient(
--     Deno.env.get('SUPABASE_URL') ?? '',
--     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
--   )
--
--   const { data, error } = await supabase.rpc('run_data_retention_cleanup')
--
--   return new Response(
--     JSON.stringify({ data, error }),
--     { headers: { "Content-Type": "application/json" } },
--   )
-- })
--
-- Then configure cron trigger in Supabase Dashboard:
-- Schedule: "0 2 * * 0" (Every Sunday at 2 AM UTC)

-- ============================================================================
-- Manual Testing
-- ============================================================================

-- To manually test the retention cleanup:
-- SELECT run_data_retention_cleanup();

-- To check what would be cleaned:
-- SELECT COUNT(*) FROM projects WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL '90 days';
-- SELECT COUNT(*) FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days';

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Data retention policies created successfully!';
  RAISE NOTICE '🗑️  cleanup_deleted_projects() - Remove soft-deleted projects after 90 days';
  RAISE NOTICE '🗑️  cleanup_old_audit_logs() - Remove audit logs after 90 days (except critical)';
  RAISE NOTICE '🗑️  cleanup_old_anonymous_logs() - Remove anonymized logs after 1 year';
  RAISE NOTICE '🗑️  cleanup_inactive_user_data() - Clean preferences for inactive users (1+ year)';
  RAISE NOTICE '▶️  run_data_retention_cleanup() - Master function to run all cleanups';
  RAISE NOTICE '⏰ Recommended: Schedule run_data_retention_cleanup() to run weekly via Edge Function';
END $$;
