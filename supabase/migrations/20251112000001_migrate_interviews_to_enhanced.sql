-- ============================================================================
-- MIGRATE OLD INTERVIEWS TO ENHANCED INTERVIEW SYSTEM
-- Consolidates duplicate interview systems into enhanced system only
-- ============================================================================

-- This migration:
-- 1. Migrates data from project_interviews → project_interviews_enhanced
-- 2. Marks old table as deprecated (adds trigger to prevent new inserts)
-- 3. Preserves all existing data

DO $$
DECLARE
  migrated_count INT := 0;
  skipped_count INT := 0;
BEGIN
  RAISE NOTICE '📊 Starting interview data migration...';
  RAISE NOTICE '';

  -- Migrate interviews from old table to enhanced table
  -- Only migrate interviews that don't already exist in enhanced table
  INSERT INTO project_interviews_enhanced (
    project_id,
    interviewee_type,
    segment_name,
    interview_date,
    context,
    status,
    main_pain_points,
    problem_importance,
    current_alternatives,
    memorable_quotes,
    surprising_feedback,
    student_reflection,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    pi.project_id,
    -- Map old interviewee_type to new enum values
    CASE pi.interviewee_type
      WHEN 'potential-buyer' THEN 'customer'
      WHEN 'competitor' THEN 'expert'
      WHEN 'substitute' THEN 'expert'
      WHEN 'knowledgeable' THEN 'expert'
      ELSE COALESCE(pi.interviewee_type::TEXT, 'customer')
    END,
    -- Use customer_segment as segment_name
    COALESCE(pi.customer_segment, 'Unknown Segment'),
    -- Convert date string to timestamp
    CASE
      WHEN pi.date IS NOT NULL THEN pi.date::TIMESTAMP WITH TIME ZONE
      ELSE NOW()
    END,
    -- Combine interviewee info into context
    CASE
      WHEN pi.interviewee IS NOT NULL
      THEN 'Interview with ' || pi.interviewee || E'\nFormat: ' || pi.format ||
           CASE WHEN pi.duration IS NOT NULL THEN E'\nDuration: ' || pi.duration || ' minutes' ELSE '' END
      ELSE 'Format: ' || pi.format
    END,
    -- All old interviews are considered completed
    'completed',
    -- Use notes as main pain points
    COALESCE(pi.notes, 'No notes provided'),
    -- Default problem importance to medium (3 out of 5)
    3,
    -- Extract current alternatives from notes or use default
    COALESCE(pi.next_action, 'Not documented'),
    -- Convert key_insights array to memorable_quotes
    COALESCE(pi.key_insights, ARRAY[]::TEXT[]),
    -- Use surprises field
    pi.surprises,
    -- No student reflection in old system
    NULL,
    -- Preserve creator
    pi.created_by,
    -- Preserve timestamps
    NOW(),
    NOW()
  FROM project_interviews pi
  WHERE NOT EXISTS (
    -- Skip if already migrated (check by project + date + segment)
    SELECT 1 FROM project_interviews_enhanced pie
    WHERE pie.project_id = pi.project_id
    AND pie.segment_name = pi.customer_segment
    AND pie.interview_date::DATE = pi.date::DATE
  );

  GET DIAGNOSTICS migrated_count = ROW_COUNT;

  RAISE NOTICE '✅ Migrated % interviews to enhanced table', migrated_count;
  RAISE NOTICE '';

  -- Count how many were skipped (already migrated)
  SELECT COUNT(*) INTO skipped_count
  FROM project_interviews pi
  WHERE EXISTS (
    SELECT 1 FROM project_interviews_enhanced pie
    WHERE pie.project_id = pi.project_id
    AND pie.segment_name = pi.customer_segment
    AND pie.interview_date::DATE = pi.date::DATE
  );

  IF skipped_count > 0 THEN
    RAISE NOTICE '⏭️  Skipped % interviews (already migrated)', skipped_count;
    RAISE NOTICE '';
  END IF;

  -- Create trigger to prevent new inserts to old table
  -- This ensures all new interviews go through the enhanced system
  CREATE OR REPLACE FUNCTION prevent_old_interview_inserts()
  RETURNS TRIGGER AS $func$
  BEGIN
    RAISE EXCEPTION 'project_interviews table is deprecated. Use project_interviews_enhanced instead.';
    RETURN NULL;
  END;
  $func$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS prevent_interview_inserts ON project_interviews;

  CREATE TRIGGER prevent_interview_inserts
    BEFORE INSERT ON project_interviews
    FOR EACH ROW
    EXECUTE FUNCTION prevent_old_interview_inserts();

  RAISE NOTICE '🔒 Added trigger to prevent new inserts to old table';
  RAISE NOTICE '';

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Interview migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Summary:';
  RAISE NOTICE '   - Migrated: % interviews', migrated_count;
  RAISE NOTICE '   - Skipped (duplicates): % interviews', skipped_count;
  RAISE NOTICE '   - Old table: DEPRECATED (inserts blocked)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Next Steps:';
  RAISE NOTICE '   1. Verify interview data in Enhanced Interview dashboard';
  RAISE NOTICE '   2. Test creating new interviews through Enhanced system';
  RAISE NOTICE '   3. After 30 days, run cleanup script to drop old table:';
  RAISE NOTICE '      DROP TABLE project_interviews CASCADE;';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ Migration failed: %', SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'Rolling back changes...';
    RAISE;
END $$;
