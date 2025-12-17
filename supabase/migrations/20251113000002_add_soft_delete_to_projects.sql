-- ============================================================================
-- Add Soft Delete Support to Projects
-- This migration adds a deleted_at column to projects table for soft deletes
-- Deleted projects are retained in the database but hidden from UI
-- ============================================================================

-- Add deleted_at column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient filtering of non-deleted projects
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at)
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.deleted_at IS 'Timestamp when project was soft-deleted. NULL means project is active.';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Soft delete column added to projects table successfully!';
    RAISE NOTICE 'Projects can now be soft-deleted by setting deleted_at timestamp.';
    RAISE NOTICE 'Remember to update queries to filter WHERE deleted_at IS NULL';
END $$;
