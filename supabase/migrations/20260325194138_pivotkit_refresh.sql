-- PivotKit Refresh Migration
-- Adds new fields for Founder-Market Fit, Why Now?, Schlep Assessment, Beachhead Qualifiers,
-- locked/ordered assumptions, JTBD interview probes, and fixes earlyAdopters stage assignment.

-- ============================================================================
-- Step 0: New structured fields
-- ============================================================================

ALTER TABLE project_step0
  ADD COLUMN IF NOT EXISTS founder_market_fit JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS why_now JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS schlep_assessment JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS beachhead_qualifiers JSONB DEFAULT '{}';

-- ============================================================================
-- Assumptions: Locked/ordered for auto-generated identity assumptions
-- ============================================================================

ALTER TABLE project_assumptions
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_order INTEGER;

-- ============================================================================
-- Interviews: Jobs-to-Be-Done fields
-- ============================================================================

ALTER TABLE project_interviews_enhanced
  ADD COLUMN IF NOT EXISTS jtbd_functional TEXT,
  ADD COLUMN IF NOT EXISTS jtbd_social TEXT,
  ADD COLUMN IF NOT EXISTS jtbd_emotional TEXT,
  ADD COLUMN IF NOT EXISTS jtbd_classification VARCHAR(20);

-- ============================================================================
-- Fix: Move earlyAdopters from Stage 2 to Stage 1
-- ============================================================================

UPDATE project_assumptions
  SET validation_stage = 1
  WHERE canvas_area = 'earlyAdopters'
  AND validation_stage = 2;
