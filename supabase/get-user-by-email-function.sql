-- Create function to get user by email from auth.users
-- This is needed because client cannot query auth.users directly
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email::TEXT
  FROM auth.users au
  WHERE au.email = user_email
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;

-- Test the function
SELECT * FROM get_user_by_email('monty.sharma@gmail.com');
