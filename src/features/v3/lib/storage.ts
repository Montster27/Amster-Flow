// Supabase CRUD for pivotkit_ventures + pivotkit_layer_states.
//
// These tables are added in migration 20260509134755_pivotkit_v3_layer_states.sql
// but aren't yet in the generated Database type. Rather than cast away all
// typing with `supabase as any`, we use the locally-typed `sb` client from
// pivotkitDb.ts, which restores compile-time checks on table names and
// insert/update/upsert payloads at this storage boundary.

import { sb } from './pivotkitDb';
import type {
  DoorChoice, Evaluator, Industry, Intensity, LayerStateRow, SourceId,
} from './layers';
import type {
  AssumptionChannel, AssumptionRow, AssumptionState,
} from './assumptions';
import type { DoorAState } from './doorAState';
import { hydrate as hydrateDoorAState } from './doorAState';

/**
 * Supabase / PostgREST returns failures as plain objects
 * (`{ message, details, hint, code }`), NOT `Error` instances. Throwing them
 * raw has two nasty consequences:
 *   1. Any that escape as an unhandled promise rejection surface in Sentry as
 *      the opaque "Object captured as promise rejection with keys: code,
 *      details, hint, message" — no message, no stack, ungroupable.
 *   2. Every `e instanceof Error ? e.message : String(e)` consumer (the hooks'
 *      error state, isDuplicateKeyError) silently degrades to
 *      String(e) === "[object Object]".
 * Wrapping in a real Error that preserves the Postgres `code` fixes both.
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string; details?: string; hint?: string };
    const error = new Error(e.message ?? 'Supabase request failed') as Error & {
      code?: string; details?: string; hint?: string;
    };
    if (e.code) error.code = e.code;
    if (e.details) error.details = e.details;
    if (e.hint) error.hint = e.hint;
    return error;
  }
  return new Error(String(err));
}

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
  if (error) throw toError(error);
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
  if (error) throw toError(error);
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
  if (error) throw toError(error);
  return data as VentureRow;
}

// ── pivotkit_layer_states ──

export async function fetchLayerStack(projectId: string): Promise<LayerStateRow[]> {
  const { data, error } = await sb
    .from('pivotkit_layer_states')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw toError(error);
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
  // Only include columns the caller explicitly provided. A Supabase upsert
  // writes every column present in the payload on the ON CONFLICT update path,
  // so unconditionally sending `claim_text: null` here wipes an existing claim
  // whenever a caller only meant to change the source (e.g. mini-process
  // completion upgrading source_value) — and vice-versa. `undefined` means
  // "leave as-is"; `null` means "explicitly clear".
  const payload: {
    project_id: string;
    layer_id: string;
    claim_text?: string | null;
    source_value?: SourceId | null;
  } = {
    project_id: args.projectId,
    layer_id: args.layerId,
  };
  if (args.claim_text !== undefined) payload.claim_text = args.claim_text;
  if (args.source_value !== undefined) payload.source_value = args.source_value;
  const { data, error } = await sb
    .from('pivotkit_layer_states')
    .upsert(payload, { onConflict: 'project_id,layer_id' })
    .select('*')
    .single();
  if (error) throw toError(error);
  return data as LayerStateRow;
}

// ── pivotkit_door_a_state ──
//
// One row per project, JSONB blob. Shape defined in lib/doorAState.ts. We
// run the payload through `hydrate()` on read so a row written by an older
// client still parses cleanly.

interface DoorAStateRow {
  project_id: string;
  data: unknown;
  updated_at?: string;
  updated_by?: string | null;
}

/** Fetch the Door A blob for a project. Returns null when no row exists yet
 *  (e.g. founder hasn't started the L8 flow). */
export async function fetchDoorAState(projectId: string): Promise<DoorAState | null> {
  const { data, error } = await sb
    .from('pivotkit_door_a_state')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw toError(error);
  if (!data) return null;
  const row = data as DoorAStateRow;
  return hydrateDoorAState(row.data);
}

/** Upsert the full Door A blob. Resolves the unique conflict on project_id. */
export async function upsertDoorAState(
  projectId: string, next: DoorAState,
): Promise<DoorAState> {
  const payload = { project_id: projectId, data: next };
  const { data, error } = await sb
    .from('pivotkit_door_a_state')
    .upsert(payload, { onConflict: 'project_id' })
    .select('*')
    .single();
  if (error) throw toError(error);
  const row = data as DoorAStateRow;
  return hydrateDoorAState(row.data);
}

// ── pivotkit_assumptions ──

export async function fetchAssumptions(projectId: string): Promise<AssumptionRow[]> {
  const { data, error } = await sb
    .from('pivotkit_assumptions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw toError(error);
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
  if (error) throw toError(error);
  return data as AssumptionRow;
}

/**
 * Classify a thrown error as a Postgres unique-violation (i.e. a duplicate
 * row hitting one of the partial unique indexes). Used by the bulk insert
 * below to decide whether a failed insert is a benign duplicate to swallow
 * or a real error to rethrow. Extracted + exported as a pure function so that
 * swallow-vs-rethrow decision is unit-testable without a live database.
 * Matches Postgres' "duplicate key value violates unique constraint …" text
 * (and the shorter "unique constraint" fragment), case-insensitively.
 */
export function isDuplicateKeyError(e: unknown): boolean {
  // Postgres unique-violation SQLSTATE. Checking the code is robust even when
  // the message is unavailable or wrapped; toError() preserves it onto the
  // thrown Error, and raw PostgrestError objects carry it too.
  const code = (e as { code?: string } | null | undefined)?.code;
  if (code === '23505') return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /duplicate key|unique constraint/i.test(msg);
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
      // Postgres unique violation = duplicate; ignore. Anything else rethrows.
      if (!isDuplicateKeyError(e)) throw e;
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
  if (error) throw toError(error);
  return data as AssumptionRow;
}

export async function deleteAssumption(id: string): Promise<void> {
  const { error } = await sb
    .from('pivotkit_assumptions')
    .delete()
    .eq('id', id);
  if (error) throw toError(error);
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
  if (error) throw toError(error);
  return (data ?? []) as AuditLogRow[];
}
