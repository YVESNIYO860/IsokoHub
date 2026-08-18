-- Migration: replace sync_househub_listings trigger function to avoid referencing missing columns
-- This function checks whether `products.is_househub` exists in the schema
-- before attempting to read it. If the column is absent it infers Househub
-- intent from the `category` field.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_househub_listings()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  has_col integer;
  is_househub_state boolean := false;
BEGIN
  -- Quick path for DELETE
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.househub_listings WHERE product_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Check if products.is_househub column exists in the current schema
  SELECT COUNT(*) INTO has_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_househub';

  IF has_col > 0 THEN
    -- Safe to read NEW.is_househub when the column exists
    is_househub_state := COALESCE(NEW.is_househub, false);
  ELSE
    -- Infer Househub intent from category when the column is missing
    IF NEW.category IS NOT NULL THEN
      is_househub_state := LOWER(NEW.category) IN ('houses & rents','housing','house','househub','rent');
    ELSE
      is_househub_state := false;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
    IF is_househub_state THEN
      -- Upsert into mirror table
      INSERT INTO public.househub_listings (
        product_id, seller_id, title, district, location, price, currency, image, video_url, property_type, listing_type, created_at
      ) VALUES (
        NEW.id, NEW.seller_id, NEW.name, NEW.district, NULL, NEW.price, COALESCE(NEW.currency,'RWF'), NEW.image, NEW.video_url, NEW.property_type, NEW.listing_type, now()
      )
      ON CONFLICT (product_id) DO UPDATE
      SET seller_id = EXCLUDED.seller_id,
          title = EXCLUDED.title,
          district = EXCLUDED.district,
          location = EXCLUDED.location,
          price = EXCLUDED.price,
          currency = EXCLUDED.currency,
          image = EXCLUDED.image,
          video_url = EXCLUDED.video_url,
          property_type = EXCLUDED.property_type,
          listing_type = EXCLUDED.listing_type;
    ELSE
      -- Remove mirror if present
      DELETE FROM public.househub_listings WHERE product_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Recreate trigger (drop if exists)
DROP TRIGGER IF EXISTS trg_sync_househub_listings ON public.products;

CREATE TRIGGER trg_sync_househub_listings
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_househub_listings();

COMMIT;

-- Notes:
-- Running this migration fixes trigger errors when `products.is_househub` is absent.