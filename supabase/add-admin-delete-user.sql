-- ============================================================================
-- ADD ADMIN USER DELETION FUNCTIONALITY
-- Allows admin users to delete users and their associated data
-- ============================================================================

-- ============================================================================
-- DELETE RLS POLICIES FOR ADMINS
-- ============================================================================

-- Allow admins to delete from profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (is_admin());

-- Allow admins to delete from organizations (if needed for cleanup)
CREATE POLICY "Admins can delete organizations"
  ON organizations FOR DELETE
  USING (is_admin());

-- Allow admins to delete from organization_members
CREATE POLICY "Admins can delete organization members"
  ON organization_members FOR DELETE
  USING (is_admin());

-- ============================================================================
-- ADMIN DELETE USER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_admin(user_id UUID)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only admins can delete users'
    );
  END IF;

  -- Prevent admin from deleting themselves
  IF user_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You cannot delete your own account'
    );
  END IF;

  -- Delete the user's profile (this will cascade to all related data)
  DELETE FROM public.profiles WHERE id = user_id;

  -- Note: To fully delete from auth.users, you need to use Supabase Admin API
  -- or manually delete from the Supabase dashboard after profile deletion

  RETURN json_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION delete_user_admin TO authenticated;

-- ============================================================================
-- UPDATE FOREIGN KEY CONSTRAINTS FOR CASCADE DELETES
-- ============================================================================

-- Drop existing foreign keys and recreate with CASCADE
-- This ensures when we delete a user, all their data is cleaned up

-- Organization members
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey,
ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Projects
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_created_by_fkey,
ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Project modules
ALTER TABLE project_modules
DROP CONSTRAINT IF EXISTS project_modules_updated_by_fkey,
ADD CONSTRAINT project_modules_updated_by_fkey
  FOREIGN KEY (updated_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Project assumptions
ALTER TABLE project_assumptions
DROP CONSTRAINT IF EXISTS project_assumptions_created_by_fkey,
ADD CONSTRAINT project_assumptions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Project interviews
ALTER TABLE project_interviews
DROP CONSTRAINT IF EXISTS project_interviews_created_by_fkey,
ADD CONSTRAINT project_interviews_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Project iterations
ALTER TABLE project_iterations
DROP CONSTRAINT IF EXISTS project_iterations_created_by_fkey,
ADD CONSTRAINT project_iterations_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Project competitors
ALTER TABLE project_competitors
DROP CONSTRAINT IF EXISTS project_competitors_created_by_fkey,
ADD CONSTRAINT project_competitors_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Project decision makers
ALTER TABLE project_decision_makers
DROP CONSTRAINT IF EXISTS project_decision_makers_created_by_fkey,
ADD CONSTRAINT project_decision_makers_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Project first target
ALTER TABLE project_first_target
DROP CONSTRAINT IF EXISTS project_first_target_updated_by_fkey,
ADD CONSTRAINT project_first_target_updated_by_fkey
  FOREIGN KEY (updated_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin user deletion functionality added!';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Admins can now:';
    RAISE NOTICE '   - Delete user profiles';
    RAISE NOTICE '   - All user data is cascade deleted';
    RAISE NOTICE '   - Cannot delete their own account';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: User deletion is permanent and cannot be undone';
END $$;
