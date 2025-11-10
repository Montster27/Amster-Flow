-- ============================================================================
-- FIX NOTIFICATIONS TABLE SECURITY
-- Restricts who can insert notifications to prevent abuse
-- ============================================================================
--
-- PROBLEM: The current INSERT policy allows anyone to insert notifications:
--   WITH CHECK (true)  -- ⚠️ ANYONE can insert!
--
-- RISK: Any authenticated user could spam notifications to any other user
--
-- SOLUTION: Restrict INSERT to:
--   1. Admins (via is_admin() function)
--   2. System/SECURITY DEFINER functions only
-- ============================================================================

-- First, check if notifications table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  notifications table does not exist';
    RAISE NOTICE 'This script can only run if the notifications table exists.';
    RAISE NOTICE 'Run add-notifications-table.sql first if needed.';
    RAISE NOTICE '';
    RETURN;
  END IF;

  RAISE NOTICE 'notifications table found - proceeding with security fix...';
END $$;

-- ============================================================================
-- FIX: Replace overly permissive INSERT policy
-- ============================================================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create secure policy - only admins can insert directly
-- SECURITY DEFINER functions bypass RLS so they can still insert
CREATE POLICY "Only admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    -- Only admins can insert notifications directly
    -- SECURITY DEFINER functions (like invite_user_to_organization) bypass RLS
    is_admin()
  );

-- ============================================================================
-- VERIFY: Ensure is_admin() function exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'is_admin() function not found! Cannot apply secure policy.';
  END IF;

  RAISE NOTICE '✅ is_admin() function exists';
END $$;

-- ============================================================================
-- VERIFY: Check that invite function is SECURITY DEFINER
-- ============================================================================

DO $$
DECLARE
  v_is_security_definer BOOLEAN;
BEGIN
  SELECT prosecdef INTO v_is_security_definer
  FROM pg_proc
  WHERE proname = 'invite_user_to_organization'
  AND pronamespace = 'public'::regnamespace
  LIMIT 1;

  IF v_is_security_definer IS NULL THEN
    RAISE NOTICE '⚠️  invite_user_to_organization function not found';
  ELSIF v_is_security_definer THEN
    RAISE NOTICE '✅ invite_user_to_organization is SECURITY DEFINER (can bypass RLS)';
  ELSE
    RAISE WARNING '⚠️  invite_user_to_organization is NOT SECURITY DEFINER - notifications may fail!';
    RAISE NOTICE 'Consider making it SECURITY DEFINER with:';
    RAISE NOTICE 'CREATE OR REPLACE FUNCTION invite_user_to_organization(...) ... SECURITY DEFINER';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ NOTIFICATIONS SECURITY FIX COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Policy updated:';
  RAISE NOTICE '  • Removed: WITH CHECK (true)  [insecure]';
  RAISE NOTICE '  • Added: WITH CHECK (is_admin())  [secure]';
  RAISE NOTICE '';
  RAISE NOTICE 'How notifications work now:';
  RAISE NOTICE '  ✅ Admins can insert notifications directly';
  RAISE NOTICE '  ✅ SECURITY DEFINER functions bypass RLS (invite_user_to_organization, etc.)';
  RAISE NOTICE '  ❌ Regular users cannot spam notifications';
  RAISE NOTICE '';
  RAISE NOTICE '💡 SECURITY DEFINER functions that insert notifications:';
  RAISE NOTICE '   • invite_user_to_organization()';
  RAISE NOTICE '   • notify_org_members_new_project() (trigger function)';
  RAISE NOTICE '';
END $$;
