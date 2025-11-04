-- Function to invite a user to an organization
-- This bypasses RLS to create profile and add member in one transaction
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
  v_result JSON;
BEGIN
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

  -- Return success with user info
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_user_email
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user_to_organization(UUID, TEXT, TEXT) TO authenticated;

-- Test the function
SELECT * FROM invite_user_to_organization(
  '00000000-0000-0000-0000-000000000000'::UUID, -- Replace with actual org ID
  'monty.sharma@gmail.com',
  'editor'
);
