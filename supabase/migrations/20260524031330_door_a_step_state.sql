-- PivotKit v3 — Door A step state (L8.1–L10.4)
--
-- The spec at door_a_l8_l10_spec.md restructures Door A's middle band into a
-- step graph: L8.1 (generate option space) → L8.2 (sub-divide) → L8.3 (triple
-- filter) → L8.4 (pick beachhead) → L9.1–9.4 (problem / pain / solution /
-- adoption cost) → L10.1–10.4 (value chain / margin walk / business model /
-- competitive starter).
--
-- The existing `pivotkit_layer_states` row for `customerSegment`, `problem`,
-- `painScale`, `solution`, `businessModel`, `competitiveMarket` continues to
-- hold the canonical claim_text + source_value — so the tier/gate machinery
-- in lib/gates.ts works unchanged. This table holds the *structured detail*
-- (option space, sub-groups + scores, value-chain nodes/edges, etc.) that
-- doesn't fit the flat scalar shape of pivotkit_layer_states.
--
-- One row per project (PK: project_id). JSONB blob because the shape is
-- domain-rich and evolving; structural validation lives in the TypeScript
-- types under src/features/v3/lib/doorAState.ts. CHECK constraint enforces
-- that `data` is a JSON object (not an array, string, or null payload).
--
-- RLS mirrors pivotkit_ventures and pivotkit_layer_states exactly:
-- org-member access via projects.organization_id → organization_members.

-- ──────────────────────────────────────────────────────────────────
-- pivotkit_door_a_state
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pivotkit_door_a_state (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(data) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pivotkit_door_a_state_updated_at
    ON pivotkit_door_a_state(updated_at DESC);

ALTER TABLE pivotkit_door_a_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view door A state for their org projects"
ON pivotkit_door_a_state FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_door_a_state.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert door A state for their org projects"
ON pivotkit_door_a_state FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_door_a_state.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update door A state for their org projects"
ON pivotkit_door_a_state FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_door_a_state.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete door A state for their org projects"
ON pivotkit_door_a_state FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_door_a_state.project_id AND om.user_id = auth.uid()
    )
);

-- updated_at trigger — reuse the existing pivotkit_touch_updated_at function
-- (defined in 20260509134755_pivotkit_v3_layer_states.sql). Extend it here so
-- it also handles this new table.
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
    ELSIF TG_TABLE_NAME = 'pivotkit_door_a_state' THEN
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pivotkit_door_a_state_updated_at ON pivotkit_door_a_state;
CREATE TRIGGER pivotkit_door_a_state_updated_at
    BEFORE UPDATE ON pivotkit_door_a_state
    FOR EACH ROW
    EXECUTE FUNCTION pivotkit_touch_updated_at();

-- Data API grants — required from 2026-10-30 onward per the Supabase change
-- noted in CLAUDE.md. Granted explicitly so PostgREST can serve this table
-- after RLS allows the row. RLS is what actually gates rows; this GRANT only
-- opens the table to the API roles at all.
GRANT ALL ON TABLE pivotkit_door_a_state TO anon, authenticated, service_role;

COMMENT ON TABLE pivotkit_door_a_state IS
'PivotKit v3 Door A: structured step state (L8.1–L10.4). Companion to pivotkit_layer_states; one JSONB blob per project. Shape defined in src/features/v3/lib/doorAState.ts.';

COMMENT ON COLUMN pivotkit_door_a_state.data IS
'Door A step state. Shape: { optionSpace, subgroups, beachheadId, l9: {...}, l10: {...} }. See doorAState.ts for full TypeScript schema.';
