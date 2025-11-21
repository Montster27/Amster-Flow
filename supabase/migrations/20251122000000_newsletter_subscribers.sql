-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  unsubscribe_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to subscribe (insert)
CREATE POLICY "Allow public subscription" ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Allow public to read (for unsubscribe verification)
-- Note: In a stricter system, we might want to limit this, but for unsubscribe by token/email, we need some access.
-- A better approach for unsubscribe is to use a secure function, but for now we'll allow reading by token if we were doing it client side.
-- However, since we are using an Edge Function for everything, we technically don't need public RLS if we use Service Role in the function.
-- But let's keep it simple and secure: Only Service Role should probably manage this table if we go full Edge Function.
-- Actually, let's allow the Edge Function (Service Role) to do everything.
-- But if we want to query it from the frontend (e.g. "Am I subscribed?"), we might need RLS.
-- Let's stick to the plan: Edge Function handles logic.
-- So we can leave RLS enabled but no public policies, OR specific policies.

-- Let's add a policy for the Service Role (implicit full access) and maybe a policy for users to see their own subscription if they are logged in?
-- For now, let's just create the table. The Edge Function will use the Service Role key to bypass RLS.

-- Add index for performance
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_token ON newsletter_subscribers(unsubscribe_token);

-- Trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
