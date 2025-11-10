-- ============================================================================
-- COMPREHENSIVE DATABASE STATE VERIFICATION
-- Run this in Supabase Dashboard → SQL Editor to check actual database state
-- ============================================================================

-- ============================================================================
-- 1. CHECK ALL TABLES
-- ============================================================================
SELECT
  '📊 TABLES' as category,
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns c
   WHERE c.table_schema = 'public'
   AND c.table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size,
  (SELECT COUNT(*) FROM information_schema.table_constraints tc
   WHERE tc.table_schema = 'public'
   AND tc.table_name = t.table_name
   AND tc.constraint_type = 'FOREIGN KEY') as fk_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK CRITICAL COLUMNS (is_admin, created_by nullability)
-- ============================================================================
SELECT
  '👤 PROFILES STRUCTURE' as category,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK created_by COLUMN NULLABILITY (CRITICAL!)
-- ============================================================================
SELECT
  '⚠️ NULLABLE created_by CHECK' as category,
  table_name,
  column_name,
  is_nullable,
  CASE
    WHEN is_nullable = 'YES' THEN '✅ Can use ON DELETE SET NULL'
    ELSE '❌ NOT NULL - conflicts with ON DELETE SET NULL!'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'created_by'
ORDER BY table_name;

-- ============================================================================
-- 4. CHECK FOREIGN KEY DELETE RULES
-- ============================================================================
SELECT
  '🔗 FK DELETE RULES' as category,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule,
  CASE
    WHEN rc.delete_rule = 'SET NULL' AND c.is_nullable = 'NO'
    THEN '❌ CONFLICT: SET NULL on NOT NULL column!'
    WHEN rc.delete_rule = 'SET NULL' AND c.is_nullable = 'YES'
    THEN '✅ OK: SET NULL allowed'
    WHEN rc.delete_rule = 'CASCADE'
    THEN '✅ OK: CASCADE will delete rows'
    ELSE '✅ OK: ' || rc.delete_rule
  END as validation
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.columns c
  ON c.table_schema = tc.table_schema
  AND c.table_name = tc.table_name
  AND c.column_name = kcu.column_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.column_name IN ('created_by', 'updated_by')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 5. CHECK CRITICAL FUNCTIONS EXIST
-- ============================================================================
SELECT
  '⚙️ CRITICAL FUNCTIONS' as category,
  routine_name as function_name,
  CASE
    WHEN routine_name = 'is_admin' THEN '🔴 ADMIN FUNCTION'
    WHEN routine_name = 'user_can_edit_project' THEN '✏️ EDIT CHECK'
    WHEN routine_name = 'user_can_access_project' THEN '👁️ ACCESS CHECK'
    WHEN routine_name = 'auto_join_new_users_to_project' THEN '🎯 AUTO-JOIN'
    ELSE '📋 OTHER'
  END as type,
  'EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'is_admin',
  'user_can_edit_project',
  'user_can_edit_project_check',
  'user_can_access_project',
  'auto_join_new_users_to_project',
  'invite_user_to_organization'
)
ORDER BY routine_name;

-- Check for missing critical functions
SELECT
  '❌ MISSING FUNCTIONS' as category,
  func_name as function_name,
  'MISSING!' as status
FROM (
  VALUES
    ('is_admin'),
    ('user_can_edit_project'),
    ('user_can_access_project'),
    ('auto_join_new_users_to_project')
) AS expected(func_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = func_name
);

-- ============================================================================
-- 6. CHECK TRIGGERS
-- ============================================================================
SELECT
  '⚡ TRIGGERS' as category,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. CHECK RLS POLICIES
-- ============================================================================
SELECT
  '🔒 RLS POLICY COUNT' as category,
  tablename,
  COUNT(*) as total_policies,
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
-- 8. CHECK DATA INTEGRITY
-- ============================================================================

-- Check for orphaned data (null created_by)
SELECT
  '🔍 ORPHANED DATA CHECK' as category,
  'organizations' as table_name,
  COUNT(*) as null_created_by_count
FROM organizations
WHERE created_by IS NULL
UNION ALL
SELECT
  '🔍 ORPHANED DATA CHECK',
  'projects',
  COUNT(*)
FROM projects
WHERE created_by IS NULL
UNION ALL
SELECT
  '🔍 ORPHANED DATA CHECK',
  'project_modules',
  COUNT(*)
FROM project_modules
WHERE updated_by IS NULL;

-- Check for users stuck as viewers
SELECT
  '👥 USER ROLES CHECK' as category,
  'users stuck as viewers only' as issue,
  COUNT(DISTINCT p.id)::text as count
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = p.id
  AND om.role IN ('owner', 'editor')
)
AND COALESCE(p.is_admin, false) = false;

-- Check for duplicate org memberships
SELECT
  '🚨 DUPLICATE CHECK' as category,
  'duplicate org memberships' as issue,
  COUNT(*)::text as count
FROM (
  SELECT organization_id, user_id
  FROM organization_members
  GROUP BY organization_id, user_id
  HAVING COUNT(*) > 1
) dupes;

-- ============================================================================
-- 9. ROW COUNTS
-- ============================================================================
SELECT
  '📊 ROW COUNTS' as category,
  'profiles' as table_name,
  COUNT(*)::text as count
FROM profiles
UNION ALL
SELECT '📊 ROW COUNTS', 'organizations', COUNT(*)::text FROM organizations
UNION ALL
SELECT '📊 ROW COUNTS', 'organization_members', COUNT(*)::text FROM organization_members
UNION ALL
SELECT '📊 ROW COUNTS', 'projects', COUNT(*)::text FROM projects
UNION ALL
SELECT '📊 ROW COUNTS', 'project_modules', COUNT(*)::text FROM project_modules
UNION ALL
SELECT '📊 ROW COUNTS', 'project_assumptions', COUNT(*)::text FROM project_assumptions
UNION ALL
SELECT '📊 ROW COUNTS', 'project_interviews', COUNT(*)::text FROM project_interviews
UNION ALL
SELECT '📊 ROW COUNTS', 'notifications', COUNT(*)::text FROM notifications WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
UNION ALL
SELECT '📊 ROW COUNTS', 'project_module_completion', COUNT(*)::text FROM project_module_completion WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_module_completion');

-- ============================================================================
-- 10. ADMIN USERS
-- ============================================================================
SELECT
  '🔑 ADMIN USERS' as category,
  email,
  COALESCE(is_admin, false) as is_admin,
  created_at
FROM profiles
WHERE COALESCE(is_admin, false) = true
ORDER BY email;

-- ============================================================================
-- 11. USER ORGANIZATION SUMMARY
-- ============================================================================
SELECT
  '👥 USER ORG ROLES' as category,
  p.email,
  o.name as organization,
  om.role,
  CASE
    WHEN om.role IN ('owner', 'editor') THEN '✅ Can create projects'
    WHEN om.role = 'viewer' THEN '👁️ View only'
    ELSE '❓ Unknown'
  END as permissions
FROM profiles p
LEFT JOIN organization_members om ON p.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE COALESCE(p.is_admin, false) = false
ORDER BY p.email, om.role DESC;

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT
  '✅ VERIFICATION COMPLETE' as status,
  'Review results above for any issues' as message;
