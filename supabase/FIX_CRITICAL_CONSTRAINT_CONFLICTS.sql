-- ============================================================================
-- FIX CRITICAL CONSTRAINT CONFLICTS
-- Resolves NOT NULL vs ON DELETE SET NULL conflicts
-- ============================================================================
--
-- PROBLEM: Some columns are defined as NOT NULL but have ON DELETE SET NULL
-- foreign key constraints. This creates a conflict - you can't set NULL on
-- a NOT NULL column when the referenced row is deleted.
--
-- SOLUTION: Make created_by and updated_by columns NULLABLE and update the
-- frontend to display "Deleted User" when these are NULL.
-- ============================================================================

-- ============================================================================
-- STEP 1: Make created_by columns NULLABLE
-- ============================================================================

-- Organizations table
ALTER TABLE organizations
  ALTER COLUMN created_by DROP NOT NULL;

-- Projects table
ALTER TABLE projects
  ALTER COLUMN created_by DROP NOT NULL;

-- Project Modules table
ALTER TABLE project_modules
  ALTER COLUMN updated_by DROP NOT NULL;

-- Project Assumptions table
ALTER TABLE project_assumptions
  ALTER COLUMN created_by DROP NOT NULL;

-- Project Interviews table
ALTER TABLE project_interviews
  ALTER COLUMN created_by DROP NOT NULL;

-- Project Iterations table
ALTER TABLE project_iterations
  ALTER COLUMN created_by DROP NOT NULL;

-- Project Competitors table
ALTER TABLE project_competitors
  ALTER COLUMN created_by DROP NOT NULL;

-- Project Decision Makers table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_decision_makers'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE project_decision_makers
      ALTER COLUMN created_by DROP NOT NULL;
  END IF;
END $$;

-- Project First Target table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_first_target'
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE project_first_target
      ALTER COLUMN updated_by DROP NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Verify ON DELETE SET NULL constraints exist
-- ============================================================================

-- Organizations: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE organizations
    DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;

  -- Add with proper ON DELETE SET NULL
  ALTER TABLE organizations
    ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Projects: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE projects
    DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

  ALTER TABLE projects
    ADD CONSTRAINT projects_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Project Modules: updated_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE project_modules
    DROP CONSTRAINT IF EXISTS project_modules_updated_by_fkey;

  ALTER TABLE project_modules
    ADD CONSTRAINT project_modules_updated_by_fkey
    FOREIGN KEY (updated_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Project Assumptions: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE project_assumptions
    DROP CONSTRAINT IF EXISTS project_assumptions_created_by_fkey;

  ALTER TABLE project_assumptions
    ADD CONSTRAINT project_assumptions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Project Interviews: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE project_interviews
    DROP CONSTRAINT IF EXISTS project_interviews_created_by_fkey;

  ALTER TABLE project_interviews
    ADD CONSTRAINT project_interviews_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Project Iterations: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE project_iterations
    DROP CONSTRAINT IF EXISTS project_iterations_created_by_fkey;

  ALTER TABLE project_iterations
    ADD CONSTRAINT project_iterations_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Project Competitors: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE project_competitors
    DROP CONSTRAINT IF EXISTS project_competitors_created_by_fkey;

  ALTER TABLE project_competitors
    ADD CONSTRAINT project_competitors_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- Project Decision Makers: created_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'project_decision_makers'
  ) THEN
    ALTER TABLE project_decision_makers
      DROP CONSTRAINT IF EXISTS project_decision_makers_created_by_fkey;

    ALTER TABLE project_decision_makers
      ADD CONSTRAINT project_decision_makers_created_by_fkey
      FOREIGN KEY (created_by)
      REFERENCES profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Project First Target: updated_by -> profiles(id) ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_first_target'
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE project_first_target
      DROP CONSTRAINT IF EXISTS project_first_target_updated_by_fkey;

    ALTER TABLE project_first_target
      ADD CONSTRAINT project_first_target_updated_by_fkey
      FOREIGN KEY (updated_by)
      REFERENCES profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add comments to document the change
-- ============================================================================

COMMENT ON COLUMN organizations.created_by IS 'User who created this organization. NULL if user was deleted.';
COMMENT ON COLUMN projects.created_by IS 'User who created this project. NULL if user was deleted.';
COMMENT ON COLUMN project_modules.updated_by IS 'User who last updated this module. NULL if user was deleted.';
COMMENT ON COLUMN project_assumptions.created_by IS 'User who created this assumption. NULL if user was deleted.';
COMMENT ON COLUMN project_interviews.created_by IS 'User who created this interview. NULL if user was deleted.';
COMMENT ON COLUMN project_iterations.created_by IS 'User who created this iteration. NULL if user was deleted.';
COMMENT ON COLUMN project_competitors.created_by IS 'User who created this competitor. NULL if user was deleted.';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  v_conflict_count INT;
BEGIN
  -- Check for any remaining conflicts
  SELECT COUNT(*) INTO v_conflict_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
  JOIN information_schema.columns c
    ON c.table_schema = tc.table_schema
    AND c.table_name = tc.table_name
    AND c.column_name = kcu.column_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND rc.delete_rule = 'SET NULL'
  AND c.is_nullable = 'NO';

  RAISE NOTICE '';
  RAISE NOTICE '✅ CONSTRAINT CONFLICT FIX COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  • Made created_by/updated_by columns NULLABLE';
  RAISE NOTICE '  • Set all FK constraints to ON DELETE SET NULL';
  RAISE NOTICE '  • Added documentation comments';
  RAISE NOTICE '';

  IF v_conflict_count = 0 THEN
    RAISE NOTICE '✅ No remaining conflicts detected!';
  ELSE
    RAISE NOTICE '⚠️  % remaining conflicts found - review manually', v_conflict_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📝 FRONTEND UPDATE NEEDED:';
  RAISE NOTICE '  Update UI to display "Deleted User" when created_by is NULL';
  RAISE NOTICE '  Example: displayName = user?.full_name || user?.email || "Deleted User"';
END $$;
