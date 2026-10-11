-- Limit authenticated users to five Cloudflare image edits per UTC day.
-- Apply in Supabase SQL Editor before enabling the Vercel image-edit route.

BEGIN;

CREATE TABLE IF NOT EXISTS public.image_edit_daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  edit_count integer NOT NULL DEFAULT 0 CHECK (edit_count >= 0),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.image_edit_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.image_edit_daily_usage FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_image_edit_quota()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := (SELECT auth.uid());
  next_edit_count integer;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.image_edit_daily_usage AS usage_row
    (user_id, usage_date, edit_count)
  VALUES
    (current_user_id, (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET edit_count = usage_row.edit_count + 1
  WHERE usage_row.edit_count < 5
  RETURNING usage_row.edit_count INTO next_edit_count;

  RETURN next_edit_count IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_image_edit_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_image_edit_quota() TO authenticated;

COMMIT;