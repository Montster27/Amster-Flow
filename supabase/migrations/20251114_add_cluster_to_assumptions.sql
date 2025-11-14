-- ============================================================================
-- Add Cluster/Category Field to Project Assumptions
-- Organizes assumptions into Customer, Problem, or Solution categories
-- ============================================================================

-- Add cluster column to project_assumptions table
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS cluster TEXT DEFAULT 'problem' CHECK (cluster IN ('customer', 'problem', 'solution'));

-- Add index for efficient filtering by cluster
CREATE INDEX IF NOT EXISTS idx_project_assumptions_cluster ON project_assumptions(cluster);

-- Add comment for documentation
COMMENT ON COLUMN project_assumptions.cluster IS 'Category of assumption: customer (who they are), problem (pain points), or solution (product features)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Cluster column added to project_assumptions table successfully!';
    RAISE NOTICE '📊 Assumptions can now be organized by Customer, Problem, or Solution';
    RAISE NOTICE '🔍 Valid values: customer, problem, solution (default: problem)';
END $$;
