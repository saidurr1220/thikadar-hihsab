-- Manual script to merge duplicate vendors (মেসার্স জয়নাল ট্রেডার্স)

-- Step 1: Find the vendors
SELECT id, name, is_active, created_at 
FROM vendors 
WHERE name LIKE '%জয়নাল%'
ORDER BY created_at;

-- Copy the IDs from above and use them below

-- Step 2: Pick the vendor to keep (usually the first one created)
-- Replace 'KEEP_THIS_ID' with the actual ID you want to keep
-- Replace 'DELETE_THIS_ID' with the duplicate ID

DO $$
DECLARE
  keep_vendor_id UUID := 'KEEP_THIS_ID'; -- Change this!
  delete_vendor_id UUID := 'DELETE_THIS_ID'; -- Change this!
BEGIN
  -- Update vendor_purchases to use the main vendor
  UPDATE vendor_purchases
  SET vendor_id = keep_vendor_id
  WHERE vendor_id = delete_vendor_id;
  
  -- Update material_purchases to use the main vendor
  UPDATE material_purchases
  SET vendor_id = keep_vendor_id
  WHERE vendor_id = delete_vendor_id;
  
  -- Update the main vendor name (remove product suffix if any)
  UPDATE vendors
  SET name = 'মেসার্স জয়নাল ট্রেডার্স'
  WHERE id = keep_vendor_id;
  
  -- Mark duplicate as inactive
  UPDATE vendors
  SET is_active = false,
      notes = COALESCE(notes || ' ', '') || '[MERGED into ' || keep_vendor_id::text || ']'
  WHERE id = delete_vendor_id;
  
  RAISE NOTICE 'Successfully merged vendor % into %', delete_vendor_id, keep_vendor_id;
END $$;

-- Step 3: Verify the merge
SELECT 
  v.id,
  v.name,
  v.is_active,
  COUNT(DISTINCT vp.id) as vendor_purchases_count,
  COALESCE(SUM(vp.total_amount), 0) as vendor_purchases_total,
  COUNT(DISTINCT mp.id) as material_purchases_count,
  COALESCE(SUM(mp.total_amount), 0) as material_purchases_total
FROM vendors v
LEFT JOIN vendor_purchases vp ON v.id = vp.vendor_id
LEFT JOIN material_purchases mp ON v.id = mp.vendor_id
WHERE v.name LIKE '%জয়নাল%'
GROUP BY v.id, v.name, v.is_active
ORDER BY v.is_active DESC, v.created_at;
