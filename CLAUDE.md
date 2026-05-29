# Claude Code Instructions for ArmsterFlow

## Database Migrations

**IMPORTANT:** Always use the Supabase CLI to create migration files:

```bash
supabase migration new description_of_change
```

This ensures proper timestamp formatting (`YYYYMMDDHHMMSS_name.sql`).

**NEVER** manually create migration files with arbitrary timestamps like `20251217000000_name.sql`.

If you must check the current timestamp format, use:
```bash
date -u +"%Y%m%d%H%M%S"
```

### Data API grants on new tables

Starting **2026-10-30**, Supabase no longer auto-grants Data API access on new tables in existing projects. Every migration that runs `CREATE TABLE public.<name>` must also grant access explicitly, or PostgREST will return permission-denied even with RLS policies in place:

```sql
GRANT ALL ON TABLE public.<name> TO anon, authenticated, service_role;
```

Use narrower grants (per-privilege, per-role) when the table is sensitive — see `newsletter_subscribers` in [20260406133831_tighten_newsletter_rls.sql](supabase/migrations/20260406133831_tighten_newsletter_rls.sql) for the pattern. RLS still gates rows; the GRANT only opens the table to the API role at all.

## Project Structure

- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Styling: Tailwind CSS + shadcn/ui components

## Branches

- `main` - production branch
- `step_0` - Step 0 "First Look" feature development
