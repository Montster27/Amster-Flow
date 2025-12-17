-- Migration: Auto-create profile on user signup
-- This fixes the RLS issue where profile upsert fails because user isn't authenticated yet

-- Function to handle new user creation (runs with SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, affiliation)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'affiliation', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    affiliation = COALESCE(EXCLUDED.affiliation, profiles.affiliation),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists (in case it was created before)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Uses SECURITY DEFINER to bypass RLS since user is not yet authenticated.';
