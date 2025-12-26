-- Add vendor_id to material_purchases table to link materials with vendors
ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;

-- Create index for vendor_id lookups
CREATE INDEX IF NOT EXISTS idx_material_purchases_vendor ON material_purchases(vendor_id);

-- Add tender_id to vendors table to support tender-specific vendors
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE;

-- Create index for tender-specific vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendors_tender ON vendors(tender_id);

-- Update existing material purchases with supplier name matching to link to vendors
-- This will link purchases where supplier name matches vendor name
UPDATE material_purchases mp
SET vendor_id = v.id
FROM vendors v
WHERE mp.supplier IS NOT NULL 
  AND LOWER(TRIM(mp.supplier)) = LOWER(TRIM(v.name))
  AND mp.vendor_id IS NULL;

-- Merge duplicate vendor entries (example: মেসার্স জয়নাল ট্রেডার্স - রড and মেসার্স জয়নাল ট্রেডার্স - সিমেন্ট)
-- This query finds vendors with similar names (removing product suffixes after dash)
-- and consolidates their purchases to the first vendor

-- Step 1: Find and merge vendor purchases from duplicates
WITH vendor_groups AS (
  SELECT 
    SPLIT_PART(name, ' - ', 1) as base_name,
    MIN(id::text)::uuid as keep_id,
    ARRAY_AGG(id) as all_ids
  FROM vendors
  WHERE name LIKE '%-%'
  GROUP BY SPLIT_PART(name, ' - ', 1)
  HAVING COUNT(*) > 1
)
UPDATE vendor_purchases vp
SET vendor_id = vg.keep_id
FROM vendor_groups vg
WHERE vp.vendor_id = ANY(vg.all_ids)
  AND vp.vendor_id != vg.keep_id;

-- Step 2: Update material purchases to use consolidated vendor
WITH vendor_groups AS (
  SELECT 
    SPLIT_PART(name, ' - ', 1) as base_name,
    MIN(id::text)::uuid as keep_id,
    ARRAY_AGG(id) as all_ids
  FROM vendors
  WHERE name LIKE '%-%'
  GROUP BY SPLIT_PART(name, ' - ', 1)
  HAVING COUNT(*) > 1
)
UPDATE material_purchases mp
SET vendor_id = vg.keep_id
FROM vendor_groups vg
WHERE mp.vendor_id = ANY(vg.all_ids)
  AND mp.vendor_id != vg.keep_id;

-- Step 3: Remove old vendor names (keep only base name without product suffix)
WITH vendor_groups AS (
  SELECT 
    SPLIT_PART(name, ' - ', 1) as base_name,
    MIN(id::text)::uuid as keep_id
  FROM vendors
  WHERE name LIKE '%-%'
  GROUP BY SPLIT_PART(name, ' - ', 1)
  HAVING COUNT(*) > 1
)
UPDATE vendors v
SET name = vg.base_name
FROM vendor_groups vg
WHERE v.id = vg.keep_id
  AND v.name != vg.base_name;

-- Step 4: Mark duplicate vendors as inactive (don't delete to preserve referential integrity)
WITH vendor_groups AS (
  SELECT 
    SPLIT_PART(name, ' - ', 1) as base_name,
    MIN(id::text)::uuid as keep_id,
    ARRAY_AGG(id) as all_ids
  FROM vendors
  WHERE name LIKE '%-%'
  GROUP BY SPLIT_PART(name, ' - ', 1)
  HAVING COUNT(*) > 1
)
UPDATE vendors v
SET is_active = false
FROM vendor_groups vg
WHERE v.id = ANY(vg.all_ids)
  AND v.id != vg.keep_id;

-- Create vendor_products junction table to track which products each vendor supplies
CREATE TABLE IF NOT EXISTS vendor_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  item_name TEXT, -- For custom items not in materials table
  unit TEXT,
  last_unit_price DECIMAL(12,2), -- Track last known price
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Either material_id or item_name must be present
  CONSTRAINT vendor_products_item_check CHECK (
    (material_id IS NOT NULL) OR (item_name IS NOT NULL)
  ),
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE(vendor_id, material_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_material ON vendor_products(material_id);

-- Populate vendor_products from existing vendor_purchases
INSERT INTO vendor_products (vendor_id, item_name, unit, last_unit_price)
SELECT DISTINCT ON (vendor_id, item_name)
  vendor_id,
  item_name,
  unit,
  unit_price
FROM vendor_purchases
WHERE vendor_id IS NOT NULL AND item_name IS NOT NULL
ORDER BY vendor_id, item_name, purchase_date DESC
ON CONFLICT (vendor_id, material_id, item_name) DO UPDATE
SET 
  last_unit_price = EXCLUDED.last_unit_price,
  updated_at = NOW();

-- Populate vendor_products from material_purchases linked to vendors
INSERT INTO vendor_products (vendor_id, material_id, unit, last_unit_price)
SELECT DISTINCT ON (mp.vendor_id, mp.material_id)
  mp.vendor_id,
  mp.material_id,
  mp.unit,
  mp.unit_rate
FROM material_purchases mp
WHERE mp.vendor_id IS NOT NULL AND mp.material_id IS NOT NULL
ORDER BY mp.vendor_id, mp.material_id, mp.purchase_date DESC
ON CONFLICT (vendor_id, material_id, item_name) DO UPDATE
SET 
  last_unit_price = EXCLUDED.last_unit_price,
  unit = EXCLUDED.unit,
  updated_at = NOW();

-- Create function to automatically update vendor_products when purchases are made
CREATE OR REPLACE FUNCTION update_vendor_products_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vendor_products with latest price from material_purchases
  IF NEW.vendor_id IS NOT NULL AND NEW.material_id IS NOT NULL THEN
    INSERT INTO vendor_products (vendor_id, material_id, unit, last_unit_price)
    VALUES (NEW.vendor_id, NEW.material_id, NEW.unit, NEW.unit_rate)
    ON CONFLICT (vendor_id, material_id, item_name) 
    DO UPDATE SET
      last_unit_price = NEW.unit_rate,
      unit = NEW.unit,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update vendor_products automatically
DROP TRIGGER IF EXISTS trg_update_vendor_products ON material_purchases;
CREATE TRIGGER trg_update_vendor_products
  AFTER INSERT OR UPDATE ON material_purchases
  FOR EACH ROW
  WHEN (NEW.vendor_id IS NOT NULL AND NEW.material_id IS NOT NULL)
  EXECUTE FUNCTION update_vendor_products_on_purchase();

-- Similar trigger for vendor_purchases table
CREATE OR REPLACE FUNCTION update_vendor_products_on_vendor_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor_id IS NOT NULL AND NEW.item_name IS NOT NULL THEN
    INSERT INTO vendor_products (vendor_id, item_name, unit, last_unit_price)
    VALUES (NEW.vendor_id, NEW.item_name, NEW.unit, NEW.unit_price)
    ON CONFLICT (vendor_id, material_id, item_name) 
    DO UPDATE SET
      last_unit_price = NEW.unit_price,
      unit = NEW.unit,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_vendor_products_vp ON vendor_purchases;
CREATE TRIGGER trg_update_vendor_products_vp
  AFTER INSERT OR UPDATE ON vendor_purchases
  FOR EACH ROW
  WHEN (NEW.vendor_id IS NOT NULL AND NEW.item_name IS NOT NULL)
  EXECUTE FUNCTION update_vendor_products_on_vendor_purchase();
