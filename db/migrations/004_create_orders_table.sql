-- Migration: create orders table to store MTN payment attempts and statuses
-- Run in Supabase SQL editor

BEGIN;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text UNIQUE,
  phone text,
  amount numeric,
  currency text,
  status text,
  items jsonb,
  buyer_location jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.orders;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

COMMIT;
