-- ============================================================================
-- ADD SYSTEM STRUCTURE INTEGRATION FIELDS TO PROJECT_ASSUMPTIONS
-- Enables bidirectional linking between Discovery and Visual Sector Map
-- ============================================================================

-- ============================================================================
-- 1. ADD LINKING COLUMNS
-- ============================================================================

-- Link assumptions to Visual Sector Map actors
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS linked_actor_ids TEXT[] DEFAULT '{}';

-- Link assumptions to Visual Sector Map connections
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS linked_connection_ids TEXT[] DEFAULT '{}';

-- ============================================================================
-- 2. CREATE INDEXES FOR LINKING QUERIES
-- ============================================================================

-- Index for filtering assumptions by linked actor
CREATE INDEX IF NOT EXISTS idx_assumptions_linked_actors
  ON project_assumptions USING GIN(linked_actor_ids)
  WHERE linked_actor_ids IS NOT NULL AND array_length(linked_actor_ids, 1) > 0;

-- Index for filtering assumptions by linked connection
CREATE INDEX IF NOT EXISTS idx_assumptions_linked_connections
  ON project_assumptions USING GIN(linked_connection_ids)
  WHERE linked_connection_ids IS NOT NULL AND array_length(linked_connection_ids, 1) > 0;

-- ============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN project_assumptions.linked_actor_ids IS
  'Array of Visual Sector Map actor IDs that this assumption relates to';

COMMENT ON COLUMN project_assumptions.linked_connection_ids IS
  'Array of Visual Sector Map connection IDs that this assumption relates to';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ System Structure integration fields added successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 New Columns Added to project_assumptions:';
    RAISE NOTICE '   - linked_actor_ids (TEXT[] - links to Visual Sector Map actors)';
    RAISE NOTICE '   - linked_connection_ids (TEXT[] - links to VSM connections)';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ GIN indexes created for efficient array queries';
    RAISE NOTICE '💡 Enables bidirectional Discovery ↔ System Structure integration';
END $$;
