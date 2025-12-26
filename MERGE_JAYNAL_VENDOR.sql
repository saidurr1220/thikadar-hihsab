-- STEP-BY-STEP MANUAL VENDOR MERGE
-- Run each section separately in Supabase SQL Editor

-- ============================================
-- SECTION 1: FIND DUPLICATE VENDORS
-- ============================================
-- Run this first to see which vendors are duplicates
SELECT 
  id,
  name,
  phone,
  is_active,
  tender_id,
  created_at,
  SPLIT_PART(name, ' - ', 1) as base_name
FROM vendors 
WHERE name LIKE '%-%'
  OR name LIKE '%জয়নাল%'
ORDER BY SPLIT_PART(name, ' - ', 1), created_at;

-- ============================================
-- SECTION 2: MERGE মেসার্স জয়নাল ট্রেডার্স
-- ============================================

-- Find the specific vendor IDs
SELECT 
  id,
  name,
  created_at,
  (SELECT COUNT(*) FROM vendor_purchases WHERE vendor_id = vendors.id) as vendor_purchases_count,
  (SELECT COALESCE(SUM(total_amount), 0) FROM vendor_purchases WHERE vendor_id = vendors.id) as vendor_purchases_total,
  (SELECT COUNT(*) FROM material_purchases WHERE vendor_id = vendors.id) as material_purchases_count,
  (SELECT COALESCE(SUM(total_amount), 0) FROM material_purchases WHERE vendor_id = vendors.id) as material_purchases_total
FROM vendors 
WHERE LOWER(name) LIKE '%জয়নাল%'
ORDER BY created_at;

-- Copy the IDs from above and replace in the DO block below:
-- keep_id = the OLDEST vendor (first one created) - this will stay active
-- delete_ids = array of all OTHER vendor IDs to merge

DO $$
DECLARE
  keep_id UUID := 'PASTE_OLDEST_VENDOR_ID_HERE'; -- ⚠️ Change this!
  delete_ids UUID[] := ARRAY[
    'PASTE_DUPLICATE_ID_1_HERE'::UUID,
    'PASTE_DUPLICATE_ID_2_HERE'::UUID
    -- Add more if needed, separated by commas
  ]; 
  vid UUID;
BEGIN
  -- Loop through each duplicate vendor ID
  FOREACH vid IN ARRAY delete_ids
  LOOP
    -- Move vendor_purchases to main vendor
    UPDATE vendor_purchases
    SET vendor_id = keep_id
    WHERE vendor_id = vid;
    
    RAISE NOTICE 'Moved vendor_purchases from % to %', vid, keep_id;
    
    -- Move material_purchases to main vendor
    UPDATE material_purchases
    SET vendor_id = keep_id
    WHERE vendor_id = vid;
    
    RAISE NOTICE 'Moved material_purchases from % to %', vid, keep_id;
    
    -- Mark duplicate as inactive
    UPDATE vendors
    SET is_active = false,
        notes = COALESCE(notes, '') || ' [MERGED into ' || keep_id::text || ' on ' || NOW()::date || ']'
    WHERE id = vid;
    
    RAISE NOTICE 'Marked vendor % as inactive', vid;
  END LOOP;
  
  -- Update main vendor name (remove product suffix)
  UPDATE vendors
  SET name = 'মেসার্স জয়নাল ট্রেডার্স'
  WHERE id = keep_id;
  
  RAISE NOTICE 'Updated main vendor % name', keep_id;
  RAISE NOTICE 'Merge completed successfully!';
END $$;

-- ============================================
-- SECTION 3: VERIFY THE MERGE
-- ============================================
-- Run this to verify the merge worked correctly

SELECT 
  v.id,
  v.name,
  v.phone,
  v.is_active,
  COUNT(DISTINCT vp.id) as vendor_purchases_count,
  COALESCE(SUM(vp.total_amount), 0) as vendor_purchases_total,
  COUNT(DISTINCT mp.id) as material_purchases_count,
  COALESCE(SUM(mp.total_amount), 0) as material_purchases_total,
  COALESCE(SUM(vp.total_amount), 0) + COALESCE(SUM(mp.total_amount), 0) as grand_total
FROM vendors v
LEFT JOIN vendor_purchases vp ON v.id = vp.vendor_id
LEFT JOIN material_purchases mp ON v.id = mp.vendor_id
WHERE LOWER(v.name) LIKE '%জয়নাল%'
GROUP BY v.id, v.name, v.phone, v.is_active
ORDER BY v.is_active DESC, v.created_at;

-- ============================================
-- SECTION 4: REFRESH vendor_products
-- ============================================
-- This will rebuild the vendor_products table with correct data

-- Delete old entries for this vendor
DELETE FROM vendor_products
WHERE vendor_id IN (
  SELECT id FROM vendors WHERE LOWER(name) LIKE '%জয়নাল%'
);

-- Repopulate from vendor_purchases
INSERT INTO vendor_products (vendor_id, item_name, unit, last_unit_price)
SELECT DISTINCT ON (vendor_id, item_name)
  vendor_id,
  item_name,
  unit,
  unit_price
FROM vendor_purchases
WHERE vendor_id IN (
  SELECT id FROM vendors WHERE LOWER(name) LIKE '%জয়নাল%' AND is_active = true
)
ORDER BY vendor_id, item_name, purchase_date DESC;

-- Repopulate from material_purchases
INSERT INTO vendor_products (vendor_id, material_id, unit, last_unit_price)
SELECT DISTINCT ON (mp.vendor_id, mp.material_id)
  mp.vendor_id,
  mp.material_id,
  mp.unit,
  mp.unit_rate
FROM material_purchases mp
WHERE mp.vendor_id IN (
  SELECT id FROM vendors WHERE LOWER(name) LIKE '%জয়নাল%' AND is_active = true
)
  AND mp.material_id IS NOT NULL
ORDER BY mp.vendor_id, mp.material_id, mp.purchase_date DESC
ON CONFLICT (vendor_id, material_id, item_name) DO UPDATE
SET 
  last_unit_price = EXCLUDED.last_unit_price,
  unit = EXCLUDED.unit,
  updated_at = NOW();

-- ============================================
-- SECTION 5: VERIFY vendor_products
-- ============================================
SELECT 
  v.name as vendor_name,
  COALESCE(m.name_bn, vp.item_name) as product,
  vp.unit,
  vp.last_unit_price,
  vp.updated_at
FROM vendor_products vp
JOIN vendors v ON vp.vendor_id = v.id
LEFT JOIN materials m ON vp.material_id = m.id
WHERE v.is_active = true
  AND LOWER(v.name) LIKE '%জয়নাল%'
ORDER BY v.name, product;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✓ Vendor merge complete!';
  RAISE NOTICE '✓ Inactive vendors preserved for data integrity';
  RAISE NOTICE '✓ All purchases transferred to main vendor';
  RAISE NOTICE '✓ vendor_products updated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your browser (Ctrl+F5)';
  RAISE NOTICE '2. Check vendor list - should show only one active vendor';
  RAISE NOTICE '3. Check vendor details page for complete purchase history';
END $$;
