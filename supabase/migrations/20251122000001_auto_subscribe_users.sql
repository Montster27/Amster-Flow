-- Function to automatically subscribe new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email, status)
  VALUES (NEW.email, 'subscribed')
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
-- Note: We attach this to public.profiles because that's where we have the email readily available and it's a public table.
-- If profiles doesn't have email (it does in this schema), we'd need to use auth.users which is trickier with permissions.
-- Looking at schema.sql, profiles has email.
DROP TRIGGER IF EXISTS on_auth_user_created_newsletter ON public.profiles;
CREATE TRIGGER on_auth_user_created_newsletter
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Backfill existing users
INSERT INTO public.newsletter_subscribers (email, status)
SELECT email, 'subscribed'
FROM public.profiles
ON CONFLICT (email) DO NOTHING;
