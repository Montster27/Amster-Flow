-- ============================================================================
-- FIX CRITICAL DATABASE ISSUES
-- Combined migration for:
-- 1. Function Consolidation
-- 2. Admin Policies
-- 3. Performance Indexes
-- 4. Foreign Key Safety (SET NULL)
-- 5. Notification Security
-- ============================================================================

-- 1. CONSOLIDATE FUNCTIONS
-- ============================================================================

-- Enhance the function with admin bypass (CREATE OR REPLACE = no downtime)
CREATE OR REPLACE FUNCTION user_can_edit_project(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    -- Admins can edit everything
    is_admin()
    OR
    -- Editors and owners can edit
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_uuid
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );
END;
$$;

-- Keep the _check alias for backward compatibility
CREATE OR REPLACE FUNCTION user_can_edit_project_check(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_can_edit_project(project_uuid);
END;
$$;

-- 2. ADD MISSING ADMIN POLICIES
-- ============================================================================

-- Project Assumptions
DROP POLICY IF EXISTS "Admins can view all project assumptions" ON project_assumptions;
CREATE POLICY "Admins can view all project assumptions"
  ON project_assumptions FOR SELECT
  USING (is_admin());

-- Project Interviews
DROP POLICY IF EXISTS "Admins can view all project interviews" ON project_interviews;
CREATE POLICY "Admins can view all project interviews"
  ON project_interviews FOR SELECT
  USING (is_admin());

-- Project Iterations
DROP POLICY IF EXISTS "Admins can view all project iterations" ON project_iterations;
CREATE POLICY "Admins can view all project iterations"
  ON project_iterations FOR SELECT
  USING (is_admin());

-- Project Competitors
DROP POLICY IF EXISTS "Admins can view all project competitors" ON project_competitors;
CREATE POLICY "Admins can view all project competitors"
  ON project_competitors FOR SELECT
  USING (is_admin());

-- Project Decision Makers
DROP POLICY IF EXISTS "Admins can view all project decision makers" ON project_decision_makers;
CREATE POLICY "Admins can view all project decision makers"
  ON project_decision_makers FOR SELECT
  USING (is_admin());

-- Project First Target
DROP POLICY IF EXISTS "Admins can view all project first targets" ON project_first_target;
CREATE POLICY "Admins can view all project first targets"
  ON project_first_target FOR SELECT
  USING (is_admin());

-- 3. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
  ON profiles(is_admin)
  WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_org_members_role
  ON organization_members(role);

-- 4. FOREIGN KEY SAFETY (SET NULL)
-- ============================================================================

-- Make columns nullable first
ALTER TABLE organizations ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE project_assumptions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE project_interviews ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE project_iterations ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE project_competitors ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE project_decision_makers ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE project_modules ALTER COLUMN updated_by DROP NOT NULL;
ALTER TABLE project_first_target ALTER COLUMN updated_by DROP NOT NULL;

-- Update constraints
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_created_by_fkey,
  ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey,
  ADD CONSTRAINT projects_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_modules
  DROP CONSTRAINT IF EXISTS project_modules_updated_by_fkey,
  ADD CONSTRAINT project_modules_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_assumptions
  DROP CONSTRAINT IF EXISTS project_assumptions_created_by_fkey,
  ADD CONSTRAINT project_assumptions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_interviews
  DROP CONSTRAINT IF EXISTS project_interviews_created_by_fkey,
  ADD CONSTRAINT project_interviews_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_iterations
  DROP CONSTRAINT IF EXISTS project_iterations_created_by_fkey,
  ADD CONSTRAINT project_iterations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_competitors
  DROP CONSTRAINT IF EXISTS project_competitors_created_by_fkey,
  ADD CONSTRAINT project_competitors_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_decision_makers
  DROP CONSTRAINT IF EXISTS project_decision_makers_created_by_fkey,
  ADD CONSTRAINT project_decision_makers_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE project_first_target
  DROP CONSTRAINT IF EXISTS project_first_target_updated_by_fkey,
  ADD CONSTRAINT project_first_target_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5. NOTIFICATION SECURITY
-- ============================================================================

-- Only update if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    -- Drop the insecure policy
    DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
    
    -- Create secure policy
    CREATE POLICY "System can insert notifications"
      ON notifications FOR INSERT
      WITH CHECK (
        -- Only service role or admins can insert
        (current_setting('role', true) = 'service_role')
        OR
        is_admin()
      );
      
    RAISE NOTICE '✅ Secured notifications table';
  ELSE
    RAISE NOTICE '⚠️ Notifications table does not exist - skipping security fix';
  END IF;
END $$;

-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_admin_policies INT;
  v_indexes INT;
BEGIN
  SELECT COUNT(*) INTO v_admin_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND policyname LIKE '%admin%';

  SELECT COUNT(*) INTO v_indexes
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '   - Admin Policies: %', v_admin_policies;
  RAISE NOTICE '   - Indexes: %', v_indexes;
  RAISE NOTICE '';
END $$;
