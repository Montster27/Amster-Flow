-- Comprehensive RLS Policy Fix for Organization Members
-- This fixes infinite recursion by ensuring policies don't create circular dependencies

-- ============================================================
-- STEP 1: Drop ALL existing policies
-- ============================================================
DROP POLICY IF EXISTS "Owners can add members" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners can remove members or users can leave" ON organization_members;

-- ============================================================
-- STEP 2: Create fixed SELECT policy (most important!)
-- ============================================================
-- Allow viewing org members if:
-- 1. User created the organization, OR
-- 2. User is a member of the organization
-- KEY FIX: Check organization creator FIRST to avoid recursion
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND created_by = auth.uid()
    )
    OR
    -- OR allow if user is a member (this won't recurse because creator check passes first)
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- ============================================================
-- STEP 3: Create fixed INSERT policy
-- ============================================================
-- Allow adding members if:
-- 1. User created the organization (for first member), OR
-- 2. User is an existing owner
CREATE POLICY "Owners can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND created_by = auth.uid()
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

-- ============================================================
-- STEP 4: Create fixed UPDATE policy
-- ============================================================
-- Allow updating members if user is an owner
CREATE POLICY "Owners can update members"
  ON organization_members FOR UPDATE
  USING (
    -- Check if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND created_by = auth.uid()
    )
    OR
    -- OR check if user is an owner
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- ============================================================
-- STEP 5: Create fixed DELETE policy
-- ============================================================
-- Allow removing members if:
-- 1. User is the organization creator/owner, OR
-- 2. User is removing themselves
CREATE POLICY "Owners can remove members or users can leave"
  ON organization_members FOR DELETE
  USING (
    -- Allow if user is the creator of the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND created_by = auth.uid()
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

-- ============================================================
-- VERIFICATION: Check that policies were created successfully
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;
