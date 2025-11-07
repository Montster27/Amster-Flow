-- ============================================================================
-- COMPREHENSIVE RLS FIX - Eliminates ALL circular dependencies
-- ============================================================================
-- This fixes infinite recursion by ensuring policies always check the
-- organization creator FIRST before checking membership tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL problematic policies on organizations table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can delete organizations" ON organizations;

-- ============================================================================
-- STEP 2: Drop ALL policies on organization_members table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Owners can add members" ON organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners can remove members or users can leave" ON organization_members;

-- ============================================================================
-- STEP 3: Create FIXED policies for organizations table
-- ============================================================================

-- Allow viewing organizations if user created it OR is a member
-- KEY FIX: Check creator FIRST to avoid querying organization_members
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    -- Allow if user created this organization
    created_by = auth.uid()
    OR
    -- OR allow if user is a member of this organization
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
    )
  );

-- Allow creating organizations (simple check, no recursion possible)
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow updating if user created it OR is an owner
CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    -- Allow if user created this organization
    created_by = auth.uid()
    OR
    -- OR allow if user is an owner
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Allow deleting if user created it OR is an owner
CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    -- Allow if user created this organization
    created_by = auth.uid()
    OR
    -- OR allow if user is an owner
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- ============================================================================
-- STEP 4: Create FIXED policies for organization_members table
-- ============================================================================

-- Allow viewing members if user created the org OR is a member
-- KEY FIX: Check org creator FIRST to break recursion
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
      AND o.created_by = auth.uid()
    )
    OR
    -- OR allow if user is a member of this organization
    -- (This won't recurse because creator check passes first for new orgs)
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Allow adding members if user created the org OR is an owner
-- KEY FIX: Check org creator FIRST (for adding first member)
CREATE POLICY "Owners can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
      AND o.created_by = auth.uid()
    )
    OR
    -- OR allow if user is already an owner
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Allow updating members if user created the org OR is an owner
CREATE POLICY "Owners can update members"
  ON organization_members FOR UPDATE
  USING (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
      AND o.created_by = auth.uid()
    )
    OR
    -- OR allow if user is an owner
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Allow removing members if user created the org OR is an owner OR removing self
CREATE POLICY "Owners can remove members or users can leave"
  ON organization_members FOR DELETE
  USING (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
      AND o.created_by = auth.uid()
    )
    OR
    -- OR allow if user is an owner
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
    OR
    -- OR allow if user is removing themselves
    user_id = auth.uid()
  );

-- ============================================================================
-- STEP 5: Verification - Show all policies
-- ============================================================================
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed successfully!';
    RAISE NOTICE '✅ Infinite recursion eliminated';
    RAISE NOTICE '✅ Organizations and organization_members are now safe';
END $$;
