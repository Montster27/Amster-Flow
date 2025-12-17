-- ============================================================================
-- Add Template/Public Project Support
-- Allow specific projects to be visible to all authenticated users
-- ============================================================================

-- Add is_template column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add index for efficient filtering of template projects
CREATE INDEX IF NOT EXISTS idx_projects_is_template ON projects(is_template)
WHERE is_template = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN projects.is_template IS 'When true, project is visible to all authenticated users as an example/template. Used for demo projects like Pet Finder.';

-- ============================================================================
-- CREATE TABLE FOR TRACKING DISMISSED TEMPLATES
-- ============================================================================

-- Track which users have dismissed which template projects
CREATE TABLE IF NOT EXISTS user_dismissed_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Add index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_user_dismissed_templates_user_id ON user_dismissed_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dismissed_templates_project_id ON user_dismissed_templates(project_id);

-- RLS for dismissed templates
ALTER TABLE user_dismissed_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissed templates"
  ON user_dismissed_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss templates"
  ON user_dismissed_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can un-dismiss templates"
  ON user_dismissed_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE RLS POLICIES FOR TEMPLATE PROJECTS
-- ============================================================================

-- Drop the existing "Organization members can view projects" policy
DROP POLICY IF EXISTS "Organization members can view projects" ON projects;

-- Recreate SELECT policy with template project support
CREATE POLICY "Organization members can view projects"
  ON projects FOR SELECT
  USING (
    is_admin() OR
    is_template = TRUE OR  -- NEW: Allow all authenticated users to view template projects
    (EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
    ))
  );

-- Prevent editing template projects (only admins or original creators can edit)
DROP POLICY IF EXISTS "Only editors and owners can update projects" ON projects;

CREATE POLICY "Only editors and owners can update projects"
  ON projects FOR UPDATE
  USING (
    is_admin() OR
    (
      is_template = FALSE AND  -- NEW: Prevent editing template projects
      EXISTS (
        SELECT 1
        FROM organization_members om
        WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'editor')
      )
    )
  );

-- ============================================================================
-- MARK PET FINDER AS TEMPLATE PROJECT
-- ============================================================================

-- Update Pet Finder project to be a template
UPDATE projects
SET is_template = TRUE
WHERE LOWER(name) LIKE '%pet%finder%';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM projects
  WHERE is_template = TRUE;

  RAISE NOTICE '✅ Template project support added successfully!';
  RAISE NOTICE '📊 Template projects marked: %', template_count;
  RAISE NOTICE '🔐 RLS policy updated: all authenticated users can view template projects';
  RAISE NOTICE '🎯 Pet Finder project is now available to all users';
END $$;
