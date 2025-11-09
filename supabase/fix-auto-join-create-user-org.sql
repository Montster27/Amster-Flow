-- ============================================================================
-- FIX AUTO-JOIN TRIGGER - CREATE USER'S OWN ORGANIZATION TOO
-- Problem: New users are auto-joined to "Walking on the Sun" as viewers,
-- but no personal organization is created, so they can't create projects
-- ============================================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS auto_join_new_users_trigger ON profiles;

-- Enhanced function that creates BOTH user's own org AND joins Walking on the Sun
CREATE OR REPLACE FUNCTION auto_join_new_users_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_org_id UUID;
  v_user_org_id UUID;
  v_user_org_name TEXT;
BEGIN
  -- 1. Create user's OWN organization first
  v_user_org_name := COALESCE(
    split_part(NEW.email, '@', 1) || '''s Team',
    'My Team'
  );

  -- Check if user already has an organization they created
  SELECT id INTO v_user_org_id
  FROM organizations
  WHERE created_by = NEW.id
  LIMIT 1;

  -- If not, create one
  IF v_user_org_id IS NULL THEN
    INSERT INTO organizations (name, created_by)
    VALUES (v_user_org_name, NEW.id)
    RETURNING id INTO v_user_org_id;

    -- Add user as owner of their own org
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_user_org_id, NEW.id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Created organization "%" for user %', v_user_org_name, NEW.email;
  END IF;

  -- 2. Find and join "Walking on the Sun" project as viewer
  SELECT p.organization_id INTO v_target_org_id
  FROM projects p
  WHERE p.name ILIKE '%walking%sun%'
  LIMIT 1;

  -- Add user as viewer to Walking on the Sun org (if it exists)
  IF v_target_org_id IS NOT NULL THEN
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_target_org_id, NEW.id, 'viewer')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Auto-added user % as viewer to Walking on the Sun project', NEW.email;
  ELSE
    RAISE NOTICE 'Walking on the Sun project not found - skipping auto-join for user %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER auto_join_new_users_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_new_users_to_project();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Auto-join trigger fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 New users will now get:';
    RAISE NOTICE '   1️⃣  Their own organization (as OWNER) - can create projects';
    RAISE NOTICE '   2️⃣  Access to "Walking on the Sun" (as VIEWER) - can view shared demo';
    RAISE NOTICE '';
    RAISE NOTICE '💡 This fixes the bug where new users couldn''t create projects';
END $$;
