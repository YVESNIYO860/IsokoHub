-- Migration: create househub_listings table for fast Househub queries
-- Run this in your Supabase SQL editor or via psql against your database.

BEGIN;

-- Create a lightweight table to mirror Househub-special products for faster filtering
CREATE TABLE IF NOT EXISTS househub_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid,
  title text,
  district text,
  location text,
  price bigint,
  currency text,
  image text[],
  video_url text,
  property_type text,
  listing_type text,
  created_at timestamptz DEFAULT now()
);

COMMIT;

-- Notes:
-- 1. If your database does not have `gen_random_uuid()` available, replace with
--    `uuid_generate_v4()` or adjust to your UUID generation function.
-- 2. This migration is optional: the app will continue to work without it, but
--    creating this table makes Househub-specific queries faster and avoids
--    relying solely on product-level filters when you want a dedicated index.