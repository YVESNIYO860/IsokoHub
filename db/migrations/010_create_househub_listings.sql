-- HouseHub's dedicated property listing table.
-- Run after 007_create_househub_table.sql and 008_update_sync_househub_trigger.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.househub_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  property_type text,
  listing_type text,
  price bigint,
  currency text NOT NULL DEFAULT 'RWF',
  payment_period text NOT NULL DEFAULT 'Monthly',
  bedrooms integer CHECK (bedrooms IS NULL OR bedrooms >= 0),
  bathrooms integer CHECK (bathrooms IS NULL OR bathrooms >= 0),
  furnished text,
  amenities text,
  district text,
  location text,
  description text,
  image text[] DEFAULT ARRAY[]::text[],
  video_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.househub_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS househub_public_read_approved ON public.househub_listings;
CREATE POLICY househub_public_read_approved
  ON public.househub_listings FOR SELECT
  USING (status = 'approved' OR auth.uid() = seller_id);

DROP POLICY IF EXISTS househub_seller_insert ON public.househub_listings;
CREATE POLICY househub_seller_insert
  ON public.househub_listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');

DROP POLICY IF EXISTS househub_seller_update ON public.househub_listings;
CREATE POLICY househub_seller_update
  ON public.househub_listings FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND status IN ('pending', 'approved', 'rejected'));

DROP POLICY IF EXISTS househub_admin_manage ON public.househub_listings;
CREATE POLICY househub_admin_manage
  ON public.househub_listings FOR ALL TO authenticated
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX IF NOT EXISTS househub_listings_status_idx ON public.househub_listings(status);
CREATE INDEX IF NOT EXISTS househub_listings_district_idx ON public.househub_listings(district);
CREATE INDEX IF NOT EXISTS househub_listings_listing_type_idx ON public.househub_listings(listing_type);
CREATE INDEX IF NOT EXISTS househub_listings_created_at_idx ON public.househub_listings(created_at DESC);

ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS payment_period text DEFAULT 'Monthly';
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS bedrooms integer;
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS bathrooms integer;
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS furnished text;
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS amenities text;
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.househub_listings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.househub_listings'::regclass
      AND conname = 'househub_listings_product_id_key'
  ) THEN
    ALTER TABLE public.househub_listings
      ADD CONSTRAINT househub_listings_product_id_key UNIQUE (product_id);
  END IF;
END $$;

COMMIT;
