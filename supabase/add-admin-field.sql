-- ============================================================================
-- ADD ADMIN FIELD TO PROFILES
-- This migration adds an is_admin field to track admin users
-- ============================================================================

-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Set monty.sharma@gmail.com as admin
UPDATE profiles
SET is_admin = true
WHERE email = 'monty.sharma@gmail.com';

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Whether this user has admin privileges to view all users and projects';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin field added to profiles table!';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 monty.sharma@gmail.com has been set as admin';
    RAISE NOTICE '';
    RAISE NOTICE 'To add more admins, run:';
    RAISE NOTICE '  UPDATE profiles SET is_admin = true WHERE email = ''user@example.com'';';
END $$;
