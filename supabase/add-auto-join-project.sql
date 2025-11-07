-- ============================================================================
-- AUTO-JOIN NEW USERS TO "WALKING ON THE SUN" PROJECT
-- Automatically add new users as viewers to a specific project's organization
-- ============================================================================

-- First, find the "Walking on the Sun" project and its organization
-- You'll need to replace 'YOUR_ORGANIZATION_ID' with the actual ID

-- To find your organization ID, run this query:
-- SELECT p.id as project_id, p.name as project_name, p.organization_id, o.name as org_name
-- FROM projects p
-- JOIN organizations o ON p.organization_id = o.id
-- WHERE p.name ILIKE '%walking%sun%';

-- ============================================================================
-- CREATE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_join_new_users_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_org_id UUID;
  v_project_exists BOOLEAN;
BEGIN
  -- Find the organization ID for "Walking on the Sun" project
  -- This dynamically finds it so you don't need to hardcode
  SELECT p.organization_id INTO v_target_org_id
  FROM projects p
  WHERE p.name ILIKE '%walking%sun%'
  LIMIT 1;

  -- Check if the project was found
  IF v_target_org_id IS NULL THEN
    -- Project not found, just return without adding user
    RAISE NOTICE 'Walking on the Sun project not found - skipping auto-join for user %', NEW.email;
    RETURN NEW;
  END IF;

  -- Add the new user to the organization as a viewer
  -- Use INSERT ... ON CONFLICT to avoid errors if already added
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_target_org_id, NEW.id, 'viewer')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RAISE NOTICE 'Auto-added user % as viewer to Walking on the Sun project', NEW.email;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS auto_join_new_users_trigger ON profiles;

-- Create trigger that fires AFTER a new profile is inserted
CREATE TRIGGER auto_join_new_users_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_new_users_to_project();

-- ============================================================================
-- OPTIONAL: BACKFILL EXISTING USERS
-- Uncomment the section below if you want to add existing users too
-- ============================================================================

/*
DO $$
DECLARE
  v_target_org_id UUID;
  v_added_count INT := 0;
BEGIN
  -- Find the organization ID for "Walking on the Sun" project
  SELECT p.organization_id INTO v_target_org_id
  FROM projects p
  WHERE p.name ILIKE '%walking%sun%'
  LIMIT 1;

  IF v_target_org_id IS NOT NULL THEN
    -- Add all existing users who aren't already members
    INSERT INTO public.organization_members (organization_id, user_id, role)
    SELECT v_target_org_id, p.id, 'viewer'
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = v_target_org_id
      AND om.user_id = p.id
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    GET DIAGNOSTICS v_added_count = ROW_COUNT;
    RAISE NOTICE 'Added % existing users to Walking on the Sun project', v_added_count;
  ELSE
    RAISE NOTICE 'Walking on the Sun project not found';
  END IF;
END $$;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Auto-join trigger created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 All new users will automatically be added as viewers to:';
    RAISE NOTICE '   "Walking on the Sun" project';
    RAISE NOTICE '';
    RAISE NOTICE '💡 To add existing users too, uncomment the BACKFILL section and run again';
END $$;
