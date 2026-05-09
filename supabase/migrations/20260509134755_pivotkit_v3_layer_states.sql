-- PivotKit v3 — layer states + ventures
--
-- Stores the 16-layer stack per project. Each (project_id, layer_id) pair
-- holds the founder's claim_text and source_value (logical | experience |
-- research | interviews | prototype | NULL). The star-tier and stage-gate
-- status are DERIVED from source_value at read time — never persisted —
-- per the engineering brief, non-negotiable #1 and #2.
--
-- The `pivotkit_ventures` companion row carries per-project pivotkit
-- metadata that doesn't belong on the generic projects table: industry
-- variant (software / biotech / hardware / fintech), evaluator (investor /
-- customer / grant / advisor), and the founder's door pick.

-- ──────────────────────────────────────────────────────────────────
-- pivotkit_ventures
-- One row per project that's enrolled in the v3 PivotKit flow.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pivotkit_ventures (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    industry_variant TEXT NOT NULL DEFAULT 'software'
        CHECK (industry_variant IN ('software', 'biotech', 'hardware', 'fintech')),
    evaluator TEXT NOT NULL DEFAULT 'investor'
        CHECK (evaluator IN ('investor', 'customer', 'grant', 'advisor')),
    door_choice TEXT
        CHECK (door_choice IS NULL OR door_choice IN ('A', 'B')),
    intensity TEXT NOT NULL DEFAULT 'sharp'
        CHECK (intensity IN ('direct', 'warmer', 'sharp')),
    has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE pivotkit_ventures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ventures for their org projects"
ON pivotkit_ventures FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_ventures.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert ventures for their org projects"
ON pivotkit_ventures FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_ventures.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update ventures for their org projects"
ON pivotkit_ventures FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_ventures.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete ventures for their org projects"
ON pivotkit_ventures FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_ventures.project_id AND om.user_id = auth.uid()
    )
);

-- ──────────────────────────────────────────────────────────────────
-- pivotkit_layer_states
-- One row per (project × layer). The 16 canonical layer ids are listed in
-- src/features/v3-canvas/data.ts → PK_LAYERS. The layer_definition
-- ontology lives in code as a content table (not a DB table) per
-- non-negotiable #6 — adding Healthcare/Climate is a code-side rows change.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pivotkit_layer_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    layer_id TEXT NOT NULL
        CHECK (layer_id IN (
            'worldImpact', 'exit', 'sectorMapping', 'competitiveMarket',
            'marketExpansion', 'company', 'businessModel', 'customerSegment',
            'solution', 'problem', 'painScale', 'product',
            'requirements', 'design', 'integrations', 'production'
        )),
    claim_text TEXT,
    source_value TEXT
        CHECK (source_value IS NULL OR source_value IN (
            'logical', 'experience', 'research', 'interviews', 'prototype'
        )),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_by UUID REFERENCES auth.users(id),
    UNIQUE (project_id, layer_id)
);

CREATE INDEX IF NOT EXISTS idx_pivotkit_layer_states_project_id
    ON pivotkit_layer_states(project_id);

ALTER TABLE pivotkit_layer_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view layer states for their org projects"
ON pivotkit_layer_states FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_layer_states.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert layer states for their org projects"
ON pivotkit_layer_states FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_layer_states.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update layer states for their org projects"
ON pivotkit_layer_states FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_layer_states.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete layer states for their org projects"
ON pivotkit_layer_states FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_layer_states.project_id AND om.user_id = auth.uid()
    )
);

-- ──────────────────────────────────────────────────────────────────
-- updated_at / last_updated_at trigger
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pivotkit_touch_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF TG_TABLE_NAME = 'pivotkit_ventures' THEN
        NEW.updated_at := NOW();
    ELSIF TG_TABLE_NAME = 'pivotkit_layer_states' THEN
        NEW.last_updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pivotkit_ventures_updated_at ON pivotkit_ventures;
CREATE TRIGGER pivotkit_ventures_updated_at
    BEFORE UPDATE ON pivotkit_ventures
    FOR EACH ROW
    EXECUTE FUNCTION pivotkit_touch_updated_at();

DROP TRIGGER IF EXISTS pivotkit_layer_states_updated_at ON pivotkit_layer_states;
CREATE TRIGGER pivotkit_layer_states_updated_at
    BEFORE UPDATE ON pivotkit_layer_states
    FOR EACH ROW
    EXECUTE FUNCTION pivotkit_touch_updated_at();

COMMENT ON TABLE pivotkit_ventures IS 'PivotKit v3: per-project venture metadata (industry, evaluator, door choice).';
COMMENT ON TABLE pivotkit_layer_states IS 'PivotKit v3: founder claims + source per layer. Tier and stage gates are derived, not stored.';
