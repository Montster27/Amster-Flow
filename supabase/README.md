# Supabase Database Setup

This directory contains SQL scripts to set up the ArmsterFlow database.

## Files

1. **schema.sql** - Creates all tables, indexes, and triggers
2. **rls-policies.sql** - Sets up Row Level Security policies
3. **README.md** - This file

## Setup Instructions

### Step 1: Run Schema Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy the entire contents of `schema.sql`
5. Paste into the editor
6. Click **Run** (bottom right)
7. Wait for success message (~5 seconds)

**What this creates:**
- 11 tables (profiles, organizations, projects, etc.)
- 15 indexes for performance
- Auto-update triggers for timestamps
- UUID extension enabled

### Step 2: Run RLS Policies Script

1. In SQL Editor, click **New query** again
2. Copy the entire contents of `rls-policies.sql`
3. Paste into the editor
4. Click **Run**
5. Wait for success message (~3 seconds)

**What this creates:**
- Row Level Security enabled on all tables
- Policies ensuring users only see their org's data
- Role-based permissions (Owner, Editor, Viewer)
- Helper functions for access control

### Step 3: Verify Setup

1. Go to **Table Editor** (left sidebar)
2. You should see all 11 tables:
   - ✅ profiles
   - ✅ organizations
   - ✅ organization_members
   - ✅ projects
   - ✅ project_modules
   - ✅ project_assumptions
   - ✅ project_interviews
   - ✅ project_iterations
   - ✅ project_competitors
   - ✅ project_decision_makers
   - ✅ project_first_target

3. Click any table → **Policies** tab
4. Should see multiple policies listed

## Database Schema Overview

```
Users (Supabase Auth)
  ↓
profiles (user info)
  ↓
organizations (teams)
  ↓
organization_members (team membership + roles)
  ↓
projects (Lean Canvas instances)
  ↓
├─ project_modules (Problem, Customer, Solution answers)
├─ project_assumptions (hypotheses to test)
├─ project_interviews (customer conversations)
├─ project_iterations (pivot history)
├─ project_competitors (competitor analysis)
├─ project_decision_makers (B2C decision mapping)
└─ project_first_target (first target customer)
```

## Security Model

### Roles
- **Owner** - Full control (create, edit, delete, manage members)
- **Editor** - Can create and edit projects/data
- **Viewer** - Read-only access

### Access Control
- Users can only see organizations they're members of
- Users can only see projects in their organizations
- All project data inherits project permissions
- RLS enforced at database level (secure even if frontend is bypassed)

## Next Steps

After running both SQL scripts:

1. **Enable Realtime** (for live collaboration)
   - Database → Replication
   - Enable for: project_modules, project_assumptions, project_interviews, etc.

2. **Configure Auth Providers** (optional)
   - Authentication → Providers
   - Enable Google OAuth if desired

3. **Add environment variables to Vercel**
   - Settings → Environment Variables
   - Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

## Troubleshooting

**Error: "extension 'uuid-ossp' does not exist"**
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first

**Error: "relation already exists"**
- Tables already created, skip schema.sql or drop tables first

**Can't see tables in Table Editor**
- Refresh the page
- Check SQL Editor for error messages

**RLS policies not working**
- Ensure RLS is enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Check policies exist in Table → Policies tab

## Useful SQL Commands

```sql
-- Check all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count rows in a table
SELECT COUNT(*) FROM profiles;

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Drop all tables (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
