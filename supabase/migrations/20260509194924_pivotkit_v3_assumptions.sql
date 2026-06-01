-- PivotKit v3 — assumptions, mini-process runs, and audit log
--
-- Assumptions are the atomic unit of validation work in PivotKit. Per the
-- engineering brief §2 they enter the stack via three channels:
--   direct       — founder writes one explicitly
--   spawned      — system derives one from a single filled layer
--   cross_layer  — system flags an inconsistency between two layers
--
-- State machine: queued → active → {validated, refined, killed, dismissed}
-- Stars on assumptions follow the same source mapping as layers; tier is
-- derived on read from source_value (per non-negotiable #1 + #2).
--
-- Mini-process runs track when a founder kicks off a structured validation
-- flow (switch interviews, WTP test, prototype, etc.). On completion the
-- source tier of the linked layer/assumption upgrades automatically.
--
-- The audit log records who-changed-what-when across all PivotKit edits so
-- mentors can review founder progress without trusting self-reports.

-- ──────────────────────────────────────────────────────────────────
-- pivotkit_assumptions
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pivotkit_assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    /* Layer this assumption lives under (or is implied by). For
       cross_layer assumptions, this is the primary; the secondary lives
       on cross_source_layer_id. NULL is allowed for free-floating
       direct assumptions but discouraged. */
    source_layer_id TEXT
        CHECK (source_layer_id IS NULL OR source_layer_id IN (
            'worldImpact', 'exit', 'sectorMapping', 'competitiveMarket',
            'marketExpansion', 'company', 'businessModel', 'customerSegment',
            'solution', 'problem', 'painScale', 'product',
            'requirements', 'design', 'integrations', 'production'
        )),
    cross_source_layer_id TEXT
        CHECK (cross_source_layer_id IS NULL OR cross_source_layer_id IN (
            'worldImpact', 'exit', 'sectorMapping', 'competitiveMarket',
            'marketExpansion', 'company', 'businessModel', 'customerSegment',
            'solution', 'problem', 'painScale', 'product',
            'requirements', 'design', 'integrations', 'production'
        )),
    assumption_text TEXT NOT NULL,
    notes TEXT,
    channel TEXT NOT NULL
        CHECK (channel IN ('direct', 'spawned', 'cross_layer')),
    state TEXT NOT NULL DEFAULT 'queued'
        CHECK (state IN ('queued', 'active', 'validated', 'refined', 'killed', 'dismissed')),
    /* Same enum as layer source_value; NULL = unsourced. */
    source_value TEXT
        CHECK (source_value IS NULL OR source_value IN (
            'logical', 'experience', 'research', 'interviews', 'prototype'
        )),
    /* Optional rule that generated this assumption. For spawned/cross_layer
       only; direct assumptions leave it NULL. */
    rule_id TEXT,
    /* Forward reference to a mini-process run (set when the founder kicks
       one off to validate this assumption). NULL until then. */
    mini_process_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pivotkit_assumptions_project_id
    ON pivotkit_assumptions(project_id);
CREATE INDEX IF NOT EXISTS idx_pivotkit_assumptions_state
    ON pivotkit_assumptions(project_id, state);
/* Avoid duplicating the same auto-spawned candidate across page reloads
   when the rule fires repeatedly. Direct authoring is exempt — founders
   may legitimately create multiple direct assumptions sharing a rule_id. */
CREATE UNIQUE INDEX IF NOT EXISTS uq_pivotkit_assumptions_spawned_rule
    ON pivotkit_assumptions(project_id, source_layer_id, rule_id)
    WHERE channel = 'spawned' AND rule_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pivotkit_assumptions_cross_rule
    ON pivotkit_assumptions(project_id, source_layer_id, cross_source_layer_id, rule_id)
    WHERE channel = 'cross_layer' AND rule_id IS NOT NULL;

ALTER TABLE pivotkit_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assumptions for their org projects"
ON pivotkit_assumptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_assumptions.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert assumptions for their org projects"
ON pivotkit_assumptions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_assumptions.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update assumptions for their org projects"
ON pivotkit_assumptions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_assumptions.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete assumptions for their org projects"
ON pivotkit_assumptions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_assumptions.project_id AND om.user_id = auth.uid()
    )
);

-- ──────────────────────────────────────────────────────────────────
-- pivotkit_mini_process_runs
-- A single run of a structured validation flow (e.g. "switch_interviews").
-- The catalog (definition_of_done, prompts, target_n) lives in code as a
-- content table; this row tracks instance state.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pivotkit_mini_process_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    /* Which catalog entry — e.g. 'switch_interviews', 'wtp_test'. Validated
       in the application, not the DB, so adding a new mini-process is a
       code-side rows change (non-negotiable #6). */
    kind TEXT NOT NULL,
    layer_id TEXT NOT NULL
        CHECK (layer_id IN (
            'worldImpact', 'exit', 'sectorMapping', 'competitiveMarket',
            'marketExpansion', 'company', 'businessModel', 'customerSegment',
            'solution', 'problem', 'painScale', 'product',
            'requirements', 'design', 'integrations', 'production'
        )),
    state TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (state IN ('in_progress', 'completed', 'abandoned')),
    progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pivotkit_mini_process_runs_project_id
    ON pivotkit_mini_process_runs(project_id);

ALTER TABLE pivotkit_mini_process_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mini-process runs for their org projects"
ON pivotkit_mini_process_runs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_mini_process_runs.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert mini-process runs for their org projects"
ON pivotkit_mini_process_runs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_mini_process_runs.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update mini-process runs for their org projects"
ON pivotkit_mini_process_runs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_mini_process_runs.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete mini-process runs for their org projects"
ON pivotkit_mini_process_runs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_mini_process_runs.project_id AND om.user_id = auth.uid()
    )
);

-- ──────────────────────────────────────────────────────────────────
-- pivotkit_audit_log
-- Append-only event stream so mentors can audit founder progress.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pivotkit_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK (actor IN ('founder', 'system', 'mentor')),
    action TEXT NOT NULL,
    /* Light context — entity_id/type, before/after snapshots. Always JSON. */
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pivotkit_audit_log_project_created
    ON pivotkit_audit_log(project_id, created_at DESC);

ALTER TABLE pivotkit_audit_log ENABLE ROW LEVEL SECURITY;

/* Audit is read-only for the org; only the system / SECURITY DEFINER
   helpers should insert. We allow inserts from any org member for now
   (founders write via the app), and disallow updates/deletes outright. */
CREATE POLICY "Users can view audit log for their org projects"
ON pivotkit_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_audit_log.project_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert audit log for their org projects"
ON pivotkit_audit_log FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        INNER JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = pivotkit_audit_log.project_id AND om.user_id = auth.uid()
    )
);
/* No UPDATE/DELETE policies — append-only by design. */

-- ──────────────────────────────────────────────────────────────────
-- updated_at trigger reuse — extend the v1 helper to assumptions.
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pivotkit_touch_assumption_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pivotkit_assumptions_updated_at ON pivotkit_assumptions;
CREATE TRIGGER pivotkit_assumptions_updated_at
    BEFORE UPDATE ON pivotkit_assumptions
    FOR EACH ROW
    EXECUTE FUNCTION pivotkit_touch_assumption_updated_at();

COMMENT ON TABLE pivotkit_assumptions IS 'PivotKit v3: assumptions across three channels (direct, spawned, cross_layer).';
COMMENT ON TABLE pivotkit_mini_process_runs IS 'PivotKit v3: per-instance state of a structured validation flow.';
COMMENT ON TABLE pivotkit_audit_log IS 'PivotKit v3: append-only mentor-review trail.';
