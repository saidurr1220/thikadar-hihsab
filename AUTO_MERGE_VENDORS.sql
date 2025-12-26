-- AUTO MERGE DUPLICATE VENDORS
-- This script automatically finds and merges vendors with similar names
-- Run this in Supabase SQL Editor

-- First, let's see what duplicates exist:
SELECT 
  SPLIT_PART(name, ' - ', 1) as base_name,
  STRING_AGG(name, ', ') as all_names,
  STRING_AGG(id::text, ', ') as all_ids,
  COUNT(*) as duplicate_count,
  MIN(created_at) as oldest_created
FROM vendors 
WHERE name LIKE '%-%'
  AND is_active = true
GROUP BY SPLIT_PART(name, ' - ', 1)
HAVING COUNT(*) > 1
ORDER BY base_name;

-- Now run the merge:
DO $$
DECLARE
  base_name TEXT;
  keep_id UUID;
  duplicate_ids UUID[];
  duplicate_id UUID;
  affected_vendor_purchases INT;
  affected_material_purchases INT;
BEGIN
  -- Loop through each group of duplicates
  FOR base_name, keep_id, duplicate_ids IN 
    SELECT 
      SPLIT_PART(name, ' - ', 1),
      MIN(id)::UUID,
      ARRAY_AGG(id) FILTER (WHERE id != MIN(id))
    FROM vendors 
    WHERE name LIKE '%-%'
      AND is_active = true
    GROUP BY SPLIT_PART(name, ' - ', 1)
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Processing base name: %', base_name;
    RAISE NOTICE 'Keeping vendor ID: %', keep_id;
    
    -- Process each duplicate
    FOREACH duplicate_id IN ARRAY duplicate_ids
    LOOP
      -- Move vendor_purchases
      UPDATE vendor_purchases
      SET vendor_id = keep_id
      WHERE vendor_id = duplicate_id;
      
      GET DIAGNOSTICS affected_vendor_purchases = ROW_COUNT;
      RAISE NOTICE '  Moved % vendor_purchases from % to %', affected_vendor_purchases, duplicate_id, keep_id;
      
      -- Move material_purchases
      UPDATE material_purchases
      SET vendor_id = keep_id
      WHERE vendor_id = duplicate_id;
      
      GET DIAGNOSTICS affected_material_purchases = ROW_COUNT;
      RAISE NOTICE '  Moved % material_purchases from % to %', affected_material_purchases, duplicate_id, keep_id;
      
      -- Move vendor_payments
      UPDATE vendor_payments
      SET vendor_id = keep_id
      WHERE vendor_id = duplicate_id;
      
      -- Mark as inactive
      UPDATE vendors
      SET is_active = false,
          name = name || ' [MERGED]',
          notes = COALESCE(notes, '') || ' Merged into ' || keep_id::text || ' on ' || NOW()::date
      WHERE id = duplicate_id;
      
      RAISE NOTICE '  Marked duplicate vendor % as inactive', duplicate_id;
    END LOOP;
    
    -- Update main vendor name (remove suffix)
    UPDATE vendors
    SET name = base_name
    WHERE id = keep_id;
    
    RAISE NOTICE 'Updated main vendor name to: %', base_name;
    RAISE NOTICE '==================================================';
  END LOOP;
  
  RAISE NOTICE 'MERGE COMPLETE!';
END $$;

-- Verify the merge results:
SELECT 
  v.id,
  v.name,
  v.is_active,
  v.created_at,
  COUNT(DISTINCT vp.id) as vendor_purchases_count,
  COALESCE(SUM(vp.total_amount), 0) as vendor_purchases_total,
  COUNT(DISTINCT mp.id) as material_purchases_count,
  COALESCE(SUM(mp.total_amount), 0) as material_purchases_total,
  COUNT(DISTINCT vpay.id) as payments_count,
  COALESCE(SUM(vpay.amount), 0) as payments_total
FROM vendors v
LEFT JOIN vendor_purchases vp ON vp.vendor_id = v.id
LEFT JOIN material_purchases mp ON mp.vendor_id = v.id
LEFT JOIN vendor_payments vpay ON vpay.vendor_id = v.id
WHERE v.name NOT LIKE '%[MERGED]%'
  AND v.is_active = true
GROUP BY v.id, v.name, v.is_active, v.created_at
ORDER BY v.name;
