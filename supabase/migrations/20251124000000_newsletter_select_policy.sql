-- Add SELECT policy for newsletter_subscribers table
-- This allows authenticated users to view subscriber statistics

-- Drop existing policy if it exists (in case of re-run)
DROP POLICY IF EXISTS "Allow authenticated users to view subscribers" ON newsletter_subscribers;

-- Create policy to allow authenticated users to SELECT from newsletter_subscribers
CREATE POLICY "Allow authenticated users to view subscribers"
ON newsletter_subscribers
FOR SELECT
USING (auth.role() = 'authenticated');

-- Verify policies are set correctly
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'newsletter_subscribers'
ORDER BY policyname;
