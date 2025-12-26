-- Fix existing purchases by creating payments for cash/bank entries
-- This will automatically create payment records for purchases that were marked as cash/bank but don't have payment records

-- Fix Material Purchases
INSERT INTO vendor_payments (tender_id, vendor_id, payment_date, amount, payment_method, payment_ref, notes, created_by)
SELECT 
  mp.tender_id,
  mp.vendor_id,
  mp.purchase_date,
  mp.total_amount,
  mp.payment_method,
  mp.payment_ref,
  CONCAT('Auto payment for material: ', COALESCE(m.name_bn, mp.custom_item_name, 'Material purchase')),
  mp.created_by
FROM material_purchases mp
LEFT JOIN materials m ON m.id = mp.material_id
WHERE mp.vendor_id IS NOT NULL
  AND mp.payment_method IN ('cash', 'bank')
  AND NOT EXISTS (
    SELECT 1 FROM vendor_payments vp 
    WHERE vp.vendor_id = mp.vendor_id 
      AND vp.payment_date = mp.purchase_date 
      AND vp.amount = mp.total_amount
      AND vp.notes LIKE '%material%'
  );

-- Fix Vendor Purchases
INSERT INTO vendor_payments (tender_id, vendor_id, payment_date, amount, payment_method, payment_ref, notes, created_by)
SELECT 
  vp.tender_id,
  vp.vendor_id,
  vp.purchase_date,
  vp.total_cost,
  COALESCE(vp.payment_method, 'cash'),
  NULL,
  CONCAT('Auto payment for purchase: ', COALESCE(vp.item_name, 'Vendor purchase')),
  vp.created_by
FROM vendor_purchases vp
WHERE vp.payment_method IN ('cash', 'bank')
  AND NOT EXISTS (
    SELECT 1 FROM vendor_payments vpay 
    WHERE vpay.vendor_id = vp.vendor_id 
      AND vpay.payment_date = vp.purchase_date 
      AND vpay.amount = vp.total_cost
      AND vpay.notes LIKE '%purchase%'
  );

-- Show results
SELECT 
  'Material Purchases with Payments' as type,
  COUNT(*) as count
FROM material_purchases mp
WHERE mp.vendor_id IS NOT NULL
  AND mp.payment_method IN ('cash', 'bank')
  AND EXISTS (
    SELECT 1 FROM vendor_payments vp 
    WHERE vp.vendor_id = mp.vendor_id 
      AND vp.payment_date = mp.purchase_date 
      AND vp.amount = mp.total_amount
  )
UNION ALL
SELECT 
  'Vendor Purchases with Payments' as type,
  COUNT(*) as count
FROM vendor_purchases vp
WHERE vp.payment_method IN ('cash', 'bank')
  AND EXISTS (
    SELECT 1 FROM vendor_payments vpay 
    WHERE vpay.vendor_id = vp.vendor_id 
      AND vpay.payment_date = vp.purchase_date 
      AND vpay.amount = vp.total_cost
  );
