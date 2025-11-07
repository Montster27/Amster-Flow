-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access data they're authorized to see
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_first_target ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

-- Members can view their organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

-- Authenticated users can create organizations
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Owners can update their organizations
CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Owners can delete their organizations
CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================================================
-- ORGANIZATION MEMBERS POLICIES
-- ============================================================================

-- Members can view their org's member list
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Owners can add members
CREATE POLICY "Owners can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Owners can update member roles
CREATE POLICY "Owners can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Owners can remove members (or users can remove themselves)
CREATE POLICY "Owners can remove members or users can leave"
  ON organization_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Members can view their org's projects
CREATE POLICY "Users can view org projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
    )
  );

-- Owners and editors can create projects
CREATE POLICY "Editors can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Owners and editors can update projects
CREATE POLICY "Editors can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN projects p ON p.organization_id = om.organization_id
      WHERE p.id = projects.id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );

-- Owners can delete projects
CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN projects p ON p.organization_id = om.organization_id
      WHERE p.id = projects.id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- ============================================================================
-- PROJECT DATA POLICIES (applies to all project_* tables)
-- ============================================================================

-- Helper function to check project access
CREATE OR REPLACE FUNCTION user_can_access_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = project_uuid
    AND om.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit project
CREATE OR REPLACE FUNCTION user_can_edit_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = project_uuid
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROJECT MODULES
CREATE POLICY "Users can view project modules"
  ON project_modules FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project modules"
  ON project_modules FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- PROJECT ASSUMPTIONS
CREATE POLICY "Users can view project assumptions"
  ON project_assumptions FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project assumptions"
  ON project_assumptions FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- PROJECT INTERVIEWS
CREATE POLICY "Users can view project interviews"
  ON project_interviews FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project interviews"
  ON project_interviews FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- PROJECT ITERATIONS
CREATE POLICY "Users can view project iterations"
  ON project_iterations FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project iterations"
  ON project_iterations FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- PROJECT COMPETITORS
CREATE POLICY "Users can view project competitors"
  ON project_competitors FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project competitors"
  ON project_competitors FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- PROJECT DECISION MAKERS
CREATE POLICY "Users can view project decision makers"
  ON project_decision_makers FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project decision makers"
  ON project_decision_makers FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- PROJECT FIRST TARGET
CREATE POLICY "Users can view project first target"
  ON project_first_target FOR SELECT
  USING (user_can_access_project(project_id));

CREATE POLICY "Editors can modify project first target"
  ON project_first_target FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS policies created successfully!';
    RAISE NOTICE 'Security: Only organization members can access their projects';
    RAISE NOTICE 'Roles: Owners can delete, Editors can create/edit, Viewers can read';
END $$;
