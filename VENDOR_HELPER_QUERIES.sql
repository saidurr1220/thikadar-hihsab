-- VENDOR SYSTEM HELPER QUERIES
-- Common SQL queries for managing vendor system

-- ============================================
-- 1. CHECK CURRENT STATE
-- ============================================

-- View all vendors with their tender info
SELECT 
  v.id,
  v.name,
  v.phone,
  v.is_active,
  t.project_name,
  COUNT(DISTINCT vp.material_id) as total_products,
  COUNT(DISTINCT mp.id) as total_purchases
FROM vendors v
LEFT JOIN tenders t ON v.tender_id = t.id
LEFT JOIN vendor_products vp ON v.id = vp.vendor_id
LEFT JOIN material_purchases mp ON v.id = mp.vendor_id
GROUP BY v.id, v.name, v.phone, v.is_active, t.project_name
ORDER BY v.name;

-- Find duplicate vendors (same base name)
SELECT 
  SPLIT_PART(name, ' - ', 1) as base_name,
  COUNT(*) as count,
  STRING_AGG(name, ' | ') as all_names,
  STRING_AGG(id::text, ' | ') as all_ids
FROM vendors
WHERE name LIKE '%-%'
GROUP BY SPLIT_PART(name, ' - ', 1)
HAVING COUNT(*) > 1;

-- Check material_purchases without vendor_id
SELECT 
  id,
  purchase_date,
  supplier,
  custom_item_name,
  total_amount
FROM material_purchases
WHERE vendor_id IS NULL
  AND supplier IS NOT NULL
ORDER BY purchase_date DESC
LIMIT 20;

-- ============================================
-- 2. FIND SPECIFIC VENDORS
-- ============================================

-- Find vendor by name (partial match)
SELECT * FROM vendors
WHERE LOWER(name) LIKE LOWER('%জয়নাল%')
ORDER BY name;

-- Find all Shahnewaz entries
SELECT * FROM vendors
WHERE LOWER(name) LIKE '%shahnewaz%'
OR LOWER(name) LIKE '%শাহনেওয়াজ%';

-- Find vendors with no purchases
SELECT v.*
FROM vendors v
LEFT JOIN material_purchases mp ON v.id = mp.vendor_id
LEFT JOIN vendor_purchases vp ON v.id = vp.vendor_id
WHERE mp.id IS NULL AND vp.id IS NULL
ORDER BY v.created_at DESC;

-- ============================================
-- 3. VENDOR PRODUCTS
-- ============================================

-- View all products for a specific vendor
SELECT 
  v.name as vendor_name,
  COALESCE(m.name_bn, vp.item_name) as product_name,
  vp.unit,
  vp.last_unit_price,
  vp.updated_at as last_price_date
FROM vendor_products vp
JOIN vendors v ON vp.vendor_id = v.id
LEFT JOIN materials m ON vp.material_id = m.id
WHERE v.id = 'vendor-id-here'
ORDER BY product_name;

-- Find which vendors supply a specific material
SELECT 
  v.name as vendor_name,
  v.phone,
  vp.last_unit_price,
  vp.unit,
  vp.updated_at as last_purchase_date
FROM vendor_products vp
JOIN vendors v ON vp.vendor_id = v.id
JOIN materials m ON vp.material_id = m.id
WHERE m.name_bn = 'রড' -- Change material name
  AND v.is_active = true
ORDER BY vp.last_unit_price;

-- ============================================
-- 4. LINK PURCHASES TO VENDORS
-- ============================================

-- Link purchases by exact supplier name match
UPDATE material_purchases mp
SET vendor_id = v.id
FROM vendors v
WHERE mp.supplier IS NOT NULL 
  AND LOWER(TRIM(mp.supplier)) = LOWER(TRIM(v.name))
  AND mp.vendor_id IS NULL;

-- Link purchases by partial name match (use carefully)
UPDATE material_purchases mp
SET vendor_id = v.id
FROM vendors v
WHERE mp.supplier IS NOT NULL 
  AND LOWER(mp.supplier) LIKE '%' || LOWER(v.name) || '%'
  AND mp.vendor_id IS NULL
  AND LENGTH(v.name) > 5; -- Avoid matching very short names

-- Link specific supplier to specific vendor
UPDATE material_purchases
SET vendor_id = 'vendor-id-here'
WHERE LOWER(supplier) LIKE '%shahnewaz%'
  AND vendor_id IS NULL;

-- ============================================
-- 5. MERGE DUPLICATE VENDORS
-- ============================================

-- Find duplicates for "মেসার্স জয়নাল ট্রেডার্স"
SELECT * FROM vendors
WHERE LOWER(name) LIKE '%জয়নাল%'
ORDER BY created_at;

-- Manual merge: Move all purchases to primary vendor
-- Step 1: Update material_purchases
UPDATE material_purchases
SET vendor_id = 'primary-vendor-id'
WHERE vendor_id IN ('duplicate-vendor-id-1', 'duplicate-vendor-id-2');

-- Step 2: Update vendor_purchases
UPDATE vendor_purchases
SET vendor_id = 'primary-vendor-id'
WHERE vendor_id IN ('duplicate-vendor-id-1', 'duplicate-vendor-id-2');

-- Step 3: Mark duplicates as inactive
UPDATE vendors
SET is_active = false
WHERE id IN ('duplicate-vendor-id-1', 'duplicate-vendor-id-2');

