-- ============================================================================
-- QUICK DATABASE STATUS CHECK
-- Shows what the migration fixed and what's still missing
-- ============================================================================

DO $$
DECLARE
  v_tables_count INT;
  v_admin_policies INT;
  v_total_policies INT;
  v_indexes INT;
  v_functions INT;
  v_notifications_exists BOOLEAN;
  v_module_completion_exists BOOLEAN;
  v_is_admin_function_exists BOOLEAN;
  v_user_can_edit_function_exists BOOLEAN;
  v_idx_is_admin_exists BOOLEAN;
  v_idx_email_exists BOOLEAN;
  v_idx_role_exists BOOLEAN;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

  -- Count policies
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  SELECT COUNT(*) INTO v_admin_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname LIKE '%admin%';

  -- Count indexes
  SELECT COUNT(*) INTO v_indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  -- Count functions
  SELECT COUNT(*) INTO v_functions
  FROM information_schema.routines
  WHERE routine_schema = 'public';

  -- Check critical tables
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO v_notifications_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_module_completion'
  ) INTO v_module_completion_exists;

  -- Check critical functions
  SELECT EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'is_admin'
  ) INTO v_is_admin_function_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'user_can_edit_project'
  ) INTO v_user_can_edit_function_exists;

  -- Check critical indexes
  SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_profiles_is_admin'
  ) INTO v_idx_is_admin_exists;

  SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_profiles_email'
  ) INTO v_idx_email_exists;

  SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_org_members_role'
  ) INTO v_idx_role_exists;

  -- Display results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE STATUS CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 OVERALL STATISTICS:';
  RAISE NOTICE '   Total Tables: %', v_tables_count;
  RAISE NOTICE '   Total RLS Policies: %', v_total_policies;
  RAISE NOTICE '   Admin Policies: %', v_admin_policies;
  RAISE NOTICE '   Performance Indexes: %', v_indexes;
  RAISE NOTICE '   Database Functions: %', v_functions;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 CRITICAL TABLES:';
  IF v_notifications_exists THEN
    RAISE NOTICE '   ✅ notifications table EXISTS';
  ELSE
    RAISE NOTICE '   ❌ notifications table MISSING';
  END IF;
  IF v_module_completion_exists THEN
    RAISE NOTICE '   ✅ project_module_completion table EXISTS';
  ELSE
    RAISE NOTICE '   ❌ project_module_completion table MISSING';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ CRITICAL FUNCTIONS:';
  IF v_is_admin_function_exists THEN
    RAISE NOTICE '   ✅ is_admin() function EXISTS';
  ELSE
    RAISE NOTICE '   ❌ is_admin() function MISSING';
  END IF;
  IF v_user_can_edit_function_exists THEN
    RAISE NOTICE '   ✅ user_can_edit_project() function EXISTS';
  ELSE
    RAISE NOTICE '   ❌ user_can_edit_project() function MISSING';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '⚡ PERFORMANCE INDEXES:';
  IF v_idx_is_admin_exists THEN
    RAISE NOTICE '   ✅ idx_profiles_is_admin EXISTS';
  ELSE
    RAISE NOTICE '   ❌ idx_profiles_is_admin MISSING';
  END IF;
  IF v_idx_email_exists THEN
    RAISE NOTICE '   ✅ idx_profiles_email EXISTS';
  ELSE
    RAISE NOTICE '   ❌ idx_profiles_email MISSING';
  END IF;
  IF v_idx_role_exists THEN
    RAISE NOTICE '   ✅ idx_org_members_role EXISTS';
  ELSE
    RAISE NOTICE '   ❌ idx_org_members_role MISSING';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  -- Show admin policies by table
  IF v_admin_policies > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 ADMIN POLICIES BY TABLE:';
  END IF;
END $$;

-- Show which tables have admin policies
SELECT
  tablename,
  COUNT(*) as admin_policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%admin%'
GROUP BY tablename
ORDER BY tablename;
