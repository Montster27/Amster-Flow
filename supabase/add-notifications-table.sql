-- ============================================================================
-- IN-APP NOTIFICATIONS SYSTEM
-- Simple notification system for team invites and project updates
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('invite', 'project_created', 'role_changed', 'member_removed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications (via SECURITY DEFINER functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- UPDATE invite_user_to_organization TO CREATE NOTIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION invite_user_to_organization(
  p_organization_id UUID,
  p_user_email TEXT,
  p_role TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_member_exists BOOLEAN;
  v_org_name TEXT;
  v_inviter_email TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = p_organization_id;

  -- Get inviter email
  SELECT email INTO v_inviter_email
  FROM profiles
  WHERE id = auth.uid();

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No user found with this email. They need to sign up first.'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  -- Create profile if it doesn't exist
  IF NOT v_profile_exists THEN
    INSERT INTO profiles (id, email)
    VALUES (v_user_id, p_user_email)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = v_user_id
  ) INTO v_member_exists;

  IF v_member_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This user is already a member of this organization.'
    );
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, v_user_id, p_role);

  -- Create notification for invited user
  INSERT INTO notifications (user_id, organization_id, type, title, message, link)
  VALUES (
    v_user_id,
    p_organization_id,
    'invite',
    'You''ve been invited to a team!',
    format('%s invited you to join %s as %s', v_inviter_email, v_org_name, p_role),
    '/dashboard'
  );

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_user_email
  );
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Create notification for project creation
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_org_members_new_project()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_name TEXT;
  v_creator_email TEXT;
  v_member RECORD;
BEGIN
  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = NEW.organization_id;

  -- Get creator email
  SELECT email INTO v_creator_email
  FROM profiles
  WHERE id = NEW.created_by;

  -- Notify all org members except the creator
  FOR v_member IN
    SELECT user_id
    FROM organization_members
    WHERE organization_id = NEW.organization_id
    AND user_id != NEW.created_by
  LOOP
    INSERT INTO notifications (user_id, organization_id, type, title, message, link)
    VALUES (
      v_member.user_id,
      NEW.organization_id,
      'project_created',
      'New project created',
      format('%s created a new project: %s', v_creator_email, NEW.name),
      format('/project/%s', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new projects
DROP TRIGGER IF EXISTS trigger_notify_new_project ON projects;
CREATE TRIGGER trigger_notify_new_project
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_org_members_new_project();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Notifications system created successfully!';
    RAISE NOTICE 'Users will now receive in-app notifications for:';
    RAISE NOTICE '  - Team invites';
    RAISE NOTICE '  - New projects';
END $$;
