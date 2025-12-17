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

## Project Structure

- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Styling: Tailwind CSS + shadcn/ui components

## Branches

- `main` - production branch
- `step_0` - Step 0 "First Look" feature development
