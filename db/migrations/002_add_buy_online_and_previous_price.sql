-- Migration: add buy_online and previous_price to products table
-- Run this in your Supabase SQL editor or via psql against your database.

BEGIN;

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS buy_online boolean DEFAULT false;

-- previous_price stores the prior listed price when a seller updates the price
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS previous_price numeric(12,2);

COMMIT;

-- Notes:
-- 1) Supabase uses snake_case column names; frontend code writes `previousPrice` which will be converted
--    to `previous_price` by update helpers.
-- 2) After running this migration in the Supabase dashboard, open the Table Editor and refresh the
--    products table schema (or re-open the project) so the schema cache includes the new columns.
