-- ============================================================================
-- DELETE TEST AND THIRD PROJECTS
-- Remove unwanted test projects that users are seeing
-- ============================================================================

-- Delete the "test" and "third" projects created by monty.sharma@gmail.com
-- This will cascade delete all related data (modules, assumptions, etc.)

DO $$
DECLARE
  v_user_id UUID;
  v_deleted_count INT := 0;
BEGIN
  -- Get monty.sharma@gmail.com user ID
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = 'monty.sharma@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User monty.sharma@gmail.com not found';
    RETURN;
  END IF;

  -- Delete projects with name 'test' or 'third' created by this user
  DELETE FROM projects
  WHERE created_by = v_user_id
  AND (LOWER(name) = 'test' OR LOWER(name) = 'third');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE '✅ Deleted % project(s) (test and/or third)', v_deleted_count;
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  All related data (modules, assumptions, interviews, etc.) has been cascade deleted';
END $$;
