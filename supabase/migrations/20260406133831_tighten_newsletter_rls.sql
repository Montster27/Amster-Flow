-- Tighten newsletter_subscribers RLS policies
-- Previously: any authenticated user could read ALL subscriber emails
-- Now: only admins can view subscriber list; users can view own record

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Allow authenticated users to view subscribers" ON newsletter_subscribers;

-- Only admins can read the full subscriber list
CREATE POLICY "Only admins can view subscribers"
ON newsletter_subscribers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Users can read their own subscription record (needed for unsubscribe UI)
CREATE POLICY "Users can view own subscription"
ON newsletter_subscribers FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Revoke blanket GRANT ALL from anon/authenticated
REVOKE ALL ON TABLE newsletter_subscribers FROM anon;
REVOKE ALL ON TABLE newsletter_subscribers FROM authenticated;

-- Grant only INSERT to anon (for public subscribe form, controlled by RLS)
GRANT INSERT ON TABLE newsletter_subscribers TO anon;
-- Grant SELECT, INSERT, UPDATE to authenticated (controlled by RLS policies above)
GRANT SELECT, INSERT, UPDATE ON TABLE newsletter_subscribers TO authenticated;
