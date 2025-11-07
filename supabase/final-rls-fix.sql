-- ============================================================================
-- FINAL RLS FIX - Uses SECURITY DEFINER functions to break circular dependencies
-- ============================================================================
-- The problem: organizations and organization_members policies query each other
-- The solution: Use SECURITY DEFINER functions that bypass RLS
-- ============================================================================

-- ============================================================================
-- STEP 1: Create helper functions that bypass RLS
-- ============================================================================

-- Check if user is a member of an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is an owner of an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user created an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_creator(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organizations
    WHERE id = org_id
    AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Drop existing policies
-- ============================================================================

-- Drop organizations policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can delete organizations" ON organizations;

-- Drop organization_members policies
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Owners can add members" ON organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners can remove members or users can leave" ON organization_members;

-- ============================================================================
-- STEP 3: Recreate organizations policies using helper functions
-- ============================================================================

-- View organizations where user is creator OR member
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    created_by = auth.uid()
    OR
    is_organization_member(id)
  );

-- Create organizations (simple, no recursion possible)
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Update organizations where user is creator OR owner
CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    created_by = auth.uid()
    OR
    is_organization_owner(id)
  );

-- Delete organizations where user is creator OR owner
CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    is_organization_owner(id)
  );

-- ============================================================================
-- STEP 4: Recreate organization_members policies using helper functions
-- ============================================================================

-- View members where user is org creator OR is a member
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    is_organization_creator(organization_id)
    OR
    is_organization_member(organization_id)
  );

-- Add members where user is org creator OR is an owner
CREATE POLICY "Owners can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    is_organization_creator(organization_id)
    OR
    is_organization_owner(organization_id)
  );

-- Update members where user is org creator OR is an owner
CREATE POLICY "Owners can update members"
  ON organization_members FOR UPDATE
  USING (
    is_organization_creator(organization_id)
    OR
    is_organization_owner(organization_id)
  );

-- Remove members where user is org creator OR owner OR removing self
CREATE POLICY "Owners can remove members or users can leave"
  ON organization_members FOR DELETE
  USING (
    is_organization_creator(organization_id)
    OR
    is_organization_owner(organization_id)
    OR
    user_id = auth.uid()
  );

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

-- Show all functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'is_organization%'
ORDER BY routine_name;

-- Show all policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed with SECURITY DEFINER functions!';
    RAISE NOTICE '✅ Circular dependencies eliminated';
    RAISE NOTICE '✅ Functions bypass RLS to prevent recursion';
END $$;
