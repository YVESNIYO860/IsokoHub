BEGIN;

CREATE TABLE IF NOT EXISTS public.shops (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shops'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.shops', existing_policy.policyname);
  END LOOP;
END;
$$;

REVOKE ALL ON public.shops FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.shops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shops TO authenticated;

DROP POLICY IF EXISTS shops_public_read ON public.shops;
CREATE POLICY shops_public_read
  ON public.shops FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS shops_owner_insert ON public.shops;
CREATE POLICY shops_owner_insert
  ON public.shops FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.is_active = true
        AND profile.is_verified = true
    )
  );

DROP POLICY IF EXISTS shops_owner_update ON public.shops;
CREATE POLICY shops_owner_update
  ON public.shops FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.is_active = true
        AND profile.is_verified = true
    )
  );

DROP POLICY IF EXISTS shops_owner_delete ON public.shops;
CREATE POLICY shops_owner_delete
  ON public.shops FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS shops_admin_insert ON public.shops;
CREATE POLICY shops_admin_insert
  ON public.shops FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_isokohub_admin()));

DROP POLICY IF EXISTS shops_admin_update ON public.shops;
CREATE POLICY shops_admin_update
  ON public.shops FOR UPDATE TO authenticated
  USING ((SELECT public.is_isokohub_admin()))
  WITH CHECK ((SELECT public.is_isokohub_admin()));

DROP POLICY IF EXISTS shops_admin_delete ON public.shops;
CREATE POLICY shops_admin_delete
  ON public.shops FOR DELETE TO authenticated
  USING ((SELECT public.is_isokohub_admin()));

CREATE OR REPLACE FUNCTION public.protect_shop_product_assignments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_products jsonb := coalesce(to_jsonb(NEW)->'products', '[]'::jsonb);
  assigned_product_id text;
BEGIN
  IF (SELECT auth.role()) = 'service_role' OR (SELECT public.is_isokohub_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'A shop must belong to the signed-in seller';
  END IF;

  IF jsonb_typeof(assigned_products) <> 'array' THEN
    RAISE EXCEPTION 'Shop products must be an array';
  END IF;

  FOR assigned_product_id IN
    SELECT jsonb_array_elements_text(assigned_products)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.products AS product
      WHERE product.id::text = assigned_product_id
        AND product.seller_id = (SELECT auth.uid())
    ) THEN
      RAISE EXCEPTION 'A shop can only contain the signed-in seller products';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_shop_product_assignments ON public.shops;
CREATE TRIGGER protect_shop_product_assignments
BEFORE INSERT OR UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.protect_shop_product_assignments();

COMMIT;
