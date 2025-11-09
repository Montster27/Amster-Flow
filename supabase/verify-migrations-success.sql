-- ============================================================================
-- VERIFY MIGRATIONS WORKED
-- Check that the auto-join trigger and user fixes are in place
-- ============================================================================

-- 1. Check the auto-join trigger exists
SELECT
  'AUTO-JOIN TRIGGER' as check_type,
  CASE
    WHEN EXISTS (
      SELECT FROM pg_trigger
      WHERE tgname = 'auto_join_new_users_trigger'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 2. Check all users have at least one organization where they're owner/editor
SELECT
  'USERS WITH EDITABLE ORGS' as check_type,
  COUNT(DISTINCT p.id)::text || ' users' as status
FROM profiles p
WHERE p.is_admin = false
AND EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = p.id
  AND om.role IN ('owner', 'editor')
);

-- 3. Check for users stuck as only viewers
SELECT
  'STUCK USERS (VIEWERS ONLY)' as check_type,
  COUNT(*)::text || ' users' as status
FROM profiles p
WHERE p.is_admin = false
AND NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = p.id
  AND om.role IN ('owner', 'editor')
);

-- 4. Show all users and their organization roles
SELECT
  '📊 USER ORGANIZATION SUMMARY' as section,
  p.email,
  o.name as organization,
  om.role,
  CASE
    WHEN om.role IN ('owner', 'editor') THEN '✅ Can create projects'
    ELSE '👁️ View only'
  END as permissions
FROM profiles p
LEFT JOIN organization_members om ON p.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE p.is_admin = false
ORDER BY p.email, om.role DESC;

-- 5. Count organizations per user
SELECT
  'ORGS PER USER' as check_type,
  p.email,
  COUNT(om.organization_id)::text || ' orgs' as org_count,
  STRING_AGG(om.role, ', ' ORDER BY om.role) as roles
FROM profiles p
LEFT JOIN organization_members om ON p.id = om.user_id
WHERE p.is_admin = false
GROUP BY p.email
ORDER BY p.email;
