-- Add optional minimum and maximum prices while retaining products.price
-- as the lower-bound value for existing sorting and reporting behavior.
BEGIN;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS price_min numeric(12,2),
  ADD COLUMN IF NOT EXISTS price_max numeric(12,2);

ALTER TABLE IF EXISTS public.househub_listings
  ADD COLUMN IF NOT EXISTS price_min numeric(12,2),
  ADD COLUMN IF NOT EXISTS price_max numeric(12,2);

COMMIT;