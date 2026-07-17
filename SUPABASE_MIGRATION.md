# Supabase PostgreSQL Migration

## Step 1: Create Products Table

Go to **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'RWF',
  image TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  condition VARCHAR(50),
  seller_phone VARCHAR(20),
  district VARCHAR(100),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  is_ad BOOLEAN DEFAULT FALSE,
  ad_requested BOOLEAN DEFAULT FALSE,
  property_type VARCHAR(50),
  listing_type VARCHAR(50),
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public to read approved products
CREATE POLICY "Public read approved products"
  ON products FOR SELECT
  USING (status = 'approved');

-- Allow authenticated users to read their own or admin to read all
CREATE POLICY "Users view own products"
  ON products FOR SELECT
  USING (auth.uid() = seller_id OR 
         (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Allow authenticated users to create products
CREATE POLICY "Users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Allow users to update own products, admins to update any
CREATE POLICY "Users update own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id OR 
         (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Allow admins to delete
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Create indexes for faster queries
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_is_ad ON products(is_ad);
CREATE INDEX idx_products_ad_requested ON products(ad_requested);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

## Step 2: Run the SQL

Click **Run** button to create the table and enable Row Level Security.

## Step 3: Verify

Go to **Database** → **Tables** and confirm `products` table exists with all fields.
