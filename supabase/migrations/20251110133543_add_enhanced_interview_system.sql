-- ============================================================================
-- ADD ENHANCED INTERVIEW SYSTEM
-- Creates new tables for structured interview capture and assumption tracking
-- Keeps old interview system intact - users can switch between both
-- ============================================================================

-- UUID generation uses gen_random_uuid() which is built-in to Supabase

-- ============================================================================
-- 1. ENHANCED INTERVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_interviews_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  interviewee_type TEXT NOT NULL CHECK (interviewee_type IN ('customer', 'partner', 'regulator', 'expert', 'other')),
  segment_name TEXT NOT NULL,
  interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
  context TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed')) DEFAULT 'draft',

  -- Key Findings
  main_pain_points TEXT NOT NULL,
  problem_importance INTEGER NOT NULL CHECK (problem_importance BETWEEN 1 AND 5),
  problem_importance_quote TEXT,
  current_alternatives TEXT NOT NULL,
  memorable_quotes TEXT[] DEFAULT ARRAY[]::TEXT[],
  surprising_feedback TEXT,

  -- Reflection
  student_reflection TEXT,
  mentor_feedback TEXT,

  -- System fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ASSUMPTION TAGS TABLE (Links interviews to assumptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS interview_assumption_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES project_interviews_enhanced(id) ON DELETE CASCADE NOT NULL,
  assumption_id UUID REFERENCES project_assumptions(id) ON DELETE CASCADE NOT NULL,

  -- Validation data
  validation_effect TEXT NOT NULL CHECK (validation_effect IN ('supports', 'contradicts', 'neutral')),
  confidence_change INTEGER NOT NULL CHECK (confidence_change BETWEEN -2 AND 2),
  supporting_quote TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate tags for same interview-assumption pair
  UNIQUE(interview_id, assumption_id)
);

-- ============================================================================
-- 3. INTERVIEW SYNTHESIS TABLE (Pattern detection results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS interview_synthesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Interview range
  interview_ids UUID[] NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Detected patterns
  most_mentioned_pain_point TEXT,
  most_invalidated_assumption UUID REFERENCES project_assumptions(id) ON DELETE SET NULL,
  most_discussed_segments TEXT[],

  -- Assumption summaries (stored as JSONB for flexibility)
  assumption_summaries JSONB,

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. USER PREFERENCES TABLE (Track which interview system user prefers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_interview_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- Preference
  use_enhanced_system BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, project_id)
);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_enhanced_interviews_project_id
  ON project_interviews_enhanced(project_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_interviews_status
  ON project_interviews_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_interviews_date
  ON project_interviews_enhanced(interview_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_interviews_type
  ON project_interviews_enhanced(interviewee_type);

CREATE INDEX IF NOT EXISTS idx_assumption_tags_interview_id
  ON interview_assumption_tags(interview_id);
CREATE INDEX IF NOT EXISTS idx_assumption_tags_assumption_id
  ON interview_assumption_tags(assumption_id);
CREATE INDEX IF NOT EXISTS idx_assumption_tags_validation
  ON interview_assumption_tags(validation_effect);

CREATE INDEX IF NOT EXISTS idx_synthesis_project_id
  ON interview_synthesis(project_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_project
  ON user_interview_preferences(user_id, project_id);

-- ============================================================================
-- 6. ENABLE RLS
-- ============================================================================
ALTER TABLE project_interviews_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_assumption_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interview_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. RLS POLICIES - Enhanced Interviews
-- ============================================================================

-- View enhanced interviews (all org members)
CREATE POLICY "Organization members can view enhanced interviews"
  ON project_interviews_enhanced FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_interviews_enhanced.project_id
      AND om.user_id = auth.uid()
    )
  );

-- Insert enhanced interviews (editors and owners)
CREATE POLICY "Editors can insert enhanced interviews"
  ON project_interviews_enhanced FOR INSERT
  WITH CHECK (user_can_edit_project(project_id));

-- Update enhanced interviews (editors and owners)
CREATE POLICY "Editors can update enhanced interviews"
  ON project_interviews_enhanced FOR UPDATE
  USING (user_can_edit_project(project_id));

-- Delete enhanced interviews (editors and owners)
CREATE POLICY "Editors can delete enhanced interviews"
  ON project_interviews_enhanced FOR DELETE
  USING (user_can_edit_project(project_id));

-- Admin policies
CREATE POLICY "Admins can view all enhanced interviews"
  ON project_interviews_enhanced FOR SELECT
  USING (is_admin());

-- ============================================================================
-- 8. RLS POLICIES - Assumption Tags
-- ============================================================================

-- View tags (all org members can see)
CREATE POLICY "Organization members can view assumption tags"
  ON interview_assumption_tags FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM project_interviews_enhanced pie
      INNER JOIN projects p ON pie.project_id = p.id
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE pie.id = interview_assumption_tags.interview_id
      AND om.user_id = auth.uid()
    )
  );

-- Modify tags (editors and owners)
CREATE POLICY "Editors can manage assumption tags"
  ON interview_assumption_tags FOR ALL
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM project_interviews_enhanced pie
      WHERE pie.id = interview_assumption_tags.interview_id
      AND user_can_edit_project(pie.project_id)
    )
  );

-- ============================================================================
-- 9. RLS POLICIES - Synthesis
-- ============================================================================

-- View synthesis (all org members)
CREATE POLICY "Organization members can view synthesis"
  ON interview_synthesis FOR SELECT
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = interview_synthesis.project_id
      AND om.user_id = auth.uid()
    )
  );

-- Manage synthesis (editors and owners)
CREATE POLICY "Editors can manage synthesis"
  ON interview_synthesis FOR ALL
  USING (user_can_edit_project(project_id))
  WITH CHECK (user_can_edit_project(project_id));

-- ============================================================================
-- 10. RLS POLICIES - User Preferences
-- ============================================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_interview_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_interview_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 11. TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_enhanced_interviews_updated_at
  BEFORE UPDATE ON project_interviews_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_interview_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Enhanced Interview System created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 New Tables:';
    RAISE NOTICE '   - project_interviews_enhanced (structured interview data)';
    RAISE NOTICE '   - interview_assumption_tags (links interviews to assumptions)';
    RAISE NOTICE '   - interview_synthesis (pattern detection results)';
    RAISE NOTICE '   - user_interview_preferences (system toggle per user/project)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS policies applied to all tables';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Old interview system remains unchanged';
    RAISE NOTICE '   Users can switch between old and new systems via preferences';
END $$;
