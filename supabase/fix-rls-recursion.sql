-- Fix infinite recursion in organization_members policy
-- This allows the organization creator to add themselves as the first member

-- Drop the problematic policy
DROP POLICY IF EXISTS "Owners can add members" ON organization_members;

-- Recreate with fix: Allow org creator OR existing owners to add members
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
