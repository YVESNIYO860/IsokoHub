-- Add admin-managed account enablement and require seller approval for listings.
-- Run after migrations 013 and 016.
BEGIN;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

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
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
    OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Only an administrator can change account privileges';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_verified_seller_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' OR public.is_isokohub_admin() THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND is_verified = true
  ) THEN
    RAISE EXCEPTION 'Your account needs admin approval before you can manage listings.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_verified_seller_products ON public.products;
CREATE TRIGGER require_verified_seller_products
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.require_verified_seller_listing();

DROP TRIGGER IF EXISTS require_verified_seller_househub ON public.househub_listings;
CREATE TRIGGER require_verified_seller_househub
BEFORE INSERT OR UPDATE ON public.househub_listings
FOR EACH ROW
EXECUTE FUNCTION public.require_verified_seller_listing();

COMMIT;