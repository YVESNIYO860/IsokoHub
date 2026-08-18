-- Migration: add exclude_from_browse flag to products table
-- When true the product will be excluded from general browse lists (shown only on special pages)

BEGIN;

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS exclude_from_browse boolean DEFAULT false;

COMMIT;

-- After running this migration, refresh the products table schema in Supabase.
