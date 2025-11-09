# ArmsterFlow Database Analysis Report
Generated: 2025-11-07

## Executive Summary
This report identifies **8 critical issues** and **5 warnings** in the ArmsterFlow database schema, migrations, and RLS policies.

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Tables in Main Schema**
**Severity:** Critical
**Impact:** New deployments will be missing essential tables

**Problem:**
- `schema.sql` does not include `notifications` table
- `schema.sql` does not include `project_module_completion` table

These tables were added via migrations but never added to the base schema.

**Risk:**
- Fresh database deployments from schema.sql will be incomplete
- Resets using schema.sql will lose these tables
- Documentation is misleading about the actual database structure

**Recommendation:**
Update `schema.sql` to include both tables, or create a clear migration ordering system.

---

### 2. **Duplicate Function Definitions**
**Severity:** Critical
**Impact:** Function conflicts causing unpredictable behavior

**Problem:**
Two similar but different functions exist:
- `user_can_edit_project()` in `rls-policies.sql` (lines 208-219)
- `user_can_edit_project_check()` in `enforce-viewer-readonly-access.sql` (lines 13-33)

**Differences:**
```sql
-- Original (rls-policies.sql)
CREATE OR REPLACE FUNCTION user_can_edit_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = project_uuid
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New version (enforce-viewer-readonly-access.sql)
CREATE OR REPLACE FUNCTION user_can_edit_project_check(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    is_admin()  -- NEW: Admin check added
    OR
    EXISTS (...)
  );
END;
$$;
```

**Risk:**
- Policies referencing old function name won't include admin bypass
- Inconsistent behavior between different policies
- Confusion about which function to use

**Recommendation:**
Consolidate into one function with admin check, update all policies to use it.

---

### 3. **Conflicting RLS Policies on Projects Table**
**Severity:** Critical
**Impact:** Last migration wins, previous policies may be orphaned

**Problem:**
The `projects` table has policies defined in THREE different files:
1. `rls-policies.sql` - Original policies
2. `fix-project-visibility-rls.sql` - Drops and recreates policies
3. `enforce-viewer-readonly-access.sql` - Drops and recreates policies AGAIN

**Policy Evolution:**
```sql
-- rls-policies.sql (original)
"Users can view org projects"
"Editors can create projects"
"Editors can update projects"
"Owners can delete projects"

-- fix-project-visibility-rls.sql (migration 1)
DROP POLICY "Users can view projects in their organizations"  -- Different name!
DROP POLICY "Enable read access for all users"  -- Never existed in rls-policies.sql
CREATE POLICY "Users can view projects in their organizations"

-- enforce-viewer-readonly-access.sql (migration 2)
DROP POLICY "Users can view projects in their organizations"  -- Drops above
DROP POLICY "Users can edit projects in their organizations"  -- Different name again!
CREATE POLICY "Organization members can view projects"  -- New name
CREATE POLICY "Only editors and owners can update projects"  -- New name
```

**Risk:**
- Policy names keep changing, making it unclear which is active
- Multiple DROP statements for policies that may not exist (harmless but messy)
- If migrations run out of order, policies may be missing
- Hard to audit which policy is actually protecting the table

**Recommendation:**
Create a definitive migration that:
1. Drops ALL possible policy name variations
2. Creates final policies with clear, consistent names
3. Documents the final state

---

### 4. **Missing Admin Policies on Critical Tables**
**Severity:** High
**Impact:** Admins cannot view essential data

**Problem:**
`add-admin-rls-policies.sql` only adds admin SELECT policies for:
- profiles
- organizations
- organization_members
- projects
- project_modules
- project_module_completion

**Missing admin policies for:**
- ❌ project_assumptions
- ❌ project_interviews
- ❌ project_iterations
- ❌ project_competitors
- ❌ project_decision_makers
- ❌ project_first_target
- ❌ notifications

**Risk:**
Admin users cannot view Discovery or Sector Map data in admin interface.

**Recommendation:**
Add admin SELECT policies for all missing tables.

---

### 5. **Incorrect Policy on project_module_completion**
**Severity:** High
**Impact:** Viewers can edit completion status (should be read-only)

**Problem:**
In `add-module-completion-tracking.sql` (lines 40-49):
```sql
CREATE POLICY "Users can manage module completion for their projects"
  ON project_module_completion FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_module_completion.project_id
      AND om.user_id = auth.uid()  -- ❌ NO ROLE CHECK
    )
  );
```

This allows ALL organization members (including viewers) to mark modules complete.

**Later Fixed:**
`enforce-viewer-readonly-access.sql` (lines 161-164) fixes this:
```sql
CREATE POLICY "Only editors and owners can manage module completion"
  ON project_module_completion FOR ALL
  USING (user_can_edit_project_check(project_id))
  WITH CHECK (user_can_edit_project_check(project_id));
```

**Risk:**
If migrations run out of order, viewers can mark modules complete.

**Recommendation:**
Update `add-module-completion-tracking.sql` to include role check from the start.

---

