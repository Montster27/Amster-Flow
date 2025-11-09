-- ============================================================================
-- FIX EXISTING USERS WHO DON'T HAVE THEIR OWN ORGANIZATION
-- Creates organizations for users who only have viewer access to Walking on the Sun
-- ============================================================================

DO $$
DECLARE
  v_user RECORD;
  v_new_org_id UUID;
  v_org_name TEXT;
  v_walking_org_id UUID;
  v_fixed_count INT := 0;
BEGIN
  -- Get Walking on the Sun organization ID
  SELECT p.organization_id INTO v_walking_org_id
  FROM projects p
  WHERE p.name ILIKE '%walking%sun%'
  LIMIT 1;

  -- Find users who only have viewer access and no organizations they own
  FOR v_user IN
    SELECT DISTINCT p.id, p.email
    FROM profiles p
    WHERE p.is_admin = false  -- Skip admin users
    AND NOT EXISTS (
      -- User doesn't own any organization
      SELECT 1 FROM organizations o
      WHERE o.created_by = p.id
    )
    AND NOT EXISTS (
      -- User isn't an owner or editor of any organization
      SELECT 1 FROM organization_members om
      WHERE om.user_id = p.id
      AND om.role IN ('owner', 'editor')
    )
  LOOP
    -- Create organization name from email
    v_org_name := split_part(v_user.email, '@', 1) || '''s Team';

    -- Create organization for this user
    INSERT INTO organizations (name, created_by)
    VALUES (v_org_name, v_user.id)
    RETURNING id INTO v_new_org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_new_org_id, v_user.id, 'owner');

    v_fixed_count := v_fixed_count + 1;

    RAISE NOTICE 'Created organization "%" for user %', v_org_name, v_user.email;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed % user(s) who were stuck without their own organization', v_fixed_count;
  RAISE NOTICE '';
  IF v_fixed_count > 0 THEN
    RAISE NOTICE 'These users can now:';
    RAISE NOTICE '   ✅ Create their own projects';
    RAISE NOTICE '   ✅ Still view "Walking on the Sun" as viewers';
  ELSE
    RAISE NOTICE '✅ No users needed fixing - all users already have organizations!';
  END IF;
END $$;
