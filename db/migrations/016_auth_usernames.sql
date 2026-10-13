-- Add unique usernames for account login. The service-side login endpoint
-- resolves usernames only after validating the supplied password.
BEGIN;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_uidx
  ON public.user_profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, username, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(lower(NEW.raw_user_meta_data->>'username'), ''),
    'seller',
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.user_profiles.full_name),
        username = COALESCE(EXCLUDED.username, public.user_profiles.username);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_auth_user_profile ON auth.users;
CREATE TRIGGER create_auth_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_auth_user_profile();

COMMIT;