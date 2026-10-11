-- Add the site visit table and tighten browser-facing write permissions.
-- Run after migrations 002-012 and after creating public.user_profiles.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_isokohub_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users AS account
    WHERE account.id = (SELECT auth.uid())
      AND lower(account.email) = lower('yvesniyonkuru2022@gmail.com')
      AND account.email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_isokohub_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_isokohub_admin() TO authenticated;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'seller',
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- The application currently has one hard-coded admin account. Revoke any
-- admin role not belonging to that confirmed account before enforcing changes.
UPDATE public.user_profiles AS profile
SET role = 'seller'
WHERE profile.role = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM auth.users AS account
    WHERE account.id = profile.id
      AND lower(account.email) = lower('yvesniyonkuru2022@gmail.com')
      AND account.email_confirmed_at IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.protect_user_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' OR public.is_isokohub_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'seller';
    NEW.is_verified := false;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    RAISE EXCEPTION 'Only an administrator can change profile privileges';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_privileges ON public.user_profiles;
CREATE TRIGGER protect_user_profile_privileges
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_profile_privileges();

CREATE OR REPLACE FUNCTION public.protect_listing_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_record jsonb := to_jsonb(NEW);
  old_record jsonb;
BEGIN
  IF (SELECT auth.role()) = 'service_role' OR public.is_isokohub_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF new_record ? 'status' AND coalesce(new_record->>'status', 'pending') <> 'pending' THEN
      RAISE EXCEPTION 'New listings must be submitted as pending';
    END IF;
    IF new_record ? 'is_ad' AND coalesce((new_record->>'is_ad')::boolean, false) THEN
      RAISE EXCEPTION 'Only an administrator can activate an advertisement';
    END IF;
    RETURN NEW;
  END IF;

  old_record := to_jsonb(OLD);
  IF new_record->'status' IS DISTINCT FROM old_record->'status'
    OR new_record->'is_ad' IS DISTINCT FROM old_record->'is_ad' THEN
    RAISE EXCEPTION 'Only an administrator can change listing approval or ad status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_product_moderation_fields ON public.products;
CREATE TRIGGER protect_product_moderation_fields
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.protect_listing_moderation_fields();

DROP TRIGGER IF EXISTS protect_househub_moderation_fields ON public.househub_listings;
CREATE TRIGGER protect_househub_moderation_fields
BEFORE INSERT OR UPDATE ON public.househub_listings
FOR EACH ROW
EXECUTE FUNCTION public.protect_listing_moderation_fields();

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL CHECK (char_length(visitor_id) BETWEEN 1 AND 128),
  page text NOT NULL CHECK (char_length(page) BETWEEN 1 AND 512 AND left(page, 1) = '/'),
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visits_visited_at_idx
  ON public.site_visits(visited_at DESC);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.site_visits FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT ON public.site_visits TO authenticated;

DROP POLICY IF EXISTS site_visits_public_insert ON public.site_visits;
CREATE POLICY site_visits_public_insert
  ON public.site_visits FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(visitor_id) BETWEEN 1 AND 128
    AND char_length(page) BETWEEN 1 AND 512
    AND left(page, 1) = '/'
  );

DROP POLICY IF EXISTS site_visits_admin_read ON public.site_visits;
CREATE POLICY site_visits_admin_read
  ON public.site_visits FOR SELECT TO authenticated
  USING ((SELECT public.is_isokohub_admin()));

-- Capabilities must be provisioned by the trusted admin, never self-assigned.
DROP POLICY IF EXISTS user_capabilities_self_insert ON public.user_capabilities;
DROP POLICY IF EXISTS user_capabilities_self_update ON public.user_capabilities;
DROP POLICY IF EXISTS user_capabilities_admin_manage ON public.user_capabilities;
CREATE POLICY user_capabilities_admin_manage
  ON public.user_capabilities FOR ALL TO authenticated
  USING ((SELECT public.is_isokohub_admin()))
  WITH CHECK ((SELECT public.is_isokohub_admin()));

-- A signed-in user may only edit relationship rows they created.
DROP POLICY IF EXISTS isokolink_relations_authenticated_insert ON public.isokolink_relations;
CREATE POLICY isokolink_relations_authenticated_insert
  ON public.isokolink_relations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS isokolink_relations_owner_update ON public.isokolink_relations;
CREATE POLICY isokolink_relations_owner_update
  ON public.isokolink_relations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS isokolink_relations_admin_manage ON public.isokolink_relations;
CREATE POLICY isokolink_relations_admin_manage
  ON public.isokolink_relations FOR ALL TO authenticated
  USING ((SELECT public.is_isokohub_admin()))
  WITH CHECK ((SELECT public.is_isokohub_admin()));

-- Listing media is public to read but only its owner or the admin may manage it.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('house-videos', 'house-videos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS isokohub_storage_owner_upload ON storage.objects;
CREATE POLICY isokohub_storage_owner_upload
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    (bucket_id = 'product-images'
      AND left(name, char_length(auth.uid()::text) + 1) = (auth.uid()::text || '_'))
    OR (bucket_id = 'house-videos'
      AND (storage.foldername(name))[1] = auth.uid()::text)
  );

DROP POLICY IF EXISTS isokohub_storage_insert_guard ON storage.objects;
CREATE POLICY isokohub_storage_insert_guard
  ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id NOT IN ('product-images', 'house-videos')
    OR (bucket_id = 'product-images'
      AND left(name, char_length(auth.uid()::text) + 1) = (auth.uid()::text || '_'))
    OR (bucket_id = 'house-videos'
      AND (storage.foldername(name))[1] = auth.uid()::text)
  );

DROP POLICY IF EXISTS isokohub_storage_anon_insert_guard ON storage.objects;
CREATE POLICY isokohub_storage_anon_insert_guard
  ON storage.objects AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (bucket_id NOT IN ('product-images', 'house-videos'));

DROP POLICY IF EXISTS isokohub_storage_owner_delete ON storage.objects;
CREATE POLICY isokohub_storage_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    (bucket_id = 'product-images'
      AND left(name, char_length(auth.uid()::text) + 1) = (auth.uid()::text || '_'))
    OR (bucket_id = 'house-videos'
      AND (storage.foldername(name))[1] = auth.uid()::text)
    OR (SELECT public.is_isokohub_admin())
  );

DROP POLICY IF EXISTS isokohub_storage_delete_guard ON storage.objects;
CREATE POLICY isokohub_storage_delete_guard
  ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (
    bucket_id NOT IN ('product-images', 'house-videos')
    OR (bucket_id = 'product-images'
      AND left(name, char_length(auth.uid()::text) + 1) = (auth.uid()::text || '_'))
    OR (bucket_id = 'house-videos'
      AND (storage.foldername(name))[1] = auth.uid()::text)
    OR (SELECT public.is_isokohub_admin())
  );

DROP POLICY IF EXISTS isokohub_storage_anon_delete_guard ON storage.objects;
CREATE POLICY isokohub_storage_anon_delete_guard
  ON storage.objects AS RESTRICTIVE FOR DELETE TO anon
  USING (bucket_id NOT IN ('product-images', 'house-videos'));

-- These browser upload paths never use upsert; disallow object replacement.
DROP POLICY IF EXISTS isokohub_storage_update_guard ON storage.objects;
CREATE POLICY isokohub_storage_update_guard
  ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id NOT IN ('product-images', 'house-videos'))
  WITH CHECK (bucket_id NOT IN ('product-images', 'house-videos'));

COMMIT;
