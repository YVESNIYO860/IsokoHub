-- Migration: add seller latitude and longitude columns to products
-- Run this in your Supabase SQL editor or via psql against your database.

BEGIN;

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS seller_lat numeric(10,6);

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS seller_lng numeric(10,6);

COMMIT;

-- Notes:
-- Use numeric(10,6) to store lat/lng with ~0.11m precision which is typically sufficient.
-- After running, refresh the Supabase Table Editor schema cache for the `products` table.
