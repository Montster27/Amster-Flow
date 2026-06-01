// Typed Supabase client for the pivotkit_* tables.
//
// These tables were added in migration 20260509134755_pivotkit_v3_layer_states
// and are NOT in the generated `Database` type (src/types/database.ts). Rather
// than regenerate that file, we describe the tables locally with a minimal
// schema type and expose a `sb` client typed to it. This restores compile-time
// checking on `.from()` table names and `.insert()/.update()/.upsert()`
// payloads at the storage boundary — the thing the old `supabase as any` cast
// silently discarded.
//
// Row types are imported from where they already live (type-only, so there is
// no runtime import cycle even though storage.ts/useMiniProcessRuns.ts import
// `sb` from here). Insert/Update shapes are defined here to match the exact
// payloads the storage layer writes.

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import type {
  DoorChoice, Evaluator, Industry, Intensity, LayerStateRow, SourceId,
} from './layers';
import type {
  AssumptionChannel, AssumptionRow, AssumptionState,
} from './assumptions';
import type { AuditLogRow, VentureRow } from './storage';
import type { MiniProcessRunRow } from '../hooks/useMiniProcessRuns';

// ── pivotkit_ventures ──
interface VentureInsert {
  project_id: string;
  industry_variant?: Industry;
  evaluator?: Evaluator;
  door_choice?: DoorChoice | null;
  intensity?: Intensity;
  has_completed_onboarding?: boolean;
}

// ── pivotkit_layer_states ──
interface LayerStateInsert {
  project_id: string;
  layer_id: string;
  claim_text?: string | null;
  source_value?: SourceId | null;
}

// ── pivotkit_door_a_state ──
// `data` is JSONB; typed `unknown` so the DoorAState blob assigns in and is
// re-validated via hydrate() on read.
interface DoorAStateRow {
  project_id: string;
  data: unknown;
  updated_at?: string;
  updated_by?: string | null;
}
interface DoorAStateInsert {
  project_id: string;
  data: unknown;
}

// ── pivotkit_assumptions ──
interface AssumptionInsert {
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
interface AssumptionUpdate {
  assumption_text?: string;
  notes?: string | null;
  state?: AssumptionState;
  source_value?: SourceId | null;
  resolved_at?: string | null;
}

// ── pivotkit_audit_log ──
interface AuditInsert {
  project_id: string;
  actor?: 'founder' | 'system' | 'mentor';
  action: string;
  payload?: Record<string, unknown>;
}

// ── pivotkit_mini_process_runs ──
type MiniRunProgress = MiniProcessRunRow['progress'];
interface MiniRunInsert {
  project_id: string;
  kind: string;
  layer_id: string;
  state?: MiniProcessRunRow['state'];
  progress?: MiniRunProgress;
  notes?: string | null;
}
interface MiniRunUpdate {
  state?: MiniProcessRunRow['state'];
  progress?: MiniRunProgress;
  notes?: string | null;
  completed_at?: string | null;
}

// supabase-js's GenericTable constrains Row/Insert/Update to
// `Record<string, unknown>`. TypeScript `interface` types do NOT satisfy that
// constraint (they're open to declaration-merging, so they get no implicit
// index signature); a closed object-literal type does. This identity mapped
// type flattens any interface into such a closed type, so the imported Row
// interfaces and the local Insert/Update shapes below all type-check as tables.
// Without it, every table collapses to `never` and `.insert()/.update()`
// payloads are rejected.
type Tbl<T> = { [K in keyof T]: T[K] };

/** Local schema describing only the pivotkit_* tables — shaped the way
 *  supabase-js expects ({ Row, Insert, Update } per table). */
type PivotkitDatabase = {
  // Matches the marker in the generated `Database` type so return-type
  // inference uses the same PostgREST version as the real client.
  __InternalSupabase: { PostgrestVersion: '13.0.5' };
  public: {
    Tables: {
      pivotkit_ventures: {
        Row: Tbl<VentureRow>; Insert: Tbl<VentureInsert>; Update: Tbl<Partial<VentureInsert>>; Relationships: [];
      };
      pivotkit_layer_states: {
        Row: Tbl<LayerStateRow>; Insert: Tbl<LayerStateInsert>; Update: Tbl<Partial<LayerStateInsert>>; Relationships: [];
      };
      pivotkit_door_a_state: {
        Row: Tbl<DoorAStateRow>; Insert: Tbl<DoorAStateInsert>; Update: Tbl<Partial<DoorAStateInsert>>; Relationships: [];
      };
      pivotkit_assumptions: {
        Row: Tbl<AssumptionRow>; Insert: Tbl<AssumptionInsert>; Update: Tbl<AssumptionUpdate>; Relationships: [];
      };
      pivotkit_audit_log: {
        Row: Tbl<AuditLogRow>; Insert: Tbl<AuditInsert>; Update: Tbl<Partial<AuditInsert>>; Relationships: [];
      };
      pivotkit_mini_process_runs: {
        Row: Tbl<MiniProcessRunRow>; Insert: Tbl<MiniRunInsert>; Update: Tbl<MiniRunUpdate>; Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Supabase client typed to the pivotkit schema. Same runtime client as
 *  `supabase`; only the compile-time table typing differs. */
export const sb = supabase as unknown as SupabaseClient<PivotkitDatabase>;
