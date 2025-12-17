-- ============================================================================
-- ADD DISCOVERY 2.0 FIELDS TO PROJECT_ASSUMPTIONS
-- Extends existing assumptions table with LBMC integration and risk scoring
-- Discovery 1.0 remains fully functional - new fields are optional
-- ============================================================================

-- ============================================================================
-- 1. ADD NEW COLUMNS TO project_assumptions
-- ============================================================================

-- LBMC Integration
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS canvas_area TEXT
  CHECK (canvas_area IN (
    'problem',
    'existingAlternatives',
    'customerSegments',
    'earlyAdopters',
    'solution',
    'uniqueValueProposition',
    'channels',
    'revenueStreams',
    'costStructure',
    'keyMetrics',
    'unfairAdvantage'
  ));

-- Risk-based Prioritization
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS importance INTEGER
  CHECK (importance BETWEEN 1 AND 5);

ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS priority TEXT
  CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS risk_score NUMERIC;

-- Enhanced Tracking
ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS interview_count INTEGER DEFAULT 0;

ALTER TABLE project_assumptions
ADD COLUMN IF NOT EXISTS last_tested_date TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2. CREATE INDEX FOR DISCOVERY 2.0 QUERIES
-- ============================================================================

-- Index for filtering by canvas area
CREATE INDEX IF NOT EXISTS idx_assumptions_canvas_area
  ON project_assumptions(canvas_area) WHERE canvas_area IS NOT NULL;

-- Index for filtering by priority
CREATE INDEX IF NOT EXISTS idx_assumptions_priority
  ON project_assumptions(priority) WHERE priority IS NOT NULL;

-- Index for sorting by risk score
CREATE INDEX IF NOT EXISTS idx_assumptions_risk_score
  ON project_assumptions(risk_score DESC) WHERE risk_score IS NOT NULL;

-- ============================================================================
-- 3. CREATE FUNCTION TO CALCULATE RISK SCORE
-- ============================================================================

-- Automatic risk score calculation: (6 - confidence) * importance
-- Higher score = higher risk (low confidence + high importance)
CREATE OR REPLACE FUNCTION calculate_risk_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if both confidence and importance are set
  IF NEW.confidence IS NOT NULL AND NEW.importance IS NOT NULL THEN
    NEW.risk_score := (6 - NEW.confidence) * NEW.importance;

    -- Auto-set priority based on risk score
    IF NEW.risk_score >= 15 THEN
      NEW.priority := 'high';    -- Risk score 15-25 (very risky)
    ELSIF NEW.risk_score >= 8 THEN
      NEW.priority := 'medium';  -- Risk score 8-14 (moderate risk)
    ELSE
      NEW.priority := 'low';     -- Risk score 1-7 (low risk)
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC RISK CALCULATION
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_calculate_risk_score ON project_assumptions;

CREATE TRIGGER trigger_calculate_risk_score
  BEFORE INSERT OR UPDATE OF confidence, importance
  ON project_assumptions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_risk_score();

-- ============================================================================
-- 5. CREATE FUNCTION TO UPDATE INTERVIEW COUNT
-- ============================================================================

-- Updates interview_count and last_tested_date when assumption is tagged in interview
CREATE OR REPLACE FUNCTION update_assumption_interview_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new assumption tag is added
  IF (TG_OP = 'INSERT') THEN
    UPDATE project_assumptions
    SET
      interview_count = COALESCE(interview_count, 0) + 1,
      last_tested_date = (
        SELECT MAX(interview_date)
        FROM project_interviews_enhanced
        WHERE id = NEW.interview_id
      )
    WHERE id = NEW.assumption_id;

  -- When an assumption tag is deleted
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE project_assumptions
    SET
      interview_count = GREATEST(COALESCE(interview_count, 0) - 1, 0),
      last_tested_date = (
        SELECT MAX(pie.interview_date)
        FROM interview_assumption_tags iat
        JOIN project_interviews_enhanced pie ON iat.interview_id = pie.id
        WHERE iat.assumption_id = OLD.assumption_id
        AND iat.id != OLD.id
      )
    WHERE id = OLD.assumption_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGER FOR INTERVIEW COUNT UPDATES
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_interview_count ON interview_assumption_tags;

CREATE TRIGGER trigger_update_interview_count
  AFTER INSERT OR DELETE
  ON interview_assumption_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_assumption_interview_count();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Discovery 2.0 fields added successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 New Columns Added to project_assumptions:';
    RAISE NOTICE '   - canvas_area (LBMC integration)';
    RAISE NOTICE '   - importance (1-5 criticality score)';
    RAISE NOTICE '   - priority (auto-calculated: high/medium/low)';
    RAISE NOTICE '   - risk_score (auto-calculated: (6-confidence)*importance)';
    RAISE NOTICE '   - interview_count (auto-updated from tags)';
    RAISE NOTICE '   - last_tested_date (auto-updated from interviews)';
    RAISE NOTICE '';
    RAISE NOTICE '🤖 Automatic Calculations:';
    RAISE NOTICE '   - Risk score calculates on insert/update';
    RAISE NOTICE '   - Priority auto-sets based on risk score';
    RAISE NOTICE '   - Interview count updates when tags added/removed';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '💡 All new fields are optional - Discovery 1.0 unchanged';
END $$;
