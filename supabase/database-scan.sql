-- ============================================================================
-- COMPREHENSIVE DATABASE SCAN
-- Shows current state of tables, policies, indexes, and functions
-- ============================================================================

-- ============================================================================
-- 1. LIST ALL TABLES
-- ============================================================================
SELECT
  '📊 TABLES' as category,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK CRITICAL TABLES EXISTENCE
-- ============================================================================
SELECT
  '✅ CRITICAL TABLES' as category,
  'notifications' as table_name,
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT
  '✅ CRITICAL TABLES',
  'project_module_completion',
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_module_completion')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT
  '✅ CRITICAL TABLES',
  'profiles',
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT
  '✅ CRITICAL TABLES',
  'organizations',
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT
  '✅ CRITICAL TABLES',
  'projects',
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END;

-- ============================================================================
-- 3. CHECK PROFILES TABLE STRUCTURE
-- ============================================================================
SELECT
  '👤 PROFILES COLUMNS' as category,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. LIST ALL RLS POLICIES
-- ============================================================================
SELECT
  '🔒 RLS POLICIES' as category,
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN policyname LIKE '%admin%' THEN '🔴 ADMIN'
    WHEN policyname LIKE '%owner%' THEN '👑 OWNER'
    WHEN policyname LIKE '%editor%' THEN '✏️ EDITOR'
    WHEN policyname LIKE '%viewer%' THEN '👁️ VIEWER'
    ELSE '📋 OTHER'
  END as role_level
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. COUNT POLICIES BY TABLE
-- ============================================================================
SELECT
  '📈 POLICY COUNTS' as category,
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE policyname LIKE '%admin%') as admin_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 6. LIST ALL INDEXES
-- ============================================================================
SELECT
  '⚡ INDEXES' as category,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. CHECK CRITICAL INDEXES
-- ============================================================================
SELECT
  '✅ CRITICAL INDEXES' as category,
  'idx_profiles_is_admin' as index_name,
  CASE
    WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_profiles_is_admin')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT
  '✅ CRITICAL INDEXES',
  'idx_profiles_email',
  CASE
    WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_profiles_email')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT
  '✅ CRITICAL INDEXES',
  'idx_org_members_role',
  CASE
    WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_org_members_role')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END;

-- ============================================================================
-- 8. LIST ALL FUNCTIONS
-- ============================================================================
SELECT
  '⚙️ FUNCTIONS' as category,
  routine_name as function_name,
  routine_type,
  CASE
    WHEN routine_name LIKE '%admin%' THEN '🔴 ADMIN'
    WHEN routine_name LIKE '%edit%' THEN '✏️ EDIT'
    WHEN routine_name LIKE '%organization%' THEN '🏢 ORG'
    ELSE '📋 OTHER'
  END as category_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================================================
-- 9. CHECK CRITICAL FUNCTIONS
-- ============================================================================
SELECT
  '✅ CRITICAL FUNCTIONS' as category,
  'is_admin' as function_name,
  CASE
    WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'is_admin')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT
  '✅ CRITICAL FUNCTIONS',
  'user_can_edit_project',
  CASE
    WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'user_can_edit_project')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT
  '✅ CRITICAL FUNCTIONS',
  'user_can_edit_project_check',
  CASE
    WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'user_can_edit_project_check')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END;

-- ============================================================================
-- 10. CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT
  '🔗 FOREIGN KEYS' as category,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.column_name LIKE '%created_by'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 11. CHECK NULLABLE COLUMNS
-- ============================================================================
SELECT
  '❓ NULLABLE CHECK' as category,
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('created_by', 'updated_by')
ORDER BY table_name, column_name;

-- ============================================================================
-- 12. SUMMARY STATISTICS
-- ============================================================================
SELECT
  '📊 SUMMARY' as category,
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
UNION ALL
SELECT
  '📊 SUMMARY',
  'Total Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  '📊 SUMMARY',
  'Admin Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%admin%'
UNION ALL
SELECT
  '📊 SUMMARY',
  'Total Indexes',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
UNION ALL
SELECT
  '📊 SUMMARY',
  'Total Functions',
  COUNT(*)::text
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- ============================================================================
-- 13. ADMIN USER CHECK
-- ============================================================================
SELECT
  '👤 ADMIN USERS' as category,
  email,
  is_admin,
  created_at
FROM profiles
WHERE is_admin = true
ORDER BY email;
