-- Quick Check table: bridge between Step 0 and Discovery
-- Stores per-segment problem/contacts/solution data and hypothesis

CREATE TABLE IF NOT EXISTS project_quick_check (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    segments JSONB NOT NULL DEFAULT '[]'::jsonb,
    beachhead_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_project_quick_check_project_id ON project_quick_check(project_id);

ALTER TABLE project_quick_check ENABLE ROW LEVEL SECURITY;

-- RLS Policies: same org-based access as project_step0
CREATE POLICY "Users can view quick_check data for their org projects"
ON project_quick_check FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_quick_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert quick_check data for their org projects"
ON project_quick_check FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_quick_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update quick_check data for their org projects"
ON project_quick_check FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_quick_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete quick_check data for their org projects"
ON project_quick_check FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_quick_check.project_id
        AND om.user_id = auth.uid()
    )
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_project_quick_check_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_quick_check_updated_at
    BEFORE UPDATE ON project_quick_check
    FOR EACH ROW
    EXECUTE FUNCTION update_project_quick_check_updated_at();

COMMENT ON TABLE project_quick_check IS 'Quick Check data - bridge between Step 0 First Look and Discovery validation';
