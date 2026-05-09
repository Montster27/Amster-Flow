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
