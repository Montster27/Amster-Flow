-- ============================================================================
-- FIX PROFILES RLS - Allow org members to view each other's profiles
-- ============================================================================
-- This allows organization members to see profiles of other members in their
-- organization, which is needed for the team members page to display emails.

-- Add policy to allow organization members to view each other's profiles
CREATE POLICY "Organization members can view each other's profiles"
  ON profiles FOR SELECT
  USING (
    -- User can view profiles of other users in the same organization
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = profiles.id
    )
  );

-- Verify policies
DO $$
BEGIN
    RAISE NOTICE 'Profiles RLS policy added successfully!';
    RAISE NOTICE 'Organization members can now view each other''s profiles';
END $$;
