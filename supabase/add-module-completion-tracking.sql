-- ============================================================================
-- ADD MODULE COMPLETION TRACKING
-- ============================================================================
-- This migration adds a table to track which modules have been completed
-- in each project, fixing the issue where green completion indicators
-- disappear when users return to a project.
-- ============================================================================

-- Create module completion tracking table
CREATE TABLE IF NOT EXISTS project_module_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, module_name)
);

-- Create index for faster lookups
CREATE INDEX idx_project_module_completion_project_id ON project_module_completion(project_id);

-- Add RLS policies
ALTER TABLE project_module_completion ENABLE ROW LEVEL SECURITY;

-- Allow users to read module completion for projects they can access
CREATE POLICY "Users can view module completion for their projects"
  ON project_module_completion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_module_completion.project_id
      AND om.user_id = auth.uid()
    )
  );

-- Allow users to insert/update module completion for their projects
CREATE POLICY "Users can manage module completion for their projects"
  ON project_module_completion FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_module_completion.project_id
      AND om.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_project_module_completion_updated_at
  BEFORE UPDATE ON project_module_completion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Module completion tracking table created!';
    RAISE NOTICE '';
    RAISE NOTICE 'The project_module_completion table will now track which modules';
    RAISE NOTICE 'are completed, ensuring green indicators persist when users return.';
END $$;
