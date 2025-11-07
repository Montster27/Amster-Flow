-- ============================================================================
-- UPDATE INVITE FUNCTION TO SEND EMAIL NOTIFICATIONS
-- This replaces the existing invite_user_to_organization function
-- ============================================================================

CREATE OR REPLACE FUNCTION invite_user_to_organization(
  p_organization_id UUID,
  p_user_email TEXT,
  p_role TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_member_exists BOOLEAN;
  v_org_name TEXT;
  v_inviter_email TEXT;
  v_function_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = p_organization_id;

  -- Get inviter email
  SELECT email INTO v_inviter_email
  FROM profiles
  WHERE id = auth.uid();

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No user found with this email. They need to sign up first.'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
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

  -- Create in-app notification for invited user
  INSERT INTO notifications (user_id, organization_id, type, title, message, link)
  VALUES (
    v_user_id,
    p_organization_id,
    'invite',
    'You''ve been invited to a team!',
    format('%s invited you to join %s as %s', v_inviter_email, v_org_name, p_role),
    '/dashboard'
  );

  -- Send email notification via Edge Function
  -- NOTE: This uses pg_net which must be enabled in Supabase
  -- The email sending happens asynchronously and won't block the response
  BEGIN
    -- Get the Edge Function URL from Supabase settings
    -- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
    -- You can find this in your Supabase project URL: https://YOUR_PROJECT_REF.supabase.co
    v_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-invite-email';

    -- Get service role key (this should be set as a database setting)
    -- For security, store this in Supabase Vault or as a database setting
    v_service_role_key := current_setting('app.supabase_service_role_key', true);

    IF v_service_role_key IS NOT NULL THEN
      -- Call Edge Function asynchronously
      PERFORM
        net.http_post(
          url := v_function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
          ),
          body := jsonb_build_object(
            'invitedEmail', p_user_email,
            'organizationName', v_org_name,
            'inviterEmail', v_inviter_email,
            'role', p_role,
            'appUrl', 'https://your-app-url.vercel.app/login'  -- Update with your production URL
          )
        );
    ELSE
      -- Log warning if service role key not configured
      RAISE WARNING 'Service role key not configured - email notification not sent';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Don't fail the entire function if email sending fails
      -- Just log the error
      RAISE WARNING 'Failed to send email notification: %', SQLERRM;
  END;

  -- Return success (even if email failed - user was still invited)
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_user_email
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS FOR HTTP REQUESTS
-- ============================================================================

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to authenticated users (via SECURITY DEFINER function)
GRANT USAGE ON SCHEMA net TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Invite function updated with email notifications!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You must configure the following:';
    RAISE NOTICE '   1. Replace YOUR_PROJECT_REF with your Supabase project reference';
    RAISE NOTICE '   2. Set the service role key as a database setting';
    RAISE NOTICE '   3. Update the appUrl to your production URL';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Emails will be sent via the send-invite-email Edge Function';
END $$;
