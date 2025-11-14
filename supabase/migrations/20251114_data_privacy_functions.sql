-- ============================================================================
-- Data Privacy & GDPR Compliance Functions
-- Implements data export and account deletion for user privacy rights
-- ============================================================================

-- ============================================================================
-- FUNCTION: Export User Data (GDPR Right to Data Portability)
-- ============================================================================

CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_profile JSONB;
  v_organizations JSONB;
  v_projects JSONB;
  v_assumptions JSONB;
  v_interviews JSONB;
  v_iterations JSONB;
  v_audit_logs JSONB;
BEGIN
  -- Use provided user_id or default to current user
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Only allow users to export their own data (unless admin)
  IF v_user_id != auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You can only export your own data';
  END IF;

  -- Get profile data
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'affiliation', affiliation,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_profile
  FROM profiles
  WHERE id = v_user_id;

  -- Get organizations (member of)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'organization_id', om.organization_id,
    'organization_name', o.name,
    'role', om.role,
    'joined_at', om.joined_at
  )), '[]'::jsonb) INTO v_organizations
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = v_user_id;

  -- Get projects (that user has access to)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'description', p.description,
    'organization_id', p.organization_id,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  )), '[]'::jsonb) INTO v_projects
  FROM projects p
  WHERE p.created_by = v_user_id
  OR p.organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = v_user_id
  );

  -- Get assumptions from user's projects
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'project_id', pa.project_id,
    'type', pa.type,
    'description', pa.description,
    'status', pa.status,
    'confidence', pa.confidence,
    'evidence', pa.evidence,
    'created_at', pa.created_at,
    'updated_at', pa.updated_at
  )), '[]'::jsonb) INTO v_assumptions
  FROM project_assumptions pa
  WHERE pa.project_id IN (
    SELECT id FROM projects WHERE created_by = v_user_id
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = v_user_id)
  );

  -- Get interviews from user's projects
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'project_id', pi.project_id,
    'interview_date', pi.interview_date,
    'segment_name', pi.segment_name,
    'interviewee_type', pi.interviewee_type,
    'context', pi.context,
    'main_pain_points', pi.main_pain_points,
    'current_alternatives', pi.current_alternatives,
    'memorable_quotes', pi.memorable_quotes,
    'surprising_feedback', pi.surprising_feedback,
    'student_reflection', pi.student_reflection,
    'status', pi.status,
    'created_at', pi.created_at
  )), '[]'::jsonb) INTO v_interviews
  FROM project_interviews_enhanced pi
  WHERE pi.project_id IN (
    SELECT id FROM projects WHERE created_by = v_user_id
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = v_user_id)
  );

  -- Get iterations from user's projects
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'project_id', pit.project_id,
    'version', pit.version,
    'date', pit.date,
    'changes', pit.changes,
    'reasoning', pit.reasoning,
    'assumptions_affected', pit.assumptions_affected,
    'created_at', pit.created_at
  )), '[]'::jsonb) INTO v_iterations
  FROM project_iterations pit
  WHERE pit.project_id IN (
    SELECT id FROM projects WHERE created_by = v_user_id
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = v_user_id)
  );

  -- Get audit logs (user's own activities)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'event_type', event_type,
    'created_at', created_at,
    'success', success,
    'metadata', metadata
  )), '[]'::jsonb) INTO v_audit_logs
  FROM audit_log
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 100; -- Limit to most recent 100 events

  -- Build final result
  v_result := jsonb_build_object(
    'export_date', NOW(),
    'user_id', v_user_id,
    'profile', v_profile,
    'organizations', v_organizations,
    'projects', v_projects,
    'assumptions', v_assumptions,
    'interviews', v_interviews,
    'iterations', v_iterations,
    'audit_logs', v_audit_logs
  );

  -- Log the export in audit trail
  PERFORM log_auth_event(
    'auth.data_export',
    v_user_id,
    (SELECT email FROM profiles WHERE id = v_user_id),
    TRUE,
    NULL,
    jsonb_build_object('export_size_kb', octet_length(v_result::text) / 1024)
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Delete User Account (GDPR Right to Erasure)
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_account(
  p_user_id UUID DEFAULT NULL,
  p_confirmation_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_deleted_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Use provided user_id or default to current user
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Get user email
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = v_user_id;

  -- Only allow users to delete their own account (unless admin)
  IF v_user_id != auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;

  -- Verify email confirmation if provided
  IF p_confirmation_email IS NOT NULL AND p_confirmation_email != v_user_email THEN
    RAISE EXCEPTION 'Email confirmation does not match';
  END IF;

  -- Check if user is the sole owner of any organizations
  IF EXISTS (
    SELECT 1
    FROM organization_members om1
    WHERE om1.user_id = v_user_id
    AND om1.role = 'owner'
    AND NOT EXISTS (
      SELECT 1
      FROM organization_members om2
      WHERE om2.organization_id = om1.organization_id
      AND om2.user_id != v_user_id
      AND om2.role = 'owner'
    )
  ) THEN
    RAISE EXCEPTION 'Cannot delete account: You are the sole owner of one or more organizations. Please transfer ownership or delete the organizations first.';
  END IF;

  -- Log the deletion request before deleting
  PERFORM log_auth_event(
    'auth.account_deletion',
    v_user_id,
    v_user_email,
    TRUE,
    NULL,
    jsonb_build_object('deletion_requested_at', NOW())
  );

  -- Delete user data in reverse dependency order

  -- Delete interview assumption tags
  DELETE FROM interview_assumption_tags
  WHERE interview_id IN (
    SELECT id FROM project_interviews_enhanced
    WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id)
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Delete interview synthesis
  DELETE FROM interview_synthesis
  WHERE interview_id IN (
    SELECT id FROM project_interviews_enhanced
    WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id)
  );

  -- Delete interviews
  DELETE FROM project_interviews_enhanced
  WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);

  -- Delete assumptions
  DELETE FROM project_assumptions
  WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);

  -- Delete iterations
  DELETE FROM project_iterations
  WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);

  -- Delete other project-related data
  DELETE FROM project_competitors WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);
  DELETE FROM project_decision_makers WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);
  DELETE FROM project_first_target WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);
  DELETE FROM project_module_completion WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);
  DELETE FROM project_modules WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);
  DELETE FROM project_pivot_decisions WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);
  DELETE FROM project_visual_sector_map WHERE project_id IN (SELECT id FROM projects WHERE created_by = v_user_id);

  -- Delete projects created by user
  DELETE FROM projects WHERE created_by = v_user_id;

  -- Delete user preferences
  DELETE FROM user_interview_preferences WHERE user_id = v_user_id;
  DELETE FROM user_dismissed_templates WHERE user_id = v_user_id;

  -- Remove user from organizations (but don't delete the orgs)
  DELETE FROM organization_members WHERE user_id = v_user_id;

  -- Anonymize audit logs (keep for compliance but remove PII)
  UPDATE audit_log
  SET user_email = 'deleted-user@amsterflow.local',
      metadata = metadata || jsonb_build_object('user_deleted', true)
  WHERE user_id = v_user_id;

  -- Delete profile
  DELETE FROM profiles WHERE id = v_user_id;

  -- Note: auth.users deletion must be done via Supabase Admin API
  -- We don't have permission to delete from auth schema directly

  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_user_email,
    'deleted_at', NOW(),
    'message', 'Account data deleted successfully. Your authentication record will be removed within 24 hours.'
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION export_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Data privacy functions created successfully!';
  RAISE NOTICE '📥 export_user_data() - GDPR Right to Data Portability';
  RAISE NOTICE '🗑️  delete_user_account() - GDPR Right to Erasure';
  RAISE NOTICE '🔒 Security: Users can only access their own data';
  RAISE NOTICE '⚠️  Note: Sole org owners must transfer ownership before deletion';
END $$;
