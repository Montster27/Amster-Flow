-- Add has_graduated column to project_step0 table
-- This tracks whether the user has graduated from Step 0 to Discovery

ALTER TABLE project_step0
ADD COLUMN IF NOT EXISTS has_graduated BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN project_step0.has_graduated IS 'Whether the user has graduated from Step 0 to Discovery module';