### 6. **Foreign Key Cascade Inconsistency**
**Severity:** Medium
**Impact:** Orphaned records possible

**Problem:**
`schema.sql` defines:
```sql
-- Line 27
created_by UUID REFERENCES profiles(id) NOT NULL
```

No CASCADE specified. But `add-admin-delete-user.sql` adds:
```sql
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey,
ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;
```

**Missing CASCADE on:**
- `organizations.created_by` → profiles(id)
- `projects.created_by` → profiles(id)
- All `updated_by` and `created_by` foreign keys

**Risk:**
If a profile is deleted, records referencing it via created_by/updated_by will remain, causing:
- Orphaned data
- Broken queries joining to profiles
- Admin interface errors

**Recommendation:**
Add ON DELETE CASCADE or ON DELETE SET NULL to all profile foreign keys.

---

### 7. **Notifications System Overly Permissive**
**Severity:** High (Security)
**Impact:** Any authenticated user can create fake notifications

**Problem:**
In `add-notifications-table.sql` (lines 43-45):
```sql
-- System can insert notifications (via SECURITY DEFINER functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);  -- ❌ ALLOWS ANYONE TO INSERT
```

**Risk:**
- Any authenticated user can create notifications for ANY other user
- Spam attacks possible
- Social engineering attacks (fake admin messages)
- No audit trail of who created notification

**Recommendation:**
Change to:
```sql
-- Only SECURITY DEFINER functions can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    current_setting('role') = 'service_role'
    OR
    is_admin()
  );
```

Or better yet, remove this policy and only insert via SECURITY DEFINER functions.

---

### 8. **Missing Indexes on Critical Join Columns**
**Severity:** Medium (Performance)
**Impact:** Slow queries on admin interface and RLS checks

**Problem:**
No index on:
- `profiles.is_admin` - checked on EVERY request by is_admin()
- `profiles.email` - used in lookups by invite functions
- `organization_members.role` - filtered in most RLS policies

**Recommendation:**
Add indexes:
```sql
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_org_members_role ON organization_members(role);
```

---

## ⚠️ WARNINGS

### W1. Inconsistent Timestamp Column Names
- Most tables use `created_at` and `updated_at`
- `organization_members` uses `joined_at` instead of `created_at`
- `project_module_completion` uses `completed_at` in addition to standard columns

**Recommendation:** Standardize on created_at/updated_at everywhere.

---

### W2. Missing Updated Triggers
The following tables have updated_at but no trigger:
- `project_decision_makers`

**Recommendation:** Add trigger or remove column.

---

### W3. Schema Comments Missing
No comments on tables or columns explaining:
- What each table stores
- Complex CHECK constraints
- Enum values and their meanings

**Recommendation:** Add COMMENT ON statements.

---

### W4. No Soft Delete Strategy
All deletes are hard deletes (ON DELETE CASCADE). Consider:
- Audit requirements (who deleted what, when)
- Accidental deletion recovery
- GDPR right-to-erasure vs business records

**Recommendation:** Document deletion policy and consider soft deletes for critical tables.

---

### W5. Auto-Join Trigger Creates Hidden Dependency
`add-auto-join-project.sql` creates trigger that searches for project by name:
```sql
WHERE p.name ILIKE '%walking%sun%'
```

**Risks:**
- If project is renamed, trigger fails silently
- If project is deleted, trigger fails silently
- New users won't know they've been auto-added
- No way to disable auto-join without dropping trigger

**Recommendation:**
- Use project UUID instead of name search
- Add configuration table for auto-join settings
- Log when auto-join happens

---

## 📊 Summary Statistics

| Category | Count |
|----------|-------|
| Total Tables | 14 |
| Tables with RLS Enabled | 14 |
| Total RLS Policies | ~70+ |
| Helper Functions | 8 |
| Triggers | 13+ |
| Critical Issues | 8 |
| Warnings | 5 |

---

## 🔧 Recommended Action Plan

### Phase 1: Critical Fixes (Do Immediately)
1. ✅ Consolidate `user_can_edit_project` functions
2. ✅ Add missing admin SELECT policies
3. ✅ Fix notifications INSERT policy
4. ✅ Add missing indexes (is_admin, email, role)

### Phase 2: Schema Cleanup (Do Soon)
5. ⚠️ Update schema.sql to include all tables
6. ⚠️ Add CASCADE to created_by/updated_by foreign keys
7. ⚠️ Clean up policy naming (one definitive migration)

### Phase 3: Documentation & Best Practices (Do Eventually)
8. 📝 Add schema comments
9. 📝 Document migration order
10. 📝 Soft delete strategy decision

---

## 🎯 Next Steps

**Immediate:**
Create a migration file: `supabase/fix-critical-database-issues.sql` that:
- Consolidates functions
- Adds missing policies
- Fixes security issues
- Adds performance indexes

**Short-term:**
Create `schema-v2.sql` that represents the TRUE current state of the database.

**Long-term:**
Set up automated schema documentation and policy auditing.

---

## Contact
For questions about this report, consult the database documentation or reach out to the development team.
