-- Drop the backup table that was flagged for missing RLS
-- This table is no longer needed after migration

DROP TABLE IF EXISTS public.project_assumptions_backup;
