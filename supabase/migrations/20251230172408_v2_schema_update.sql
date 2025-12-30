-- V2 Schema Update: Beachhead tracking, assumption stages, interview enhancements
-- Migration: 20251230172408_v2_schema_update.sql

-- ============================================================================
-- PHASE 0: BACKUP AND MIGRATION TRACKING
-- ============================================================================

-- Backup existing assumptions before any changes
CREATE TABLE IF NOT EXISTS project_assumptions_backup AS
SELECT *, NOW() as backed_up_at FROM project_assumptions WHERE false;

-- Insert backup of existing data
INSERT INTO project_assumptions_backup
SELECT *, NOW() as backed_up_at FROM project_assumptions;

-- Add migration tracking to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS v2_migrated_at TIMESTAMP DEFAULT NULL;

-- ============================================================================
-- PHASE 1: BEACHHEAD TRACKING
-- ============================================================================

-- Add beachhead data to projects (stores selected segment and history)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS beachhead_data JSONB DEFAULT NULL;

-- ============================================================================
-- PHASE 1: ASSUMPTION ENHANCEMENTS
-- ============================================================================

-- Add migration tracking to assumptions
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS migrated_from_step0 BOOLEAN DEFAULT FALSE;

-- Add source segment tracking
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS source_segment VARCHAR(255);

-- Add validation stage (1, 2, or 3)
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS validation_stage INTEGER DEFAULT 1;

-- ============================================================================
-- PHASE 1: INTERVIEW ENHANCEMENTS
-- ============================================================================

-- Add beachhead matching to interviews
ALTER TABLE project_interviews_enhanced
ADD COLUMN IF NOT EXISTS matches_beachhead BOOLEAN DEFAULT NULL;

-- Add deviation acknowledgment
ALTER TABLE project_interviews_enhanced
ADD COLUMN IF NOT EXISTS deviation_acknowledged BOOLEAN DEFAULT FALSE;

-- Add deviation reason
ALTER TABLE project_interviews_enhanced
ADD COLUMN IF NOT EXISTS deviation_reason TEXT;

-- ============================================================================
-- MIGRATE EXISTING ASSUMPTIONS TO STAGES
-- ============================================================================

-- Set validation_stage based on canvas_area for existing assumptions
UPDATE project_assumptions
SET validation_stage = CASE
    -- Stage 1: Customer-Problem Fit
    WHEN canvas_area IN ('customerSegments', 'problem') THEN 1
    -- Stage 2: Problem-Solution Fit
    WHEN canvas_area IN ('existingAlternatives', 'solution', 'uniqueValueProposition', 'earlyAdopters') THEN 2
    -- Stage 3: Business Model Viability
    WHEN canvas_area IN ('channels', 'revenueStreams', 'costStructure', 'keyMetrics', 'unfairAdvantage') THEN 3
    -- Default to Stage 1 if unknown
    ELSE 1
END
WHERE validation_stage IS NULL OR validation_stage = 0;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Index for stage-based queries
CREATE INDEX IF NOT EXISTS idx_assumptions_stage
ON project_assumptions(project_id, validation_stage);

-- Index for beachhead interview queries
CREATE INDEX IF NOT EXISTS idx_interviews_beachhead
ON project_interviews_enhanced(project_id, matches_beachhead);

-- Index for migration status
CREATE INDEX IF NOT EXISTS idx_projects_v2_migrated
ON projects(v2_migrated_at) WHERE v2_migrated_at IS NOT NULL;

-- ============================================================================
-- VALIDATION CONSTRAINTS
-- ============================================================================

-- Ensure validation_stage is 1, 2, or 3
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_validation_stage'
    ) THEN
        ALTER TABLE project_assumptions
        ADD CONSTRAINT chk_validation_stage
        CHECK (validation_stage >= 1 AND validation_stage <= 3);
    END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN projects.beachhead_data IS 'V2: Stores beachhead segment selection and focus history as JSONB';
COMMENT ON COLUMN projects.v2_migrated_at IS 'V2: Timestamp when project was migrated to V2 schema';
COMMENT ON COLUMN project_assumptions.migrated_from_step0 IS 'V2: True if assumption was created during Step 0 graduation';
COMMENT ON COLUMN project_assumptions.source_segment IS 'V2: Name of the segment this assumption relates to';
COMMENT ON COLUMN project_assumptions.validation_stage IS 'V2: Which validation stage (1=Customer-Problem, 2=Problem-Solution, 3=Business Model)';
COMMENT ON COLUMN project_interviews_enhanced.matches_beachhead IS 'V2: True if interviewee matches the beachhead segment';
COMMENT ON COLUMN project_interviews_enhanced.deviation_acknowledged IS 'V2: True if user acknowledged interviewing outside beachhead';
COMMENT ON COLUMN project_interviews_enhanced.deviation_reason IS 'V2: Reason for interviewing outside beachhead segment';
