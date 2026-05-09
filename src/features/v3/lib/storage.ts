// Supabase CRUD for pivotkit_ventures + pivotkit_layer_states.
//
// These tables are added in migration 20260509134755_pivotkit_v3_layer_states.sql
// but aren't yet in the generated Database type — until `supabase gen types`
// is rerun, we cast at the supabase boundary and keep typing strict at the
// public API surface.

import { supabase } from '../../../lib/supabase';
import type {
  DoorChoice, Evaluator, Industry, Intensity, LayerStateRow, SourceId,
} from './layers';
import type {
  AssumptionChannel, AssumptionRow, AssumptionState,
} from './assumptions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface VentureRow {
  project_id: string;
  industry_variant: Industry;
  evaluator: Evaluator;
  door_choice: DoorChoice | null;
  intensity: Intensity;
  has_completed_onboarding: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

// ── pivotkit_ventures ──

export async function fetchVenture(projectId: string): Promise<VentureRow | null> {
  const { data, error } = await sb
    .from('pivotkit_ventures')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw error;
  return (data as VentureRow | null) ?? null;
}

/**
 * Get-or-create the venture row. New rows default to software / sharp /
 * investor with no door pick yet.
 */
export async function ensureVenture(projectId: string): Promise<VentureRow> {
  const existing = await fetchVenture(projectId);
  if (existing) return existing;
  const { data, error } = await sb
    .from('pivotkit_ventures')
    .insert({ project_id: projectId })
    .select('*')
    .single();
  if (error) throw error;
  return data as VentureRow;
}

export async function updateVenture(
  projectId: string,
  patch: Partial<Pick<VentureRow,
    'industry_variant' | 'evaluator' | 'door_choice' | 'intensity' | 'has_completed_onboarding'
  >>,
): Promise<VentureRow> {
  const { data, error } = await sb
    .from('pivotkit_ventures')
    .update(patch)
    .eq('project_id', projectId)
    .select('*')
    .single();
  if (error) throw error;
  return data as VentureRow;
}

// ── pivotkit_layer_states ──

export async function fetchLayerStack(projectId: string): Promise<LayerStateRow[]> {
  const { data, error } = await sb
    .from('pivotkit_layer_states')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []) as LayerStateRow[];
}

/**
 * Upsert a single layer's claim and source. The (project_id, layer_id) UNIQUE
 * constraint resolves the conflict at the DB layer.
 */
export async function upsertLayerState(args: {
  projectId: string;
  layerId: string;
  claim_text?: string | null;
  source_value?: SourceId | null;
}): Promise<LayerStateRow> {
  const payload = {
    project_id: args.projectId,
    layer_id: args.layerId,
    claim_text: args.claim_text ?? null,
    source_value: args.source_value ?? null,
  };
  const { data, error } = await sb
    .from('pivotkit_layer_states')
    .upsert(payload, { onConflict: 'project_id,layer_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data as LayerStateRow;
}

// ── pivotkit_assumptions ──

export async function fetchAssumptions(projectId: string): Promise<AssumptionRow[]> {
  const { data, error } = await sb
    .from('pivotkit_assumptions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssumptionRow[];
}

export interface InsertAssumptionInput {
  project_id: string;
  source_layer_id?: string | null;
  cross_source_layer_id?: string | null;
  assumption_text: string;
  notes?: string | null;
  channel: AssumptionChannel;
  state?: AssumptionState;
  source_value?: SourceId | null;
  rule_id?: string | null;
}

/** Insert a new assumption row. The unique partial indexes on
 *  (project_id, source_layer_id, rule_id) for spawned and
 *  (project_id, source_layer_id, cross_source_layer_id, rule_id) for
 *  cross_layer mean retried inserts won't dupe. */
export async function insertAssumption(input: InsertAssumptionInput): Promise<AssumptionRow> {
  const { data, error } = await sb
    .from('pivotkit_assumptions')
    .insert({
      project_id: input.project_id,
      source_layer_id: input.source_layer_id ?? null,
      cross_source_layer_id: input.cross_source_layer_id ?? null,
      assumption_text: input.assumption_text,
      notes: input.notes ?? null,
      channel: input.channel,
      state: input.state ?? 'queued',
      source_value: input.source_value ?? null,
      rule_id: input.rule_id ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AssumptionRow;
}

/** Best-effort bulk insert for spawned/cross_layer candidates. Conflicts
 *  on the unique partial index are silently swallowed (returning the
 *  rows that did insert). */
export async function insertAssumptionsIgnoringDuplicates(
  inputs: InsertAssumptionInput[],
): Promise<AssumptionRow[]> {
  if (inputs.length === 0) return [];
  // Try a single upsert with onConflict=do nothing first; fall back to
  // sequential inserts if Supabase swallows the result on conflict.
  const inserted: AssumptionRow[] = [];
  for (const input of inputs) {
    try {
      const row = await insertAssumption(input);
      inserted.push(row);
    } catch (e: unknown) {
      // Postgres unique violation = duplicate; ignore.
      const msg = e instanceof Error ? e.message : String(e);
      if (!/duplicate key|unique constraint/i.test(msg)) throw e;
    }
  }
  return inserted;
}

export async function updateAssumption(
  id: string,
  patch: Partial<Pick<AssumptionRow,
    'assumption_text' | 'notes' | 'state' | 'source_value' | 'resolved_at'
  >>,
): Promise<AssumptionRow> {
  const { data, error } = await sb
    .from('pivotkit_assumptions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as AssumptionRow;
}

export async function deleteAssumption(id: string): Promise<void> {
  const { error } = await sb
    .from('pivotkit_assumptions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── pivotkit_audit_log ──

export interface AuditLogRow {
  id: string;
  project_id: string;
  actor: 'founder' | 'system' | 'mentor';
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export async function logAuditEvent(args: {
  projectId: string;
  actor?: 'founder' | 'system' | 'mentor';
  action: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await sb.from('pivotkit_audit_log').insert({
    project_id: args.projectId,
    actor: args.actor ?? 'founder',
    action: args.action,
    payload: args.payload ?? {},
  });
  if (error) {
    // Don't throw — audit should never break user flows.
    // eslint-disable-next-line no-console
    console.warn('[v3 audit] failed to log event:', args.action, error);
  }
}

export async function fetchAuditLog(projectId: string, limit = 100): Promise<AuditLogRow[]> {
  const { data, error } = await sb
    .from('pivotkit_audit_log')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditLogRow[];
}
