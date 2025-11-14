-- ============================================================================
-- Audit Log System for Security and Compliance
-- Tracks authentication events, role changes, and member operations
-- ============================================================================

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth.signup',
    'auth.login',
    'auth.logout',
    'auth.password_reset',
    'auth.email_change',
    'member.added',
    'member.removed',
    'member.role_changed',
    'project.created',
    'project.deleted',
    'organization.created',
    'organization.deleted'
  )),

  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,

  -- Target information (for member/project operations)
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  target_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Event details
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Request information
  ip_address INET,
  user_agent TEXT,

  -- Success/failure
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_organization ON audit_log(target_organization_id) WHERE target_organization_id IS NOT NULL;
CREATE INDEX idx_audit_log_success ON audit_log(success) WHERE success = FALSE;

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_log
  FOR SELECT
  USING (is_admin());

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Organization owners can view logs for their organization
CREATE POLICY "Organization owners can view organization audit logs"
  ON audit_log
  FOR SELECT
  USING (
    target_organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Only system (via service role) can insert audit logs
-- No policy needed - use SECURITY DEFINER functions

-- ============================================================================
-- Helper Functions for Audit Logging
-- ============================================================================

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_user_email TEXT,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (
    event_type,
    user_id,
    user_email,
    success,
    error_message,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_user_email,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to log member operations
CREATE OR REPLACE FUNCTION log_member_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_target_user_id UUID,
  p_organization_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  INSERT INTO audit_log (
    event_type,
    user_id,
    user_email,
    target_user_id,
    target_organization_id,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    v_user_email,
    p_target_user_id,
    p_organization_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- Automatic Triggers for Audit Logging
-- ============================================================================

-- Trigger function for organization_members changes
CREATE OR REPLACE FUNCTION audit_organization_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log member addition
    PERFORM log_member_event(
      'member.added',
      auth.uid(),
      NEW.user_id,
      NEW.organization_id,
      jsonb_build_object('role', NEW.role)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    -- Log role change
    PERFORM log_member_event(
      'member.role_changed',
      auth.uid(),
      NEW.user_id,
      NEW.organization_id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    -- Log member removal
    PERFORM log_member_event(
      'member.removed',
      auth.uid(),
      OLD.user_id,
      OLD.organization_id,
      jsonb_build_object('role', OLD.role)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for organization_members
DROP TRIGGER IF EXISTS audit_organization_members_trigger ON organization_members;
CREATE TRIGGER audit_organization_members_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION audit_organization_members();

-- ============================================================================
-- Data Retention Policy
-- ============================================================================

-- Function to clean up old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND event_type NOT IN ('member.role_changed', 'organization.deleted'); -- Keep critical events longer

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_member_event TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Audit log system created successfully!';
  RAISE NOTICE '📊 Event types: auth.*, member.*, project.*, organization.*';
  RAISE NOTICE '🔒 RLS enabled: Users see own logs, org owners see org logs, admins see all';
  RAISE NOTICE '🔄 Automatic triggers: organization_members changes logged automatically';
  RAISE NOTICE '🗑️  Retention: 90 days (except critical events)';
END $$;
