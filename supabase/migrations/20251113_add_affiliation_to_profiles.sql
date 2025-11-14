-- ============================================================================
-- Add Affiliation Field to Profiles
-- Tracks which organization/program a user is affiliated with
-- ============================================================================

-- Add affiliation column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS affiliation TEXT DEFAULT NULL;

-- Add index for efficient filtering by affiliation
CREATE INDEX IF NOT EXISTS idx_profiles_affiliation ON profiles(affiliation);

-- Add comment for documentation
COMMENT ON COLUMN profiles.affiliation IS 'User affiliation/organization (e.g., Auxilium, MIT Sandbox, Explorer, Masa, Brown University, or custom value)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Affiliation column added to profiles table successfully!';
    RAISE NOTICE '📊 Users can now specify their organization/program affiliation';
END $$;
