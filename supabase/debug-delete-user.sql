-- ============================================================================
-- DEBUG: Identify what's blocking user deletion
-- Run each section separately to identify the issue
-- ============================================================================

-- ============================================================================
-- STEP 1: List ALL foreign keys referencing auth.users
-- ============================================================================
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
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
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth';

-- ============================================================================
-- STEP 2: List ALL foreign keys referencing profiles
-- ============================================================================
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
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
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'profiles'
  AND ccu.table_schema = 'public';

-- ============================================================================
-- STEP 3: Check for NOT NULL columns with SET NULL delete rules
-- These will cause failures!
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  rc.delete_rule,
  c.is_nullable,
  CASE
    WHEN rc.delete_rule = 'SET NULL' AND c.is_nullable = 'NO'
    THEN '❌ CONFLICT: NOT NULL with SET NULL'
    ELSE '✅ OK'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
JOIN information_schema.columns AS c
  ON c.table_name = tc.table_name
  AND c.column_name = kcu.column_name
  AND c.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- ============================================================================
-- STEP 4: Check triggers on organization_members
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'organization_members';

-- ============================================================================
-- STEP 5: Test manual deletion (replace USER_ID_HERE with actual UUID)
-- Run these one at a time to find where it fails
-- ============================================================================

-- First, check what data exists for the user
-- SELECT * FROM organization_members WHERE user_id = 'USER_ID_HERE';
-- SELECT * FROM profiles WHERE id = 'USER_ID_HERE';
-- SELECT * FROM audit_log WHERE user_id = 'USER_ID_HERE' OR target_user_id = 'USER_ID_HERE';

-- Try deleting organization_members first (to avoid trigger issues)
-- DELETE FROM organization_members WHERE user_id = 'USER_ID_HERE';

-- Then try deleting the profile
-- DELETE FROM profiles WHERE id = 'USER_ID_HERE';

-- Then the auth.users entry should be orphaned and deletable
