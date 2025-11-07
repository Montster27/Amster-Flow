-- ============================================================================
-- ADD ADMIN RLS POLICIES
-- Allow admin users to view all data across the entire system
-- ============================================================================

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Allow admins to view all organizations
CREATE POLICY "Admins can view all organizations"
  ON organizations FOR SELECT
  USING (is_admin());

-- ============================================================================
-- ORGANIZATION_MEMBERS TABLE
-- ============================================================================

-- Allow admins to view all organization members
CREATE POLICY "Admins can view all organization members"
  ON organization_members FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

-- Allow admins to view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_MODULES TABLE
-- ============================================================================

-- Allow admins to view all project modules
CREATE POLICY "Admins can view all project modules"
  ON project_modules FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_MODULE_COMPLETION TABLE
-- ============================================================================

-- Allow admins to view all project module completion
CREATE POLICY "Admins can view all project module completion"
  ON project_module_completion FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_ASSUMPTIONS TABLE
-- ============================================================================

-- Allow admins to view all project assumptions
CREATE POLICY "Admins can view all project assumptions"
  ON project_assumptions FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_INTERVIEWS TABLE
-- ============================================================================

-- Allow admins to view all project interviews
CREATE POLICY "Admins can view all project interviews"
  ON project_interviews FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_ITERATIONS TABLE
-- ============================================================================

-- Allow admins to view all project iterations
CREATE POLICY "Admins can view all project iterations"
  ON project_iterations FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_COMPETITORS TABLE
-- ============================================================================

-- Allow admins to view all project competitors
CREATE POLICY "Admins can view all project competitors"
  ON project_competitors FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_DECISION_MAKERS TABLE
-- ============================================================================

-- Allow admins to view all project decision makers
CREATE POLICY "Admins can view all project decision makers"
  ON project_decision_makers FOR SELECT
  USING (is_admin());

-- ============================================================================
-- PROJECT_FIRST_TARGET TABLE
-- ============================================================================

-- Allow admins to view all project first targets
CREATE POLICY "Admins can view all project first targets"
  ON project_first_target FOR SELECT
  USING (is_admin());

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin RLS policies added successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Admins can now view:';
    RAISE NOTICE '   - All user profiles';
    RAISE NOTICE '   - All organizations and memberships';
    RAISE NOTICE '   - All projects and their data';
    RAISE NOTICE '   - All discovery data (assumptions, interviews, iterations)';
    RAISE NOTICE '   - All sector map data (competitors, decision makers, targets)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: Admin policies are SELECT-only (read-only access)';
END $$;
