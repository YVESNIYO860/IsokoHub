-- Add an optional single color description to product listings.
BEGIN;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS color text;

COMMIT;
