-- Secure SECURITY DEFINER functions that lacked authorization checks
-- Fixes: get_user_by_email (user enumeration), invite_user_to_organization (unauthorized invites)
-- Also revokes anon/authenticated access to system cleanup functions

-- ============================================================
-- 6a. get_user_by_email: require authentication
-- Previously callable by anonymous users, enabling user enumeration
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only authenticated users can look up users by email
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.email = user_email
  LIMIT 1;
END;
$$;

-- Revoke from anon - only authenticated users should call this
REVOKE ALL ON FUNCTION public.get_user_by_email(text) FROM anon;

-- ============================================================
-- 6b. invite_user_to_organization: require org ownership or admin
-- Previously any authenticated user could add themselves to any org
-- ============================================================
CREATE OR REPLACE FUNCTION public.invite_user_to_organization(
  p_organization_id uuid, p_user_email text, p_role text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_member_exists BOOLEAN;
BEGIN
  -- Authorization: caller must be org owner or admin
  IF NOT (
    is_organization_owner(p_organization_id)
    OR is_admin()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to invite members to this organization');
  END IF;

  -- Check if user exists in auth.users
  SELECT au.id INTO v_user_id
  FROM auth.users au
  WHERE au.email = p_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No user found with this email. They need to sign up first.'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE profiles.id = v_user_id
  ) INTO v_profile_exists;

  -- Create profile if it doesn't exist
  IF NOT v_profile_exists THEN
    INSERT INTO profiles (id, email)
    VALUES (v_user_id, p_user_email)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = v_user_id
  ) INTO v_member_exists;

  IF v_member_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This user is already a member of this organization.'
    );
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, v_user_id, p_role);

  -- Return success with user info
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_user_email
  );
END;
$$;

-- Revoke from anon
REVOKE ALL ON FUNCTION public.invite_user_to_organization(uuid, text, text) FROM anon;

-- ============================================================
-- 6c. Revoke anon/authenticated access to system cleanup functions
-- These should only be callable by service_role (cron jobs, admin)
-- ============================================================
REVOKE ALL ON FUNCTION public.run_data_retention_cleanup() FROM anon;
REVOKE ALL ON FUNCTION public.run_data_retention_cleanup() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_deleted_projects() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_deleted_projects() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_anonymous_logs() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_anonymous_logs() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_inactive_user_data() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_inactive_user_data() FROM authenticated;
