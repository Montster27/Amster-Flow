-- ============================================================================
-- FIX PROJECT VISIBILITY - RESTRICT TO ORGANIZATION MEMBERS ONLY
-- Ensures users can only see projects from organizations they belong to
-- ============================================================================

-- ============================================================================
-- PROJECTS TABLE - Fix RLS Policies
-- ============================================================================

-- First, drop any overly permissive policies
DROP POLICY IF EXISTS "Users can view projects in their organizations" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;

-- Create strict policy: users can only view projects from their organizations
CREATE POLICY "Users can view projects in their organizations"
  ON projects FOR SELECT
  USING (
    -- User is admin (can see all projects)
    is_admin()
    OR
    -- User is a member of the organization that owns this project
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Users can only edit projects in their organizations (editors and owners)
DROP POLICY IF EXISTS "Users can edit projects in their organizations" ON projects;

CREATE POLICY "Users can edit projects in their organizations"
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

-- Users can only insert projects in their organizations (editors and owners)
DROP POLICY IF EXISTS "Users can create projects in their organizations" ON projects;

CREATE POLICY "Users can create projects in their organizations"
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

-- Only owners can delete projects
DROP POLICY IF EXISTS "Owners can delete projects" ON projects;

CREATE POLICY "Owners can delete projects"
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
-- PROJECT_MODULES TABLE - Fix RLS Policies
-- ============================================================================

-- Users can view project modules only from their organizations
DROP POLICY IF EXISTS "Users can view project modules" ON project_modules;

CREATE POLICY "Users can view project modules"
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

-- Users can edit project modules only if they're editors/owners
DROP POLICY IF EXISTS "Users can edit project modules" ON project_modules;

CREATE POLICY "Users can edit project modules"
  ON project_modules FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_modules.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- ============================================================================
-- PROJECT_MODULE_COMPLETION TABLE - Fix RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view module completion for their projects" ON project_module_completion;

CREATE POLICY "Users can view module completion for their projects"
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

DROP POLICY IF EXISTS "Users can manage module completion for their projects" ON project_module_completion;

CREATE POLICY "Users can manage module completion for their projects"
  ON project_module_completion FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_module_completion.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- ============================================================================
-- APPLY SAME LOGIC TO ALL PROJECT-RELATED TABLES
-- ============================================================================

-- Project Assumptions
DROP POLICY IF EXISTS "Users can view project assumptions" ON project_assumptions;
CREATE POLICY "Users can view project assumptions"
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

DROP POLICY IF EXISTS "Users can manage project assumptions" ON project_assumptions;
CREATE POLICY "Users can manage project assumptions"
  ON project_assumptions FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_assumptions.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- Project Interviews
DROP POLICY IF EXISTS "Users can view project interviews" ON project_interviews;
CREATE POLICY "Users can view project interviews"
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

DROP POLICY IF EXISTS "Users can manage project interviews" ON project_interviews;
CREATE POLICY "Users can manage project interviews"
  ON project_interviews FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_interviews.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- Project Iterations
DROP POLICY IF EXISTS "Users can view project iterations" ON project_iterations;
CREATE POLICY "Users can view project iterations"
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

DROP POLICY IF EXISTS "Users can manage project iterations" ON project_iterations;
CREATE POLICY "Users can manage project iterations"
  ON project_iterations FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_iterations.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- Project Competitors
DROP POLICY IF EXISTS "Users can view project competitors" ON project_competitors;
CREATE POLICY "Users can view project competitors"
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

DROP POLICY IF EXISTS "Users can manage project competitors" ON project_competitors;
CREATE POLICY "Users can manage project competitors"
  ON project_competitors FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_competitors.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- Project Decision Makers
DROP POLICY IF EXISTS "Users can view project decision makers" ON project_decision_makers;
CREATE POLICY "Users can view project decision makers"
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

DROP POLICY IF EXISTS "Users can manage project decision makers" ON project_decision_makers;
CREATE POLICY "Users can manage project decision makers"
  ON project_decision_makers FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_decision_makers.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- Project First Target
DROP POLICY IF EXISTS "Users can view project first target" ON project_first_target;
CREATE POLICY "Users can view project first target"
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

DROP POLICY IF EXISTS "Users can manage project first target" ON project_first_target;
CREATE POLICY "Users can manage project first target"
  ON project_first_target FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_first_target.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Project visibility RLS policies fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Users can now ONLY see projects from organizations they belong to';
    RAISE NOTICE '   - Admins can still see all projects';
    RAISE NOTICE '   - Regular users see only their organization projects';
    RAISE NOTICE '   - Viewers can view, Editors can edit, Owners can delete';
    RAISE NOTICE '';
    RAISE NOTICE '🌞 New users will only see "Walking on the Sun" project';
    RAISE NOTICE '   (via the auto-join trigger)';
END $$;