-- Step 4: Update primary vendor name (remove product suffix)
UPDATE vendors
SET name = 'মেসার্স জয়নাল ট্রেডার্স'
WHERE id = 'primary-vendor-id';

-- ============================================
-- 6. CREATE VENDOR FROM EXISTING PURCHASES
-- ============================================

-- Find all purchases from a specific supplier
SELECT DISTINCT
  supplier,
  COUNT(*) as total_purchases,
  SUM(total_amount) as total_spent,
  MIN(purchase_date) as first_purchase,
  MAX(purchase_date) as last_purchase
FROM material_purchases
WHERE supplier IS NOT NULL
  AND vendor_id IS NULL
GROUP BY supplier
ORDER BY total_spent DESC;

-- Create vendor for "Shahnewaz" example
INSERT INTO vendors (name, phone, tender_id, is_active, created_by)
VALUES (
  'Shahnewaz',
  '01712345678',
  (SELECT id FROM tenders WHERE project_name LIKE '%your-project%' LIMIT 1),
  true,
  (SELECT id FROM profiles WHERE email = 'your-email@example.com' LIMIT 1)
)
RETURNING id;

-- Link purchases to newly created vendor
UPDATE material_purchases
SET vendor_id = 'new-vendor-id-from-above'
WHERE LOWER(supplier) LIKE '%shahnewaz%';

-- ============================================
-- 7. VENDOR ANALYTICS
-- ============================================

-- Total spending per vendor
SELECT 
  v.name,
  v.phone,
  COUNT(DISTINCT mp.id) as material_purchases_count,
  COALESCE(SUM(mp.total_amount), 0) as material_total,
  COUNT(DISTINCT vp.id) as vendor_purchases_count,
  COALESCE(SUM(vp.total_amount), 0) as vendor_total,
  COALESCE(SUM(mp.total_amount), 0) + COALESCE(SUM(vp.total_amount), 0) as grand_total
FROM vendors v
LEFT JOIN material_purchases mp ON v.id = mp.vendor_id
LEFT JOIN vendor_purchases vp ON v.id = vp.vendor_id
WHERE v.is_active = true
GROUP BY v.id, v.name, v.phone
ORDER BY grand_total DESC;

-- Most purchased materials from each vendor
SELECT 
  v.name as vendor_name,
  COALESCE(m.name_bn, mp.custom_item_name) as material,
  COUNT(*) as purchase_count,
  SUM(mp.quantity) as total_quantity,
  mp.unit,
  AVG(mp.unit_rate) as avg_price,
  SUM(mp.total_amount) as total_spent
FROM material_purchases mp
JOIN vendors v ON mp.vendor_id = v.id
LEFT JOIN materials m ON mp.material_id = m.id
WHERE v.is_active = true
GROUP BY v.name, COALESCE(m.name_bn, mp.custom_item_name), mp.unit
ORDER BY v.name, total_spent DESC;

-- Price trends for specific material from specific vendor
SELECT 
  purchase_date,
  quantity,
  unit_rate,
  total_amount,
  notes
FROM material_purchases
WHERE vendor_id = 'vendor-id-here'
  AND (
    material_id = 'material-id-here'
    OR LOWER(custom_item_name) LIKE '%rod%'
  )
ORDER BY purchase_date DESC;

-- ============================================
-- 8. CLEANUP AND MAINTENANCE
-- ============================================

-- Find vendors with no phone number
SELECT * FROM vendors
WHERE phone IS NULL OR phone = ''
ORDER BY name;

-- Find vendors not linked to any tender
SELECT * FROM vendors
WHERE tender_id IS NULL;

-- Remove test/dummy vendors (mark as inactive)
UPDATE vendors
SET is_active = false
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%dummy%';

-- Archive old inactive vendors (keep for historical data)
-- Don't delete, just mark
UPDATE vendors
SET notes = CONCAT(COALESCE(notes, ''), ' [ARCHIVED]')
WHERE is_active = false
  AND created_at < NOW() - INTERVAL '1 year';

-- ============================================
-- 9. VERIFY MIGRATION SUCCESS
-- ============================================

-- Check if vendor_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'material_purchases' 
  AND column_name = 'vendor_id';

-- Check if vendor_products table exists
SELECT COUNT(*) as vendor_products_count
FROM vendor_products;

-- Check if triggers are installed
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%vendor_products%';

-- Verify data linking
SELECT 
  COUNT(*) as total_material_purchases,
  COUNT(vendor_id) as linked_to_vendor,
  COUNT(*) - COUNT(vendor_id) as not_linked,
  ROUND(COUNT(vendor_id)::numeric / COUNT(*) * 100, 2) as link_percentage
FROM material_purchases;

-- ============================================
-- 10. BACKUP QUERIES (Run BEFORE migration)
-- ============================================

-- Backup vendors table
CREATE TABLE vendors_backup_20240101 AS
SELECT * FROM vendors;

-- Backup material_purchases vendor-related fields
CREATE TABLE material_purchases_vendor_backup AS
SELECT id, supplier, vendor_id
FROM material_purchases;

-- Restore from backup if needed
-- UPDATE material_purchases mp
-- SET 
--   supplier = b.supplier,
--   vendor_id = b.vendor_id
-- FROM material_purchases_vendor_backup b
-- WHERE mp.id = b.id;

-- ============================================
-- END OF HELPER QUERIES
-- ============================================
