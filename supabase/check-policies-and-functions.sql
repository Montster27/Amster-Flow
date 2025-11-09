-- Check what's actually in the database for admin functionality

-- 1. Count admin policies
SELECT
  'ADMIN POLICIES COUNT' as check_type,
  COUNT(*)::text as result
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%admin%';

-- 2. List all admin policies
SELECT
  'ADMIN POLICIES LIST' as check_type,
  tablename || ' → ' || policyname as result
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%admin%'
ORDER BY tablename;

-- 3. Check is_admin function exists
SELECT
  'IS_ADMIN FUNCTION' as check_type,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'is_admin'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as result;

-- 4. Check user_can_edit_project function exists
SELECT
  'USER_CAN_EDIT_PROJECT FUNCTION' as check_type,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'user_can_edit_project'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as result;

-- 5. Check is_admin column exists on profiles
SELECT
  'IS_ADMIN COLUMN ON PROFILES' as check_type,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as result;

-- 6. Show all policies on project_assumptions (should have admin policy)
SELECT
  'PROJECT_ASSUMPTIONS POLICIES' as check_type,
  policyname as result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'project_assumptions'
ORDER BY policyname;
