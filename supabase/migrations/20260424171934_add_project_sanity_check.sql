-- Sanity Check table: bridge between Quick Check and Discovery
-- Captures the "first 3 conversations" that validate the general problem
-- exists, >1 person has it, and they are actively trying to solve it.
-- Filters out latent needs before expensive Discovery interviews begin.

CREATE TABLE IF NOT EXISTS project_sanity_check (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    acknowledged_latent_warning BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_project_sanity_check_project_id ON project_sanity_check(project_id);

ALTER TABLE project_sanity_check ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sanity_check data for their org projects"
ON project_sanity_check FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_sanity_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert sanity_check data for their org projects"
ON project_sanity_check FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_sanity_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update sanity_check data for their org projects"
ON project_sanity_check FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_sanity_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete sanity_check data for their org projects"
ON project_sanity_check FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_sanity_check.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE TRIGGER project_sanity_check_updated_at
    BEFORE UPDATE ON project_sanity_check
    FOR EACH ROW
    EXECUTE FUNCTION update_project_quick_check_updated_at();

COMMENT ON TABLE project_sanity_check IS 'Sanity Check data - first 3 conversations validating the problem is real and non-latent before Discovery';
COMMENT ON COLUMN project_sanity_check.contacts IS 'Array of { index:int, name:string, status:"not_started"|"done"|"unreachable", has_problem:"yes"|"no"|"unclear"|null, is_solving:"yes"|"no"|"unclear"|null, notes:string, interviewed_at:timestamptz|null }';
