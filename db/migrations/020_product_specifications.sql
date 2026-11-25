-- Store flexible product attributes without adding a database column for each category.
BEGIN;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS color text;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
