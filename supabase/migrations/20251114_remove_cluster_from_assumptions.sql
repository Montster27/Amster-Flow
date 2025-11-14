-- ============================================================================
-- Remove Cluster Field from Project Assumptions
-- The existing 'type' field already provides this categorization
-- ============================================================================

-- Drop the cluster column (if it exists)
ALTER TABLE project_assumptions
DROP COLUMN IF EXISTS cluster;

-- Drop the index (if it exists)
DROP INDEX IF EXISTS idx_project_assumptions_cluster;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Cluster column removed from project_assumptions table!';
    RAISE NOTICE '📊 Using existing type field for categorization (customer/problem/solution)';
END $$;
