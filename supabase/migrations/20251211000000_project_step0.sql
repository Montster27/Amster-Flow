-- Migration: Add project_step0 table for Step 0 "First Look" persistence
-- This stores the initial customer discovery work before the full Discovery module

-- Create table for Step 0 data (stores entire state as JSON for flexibility)
CREATE TABLE IF NOT EXISTS project_step0 (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

    -- Current part/step within Step 0 (0-4)
    current_part INTEGER NOT NULL DEFAULT 0,

    -- Part 0: The idea statement
    idea JSONB NOT NULL DEFAULT '{"building": "", "helps": "", "achieve": ""}'::jsonb,

    -- Part 1: Customers with their problems
    customers JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Part 2: Customer segments with rankings
    segments JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Focused segment selection
    focused_segment_id BIGINT,
    focus_justification TEXT,

    -- Part 3: Assumptions derived from problems
    assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_step0_project_id ON project_step0(project_id);

-- Enable RLS
ALTER TABLE project_step0 ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access Step 0 data for projects in their organization
CREATE POLICY "Users can view step0 data for their org projects"
ON project_step0 FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_step0.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert step0 data for their org projects"
ON project_step0 FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_step0.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update step0 data for their org projects"
ON project_step0 FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_step0.project_id
        AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete step0 data for their org projects"
ON project_step0 FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = project_step0.project_id
        AND om.user_id = auth.uid()
    )
);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_project_step0_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_step0_updated_at
    BEFORE UPDATE ON project_step0
    FOR EACH ROW
    EXECUTE FUNCTION update_project_step0_updated_at();

-- Add comment for documentation
COMMENT ON TABLE project_step0 IS 'Stores Step 0 "First Look" data - initial customer discovery before the full Discovery module';
