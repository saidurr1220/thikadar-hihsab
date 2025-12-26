-- Add vendor_id column to material_purchases table
-- This allows linking material purchases to vendors for unified purchase tracking

-- Add vendor_id column (nullable to allow existing records)
ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;

-- Create index for faster vendor queries
CREATE INDEX IF NOT EXISTS idx_material_purchases_vendor 
ON material_purchases(vendor_id);

-- Add comment
COMMENT ON COLUMN material_purchases.vendor_id IS 'Links material purchase to a vendor for unified tracking';
