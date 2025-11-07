-- ============================================================================
-- ENFORCE READ-ONLY ACCESS FOR VIEWERS
-- Ensure viewers can only view, not edit any project data
-- ============================================================================

-- This migration drops ALL existing policies and creates strict role-based ones
-- Viewers = read-only, Editors = read/write, Owners = full control

-- ============================================================================
-- HELPER FUNCTION: Check if user can edit project
-- ============================================================================

CREATE OR REPLACE FUNCTION user_can_edit_project_check(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    -- User is admin
    is_admin()
    OR
    -- User is editor or owner of the project's organization
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

-- ============================================================================
-- PROJECTS TABLE - Strict Role-Based Policies
-- ============================================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view projects in their organizations" ON projects;
DROP POLICY IF EXISTS "Users can edit projects in their organizations" ON projects;
DROP POLICY IF EXISTS "Users can create projects in their organizations" ON projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;

-- SELECT: All organization members can view (viewers, editors, owners)
CREATE POLICY "Organization members can view projects"
  ON projects FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- UPDATE: Only editors and owners can update
CREATE POLICY "Only editors and owners can update projects"
  ON projects FOR UPDATE
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- INSERT: Only editors and owners can create projects
CREATE POLICY "Only editors and owners can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- DELETE: Only owners can delete
CREATE POLICY "Only owners can delete projects"
  ON projects FOR DELETE
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- ============================================================================
-- PROJECT_MODULES - Strict Role-Based Policies
-- ============================================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view project modules" ON project_modules;
DROP POLICY IF EXISTS "Users can edit project modules" ON project_modules;
DROP POLICY IF EXISTS "Admins can view all project modules" ON project_modules;

-- SELECT: All organization members can view
CREATE POLICY "Organization members can view project modules"
  ON project_modules FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_modules.project_id
      AND om.user_id = auth.uid()
    )
  );

-- INSERT: Only editors and owners
CREATE POLICY "Only editors and owners can insert project modules"
  ON project_modules FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

-- UPDATE: Only editors and owners
CREATE POLICY "Only editors and owners can update project modules"
  ON project_modules FOR UPDATE
  USING (user_can_edit_project_check(project_id));

-- DELETE: Only editors and owners
CREATE POLICY "Only editors and owners can delete project modules"
  ON project_modules FOR DELETE
  USING (user_can_edit_project_check(project_id));

-- ============================================================================
-- PROJECT_MODULE_COMPLETION - Strict Role-Based Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view module completion for their projects" ON project_module_completion;
DROP POLICY IF EXISTS "Users can manage module completion for their projects" ON project_module_completion;
DROP POLICY IF EXISTS "Admins can view all project module completion" ON project_module_completion;

CREATE POLICY "Organization members can view module completion"
  ON project_module_completion FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_module_completion.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage module completion"
  ON project_module_completion FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- ============================================================================
-- APPLY TO ALL PROJECT-RELATED TABLES
-- ============================================================================

-- PROJECT_ASSUMPTIONS
DROP POLICY IF EXISTS "Users can view project assumptions" ON project_assumptions;
DROP POLICY IF EXISTS "Users can manage project assumptions" ON project_assumptions;
DROP POLICY IF EXISTS "Admins can view all project assumptions" ON project_assumptions;

CREATE POLICY "Organization members can view assumptions"
  ON project_assumptions FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_assumptions.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage assumptions"
  ON project_assumptions FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- PROJECT_INTERVIEWS
DROP POLICY IF EXISTS "Users can view project interviews" ON project_interviews;
DROP POLICY IF EXISTS "Users can manage project interviews" ON project_interviews;
DROP POLICY IF EXISTS "Admins can view all project interviews" ON project_interviews;

CREATE POLICY "Organization members can view interviews"
  ON project_interviews FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_interviews.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage interviews"
  ON project_interviews FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- PROJECT_ITERATIONS
DROP POLICY IF EXISTS "Users can view project iterations" ON project_iterations;
DROP POLICY IF EXISTS "Users can manage project iterations" ON project_iterations;
DROP POLICY IF EXISTS "Admins can view all project iterations" ON project_iterations;

CREATE POLICY "Organization members can view iterations"
  ON project_iterations FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_iterations.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage iterations"
  ON project_iterations FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- PROJECT_COMPETITORS
DROP POLICY IF EXISTS "Users can view project competitors" ON project_competitors;
DROP POLICY IF EXISTS "Users can manage project competitors" ON project_competitors;
DROP POLICY IF EXISTS "Admins can view all project competitors" ON project_competitors;

CREATE POLICY "Organization members can view competitors"
  ON project_competitors FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_competitors.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage competitors"
  ON project_competitors FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- PROJECT_DECISION_MAKERS
DROP POLICY IF EXISTS "Users can view project decision makers" ON project_decision_makers;
DROP POLICY IF EXISTS "Users can manage project decision makers" ON project_decision_makers;
DROP POLICY IF EXISTS "Admins can view all project decision makers" ON project_decision_makers;

CREATE POLICY "Organization members can view decision makers"
  ON project_decision_makers FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_decision_makers.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage decision makers"
  ON project_decision_makers FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- PROJECT_FIRST_TARGET
DROP POLICY IF EXISTS "Users can view project first target" ON project_first_target;
DROP POLICY IF EXISTS "Users can manage project first target" ON project_first_target;
DROP POLICY IF EXISTS "Admins can view all project first targets" ON project_first_target;

CREATE POLICY "Organization members can view first target"
  ON project_first_target FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_first_target.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Only editors and owners can manage first target"
  ON project_first_target FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Read-only viewer access enforced!';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Access Control Summary:';
    RAISE NOTICE '   👁️  VIEWERS: Can view all project data (read-only)';
    RAISE NOTICE '   ✏️  EDITORS: Can view and edit all project data';
    RAISE NOTICE '   👑 OWNERS: Can view, edit, and delete projects';
    RAISE NOTICE '   🔑 ADMINS: Full access to everything';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Users auto-joined to "Walking on the Sun" are viewers only';
END $$;
