-- Migration: add is_househub flag to products table
-- Run this in your Supabase SQL editor or via psql against your database.

BEGIN;

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS is_househub boolean DEFAULT false;

COMMIT;

-- Notes:
-- After running this migration in the Supabase dashboard, refresh the products table schema cache.
