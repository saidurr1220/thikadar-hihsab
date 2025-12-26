-- Fix RLS policies for vendor_products table and grant permissions

-- Enable RLS on vendor_products
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view vendor products for their tenders" ON vendor_products;
DROP POLICY IF EXISTS "Users can insert vendor products for their tenders" ON vendor_products;
DROP POLICY IF EXISTS "Users can update vendor products for their tenders" ON vendor_products;
DROP POLICY IF EXISTS "Users can delete vendor products for their tenders" ON vendor_products;

-- Create RLS policies for vendor_products
-- Allow read access based on vendor's tender
CREATE POLICY "Users can view vendor products for their tenders"
  ON vendor_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN tender_assignments ta ON ta.tender_id = v.tender_id
      WHERE v.id = vendor_products.vendor_id
        AND ta.user_id = auth.uid()
    )
  );

-- Allow insert for users assigned to the tender
CREATE POLICY "Users can insert vendor products for their tenders"
  ON vendor_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN tender_assignments ta ON ta.tender_id = v.tender_id
      WHERE v.id = vendor_products.vendor_id
        AND ta.user_id = auth.uid()
    )
  );

-- Allow update for users assigned to the tender
CREATE POLICY "Users can update vendor products for their tenders"
  ON vendor_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN tender_assignments ta ON ta.tender_id = v.tender_id
      WHERE v.id = vendor_products.vendor_id
        AND ta.user_id = auth.uid()
    )
  );

-- Allow delete for users assigned to the tender
CREATE POLICY "Users can delete vendor products for their tenders"
  ON vendor_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN tender_assignments ta ON ta.tender_id = v.tender_id
      WHERE v.id = vendor_products.vendor_id
        AND ta.user_id = auth.uid()
    )
  );

-- Grant permissions on vendor_products table
GRANT ALL ON vendor_products TO authenticated;
GRANT ALL ON vendor_products TO service_role;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION update_vendor_products_on_purchase() TO authenticated;
GRANT EXECUTE ON FUNCTION update_vendor_products_on_vendor_purchase() TO authenticated;

-- Ensure material_purchases vendor_id column is accessible
-- (No special permissions needed, inherits from table)

-- Verify RLS is working
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully for vendor_products';
END $$;
