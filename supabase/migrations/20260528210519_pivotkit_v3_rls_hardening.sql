-- ============================================================================
-- Harden pivotkit v3 RLS: gate writes on edit-permission + secure audit attribution
-- ============================================================================
-- Problem (found in the v3_UI review): every pivotkit_* WRITE policy
-- (INSERT/UPDATE/DELETE) gated only on organization *membership*. A 'viewer'
-- org member could therefore mutate venture data — create/edit/delete layer
-- states, assumptions, door-A state, mini-process runs, and even inject audit
-- rows. The rest of the schema gates writes on user_can_edit_project_check()
-- (owner/editor, or admin via is_admin()); the v3 tables were the exception.
--
-- This migration:
--   1. Re-gates all v3 WRITE policies on user_can_edit_project_check(project_id).
--      SELECT ("view") policies are deliberately left as org-membership so
--      viewers keep read access.
--   2. Forces pivotkit_audit_log.created_by = auth.uid() via a BEFORE INSERT
--      trigger, so a client cannot spoof attribution, and gates audit inserts
--      on edit-permission (audit rows only accompany write actions).
--   3. Re-asserts the Data API GRANTs on the five May-2026 pivotkit tables.
--      These pre-date the 2026-10-30 auto-grant cutoff so the grants already
--      exist on this project (idempotent here); the statements make the
--      migrations self-contained for any environment created after the cutoff.
--
-- All statements are idempotent (DROP ... IF EXISTS / CREATE OR REPLACE / GRANT)
-- so the migration is safe to re-run.
-- ============================================================================

-- 1. WRITE POLICIES → edit-permission (owner / editor / admin) ───────────────

-- pivotkit_ventures
DROP POLICY IF EXISTS "Users can insert ventures for their org projects" ON pivotkit_ventures;
CREATE POLICY "Users can insert ventures for their org projects"
  ON pivotkit_ventures FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can update ventures for their org projects" ON pivotkit_ventures;
CREATE POLICY "Users can update ventures for their org projects"
  ON pivotkit_ventures FOR UPDATE
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can delete ventures for their org projects" ON pivotkit_ventures;
CREATE POLICY "Users can delete ventures for their org projects"
  ON pivotkit_ventures FOR DELETE
  USING (user_can_edit_project_check(project_id));

-- pivotkit_layer_states
DROP POLICY IF EXISTS "Users can insert layer states for their org projects" ON pivotkit_layer_states;
CREATE POLICY "Users can insert layer states for their org projects"
  ON pivotkit_layer_states FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can update layer states for their org projects" ON pivotkit_layer_states;
CREATE POLICY "Users can update layer states for their org projects"
  ON pivotkit_layer_states FOR UPDATE
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can delete layer states for their org projects" ON pivotkit_layer_states;
CREATE POLICY "Users can delete layer states for their org projects"
  ON pivotkit_layer_states FOR DELETE
  USING (user_can_edit_project_check(project_id));

-- pivotkit_assumptions
DROP POLICY IF EXISTS "Users can insert assumptions for their org projects" ON pivotkit_assumptions;
CREATE POLICY "Users can insert assumptions for their org projects"
  ON pivotkit_assumptions FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can update assumptions for their org projects" ON pivotkit_assumptions;
CREATE POLICY "Users can update assumptions for their org projects"
  ON pivotkit_assumptions FOR UPDATE
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can delete assumptions for their org projects" ON pivotkit_assumptions;
CREATE POLICY "Users can delete assumptions for their org projects"
  ON pivotkit_assumptions FOR DELETE
  USING (user_can_edit_project_check(project_id));

-- pivotkit_mini_process_runs
DROP POLICY IF EXISTS "Users can insert mini-process runs for their org projects" ON pivotkit_mini_process_runs;
CREATE POLICY "Users can insert mini-process runs for their org projects"
  ON pivotkit_mini_process_runs FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can update mini-process runs for their org projects" ON pivotkit_mini_process_runs;
CREATE POLICY "Users can update mini-process runs for their org projects"
  ON pivotkit_mini_process_runs FOR UPDATE
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can delete mini-process runs for their org projects" ON pivotkit_mini_process_runs;
CREATE POLICY "Users can delete mini-process runs for their org projects"
  ON pivotkit_mini_process_runs FOR DELETE
  USING (user_can_edit_project_check(project_id));

-- pivotkit_door_a_state
DROP POLICY IF EXISTS "Users can insert door A state for their org projects" ON pivotkit_door_a_state;
CREATE POLICY "Users can insert door A state for their org projects"
  ON pivotkit_door_a_state FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can update door A state for their org projects" ON pivotkit_door_a_state;
CREATE POLICY "Users can update door A state for their org projects"
  ON pivotkit_door_a_state FOR UPDATE
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));

DROP POLICY IF EXISTS "Users can delete door A state for their org projects" ON pivotkit_door_a_state;
CREATE POLICY "Users can delete door A state for their org projects"
  ON pivotkit_door_a_state FOR DELETE
  USING (user_can_edit_project_check(project_id));

-- pivotkit_audit_log — append-only (INSERT + SELECT only; no UPDATE/DELETE).
-- Gate inserts on edit-permission too: audit rows only ever accompany a write.
DROP POLICY IF EXISTS "Users can insert audit log for their org projects" ON pivotkit_audit_log;
CREATE POLICY "Users can insert audit log for their org projects"
  ON pivotkit_audit_log FOR INSERT
  WITH CHECK (user_can_edit_project_check(project_id));

-- 2. AUDIT ATTRIBUTION: stamp created_by from the JWT (anti-spoofing) ─────────
-- The app's logAuditEvent never sends created_by; a malicious client could.
-- This BEFORE INSERT trigger overwrites it with the authenticated user id, so
-- attribution is always trustworthy. service_role/system inserts (no JWT) get
-- NULL, which is the correct value for non-user actions.
CREATE OR REPLACE FUNCTION pivotkit_audit_set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pivotkit_audit_set_created_by ON pivotkit_audit_log;
CREATE TRIGGER trg_pivotkit_audit_set_created_by
  BEFORE INSERT ON pivotkit_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION pivotkit_audit_set_created_by();

-- 3. DATA API GRANTS (forward-compat; idempotent) ────────────────────────────
-- RLS still gates rows; these only open the table to the API roles at all.
-- pivotkit_door_a_state already grants these in its own migration.
GRANT ALL ON TABLE pivotkit_ventures          TO anon, authenticated, service_role;
GRANT ALL ON TABLE pivotkit_layer_states      TO anon, authenticated, service_role;
GRANT ALL ON TABLE pivotkit_assumptions       TO anon, authenticated, service_role;
GRANT ALL ON TABLE pivotkit_mini_process_runs TO anon, authenticated, service_role;
GRANT ALL ON TABLE pivotkit_audit_log         TO anon, authenticated, service_role;
