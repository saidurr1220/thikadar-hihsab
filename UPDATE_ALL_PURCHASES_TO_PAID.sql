-- Update all existing purchases to "cash" payment method
-- This will mark them as paid automatically

-- Update vendor_purchases
UPDATE vendor_purchases 
SET payment_method = 'cash'
WHERE payment_method IS NULL OR payment_method = 'due';

-- Update material_purchases
UPDATE material_purchases 
SET payment_method = 'cash'
WHERE payment_method IS NULL OR payment_method = 'due';

-- Now create payments for all these updated purchases
-- For Vendor Purchases
INSERT INTO vendor_payments (tender_id, vendor_id, payment_date, amount, payment_method, payment_ref, notes, created_by)
SELECT 
  vp.tender_id,
  vp.vendor_id,
  vp.purchase_date,
  vp.total_cost,
  'cash',
  NULL,
  CONCAT('Auto payment for purchase: ', COALESCE(vp.item_name, 'Vendor purchase')),
  vp.created_by
FROM vendor_purchases vp
WHERE NOT EXISTS (
  SELECT 1 FROM vendor_payments vpay 
  WHERE vpay.vendor_id = vp.vendor_id 
    AND vpay.payment_date = vp.purchase_date 
    AND vpay.amount = vp.total_cost
);

-- For Material Purchases
INSERT INTO vendor_payments (tender_id, vendor_id, payment_date, amount, payment_method, payment_ref, notes, created_by)
SELECT 
  mp.tender_id,
  mp.vendor_id,
  mp.purchase_date,
  mp.total_amount,
  'cash',
  mp.payment_ref,
  CONCAT('Auto payment for material: ', COALESCE(m.name_bn, mp.custom_item_name, 'Material purchase')),
  mp.created_by
FROM material_purchases mp
LEFT JOIN materials m ON m.id = mp.material_id
WHERE mp.vendor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vendor_payments vp 
    WHERE vp.vendor_id = mp.vendor_id 
      AND vp.payment_date = mp.purchase_date 
      AND vp.amount = mp.total_amount
  );

-- Show summary
SELECT 
  'Total Vendor Purchases marked as paid' as status,
  COUNT(*) as count
FROM vendor_purchases
WHERE payment_method = 'cash'
UNION ALL
SELECT 
  'Total Material Purchases marked as paid' as status,
  COUNT(*) as count
FROM material_purchases
WHERE payment_method = 'cash' AND vendor_id IS NOT NULL;
