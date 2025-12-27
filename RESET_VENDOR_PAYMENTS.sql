-- =============================================
-- RESET VENDOR PAYMENTS & RELATED DATA
-- =============================================
-- এই SQL সব vendor payment, purchase এবং সংশ্লিষ্ট ডাটা রিসেট করবে
-- সাবধান: এটি পূর্বাবস্থায় ফেরানো যাবে না!

-- =============================================
-- SECTION 1: DELETE ALL VENDOR PAYMENTS
-- =============================================
-- সব vendor payment মুছে ফেলুন
DELETE FROM vendor_payments;

-- =============================================
-- SECTION 2: DELETE ALL VENDOR PURCHASES
-- =============================================
-- সব vendor purchase মুছে ফেলুন
DELETE FROM vendor_purchases;

-- =============================================
-- SECTION 3: RESET MATERIAL PURCHASES VENDOR LINKS
-- =============================================
-- Material purchases থেকে vendor link সরান
UPDATE material_purchases 
SET vendor_id = NULL 
WHERE vendor_id IS NOT NULL;

-- =============================================
-- SECTION 4: DELETE VENDOR PRODUCTS
-- =============================================
-- Vendor products tracking table পরিষ্কার করুন
DELETE FROM vendor_products WHERE true;

-- =============================================
-- SECTION 5: RESET VENDORS (OPTIONAL)
-- =============================================
-- যদি vendor entries-ও মুছতে চান, তাহলে নিচের line uncomment করুন:
-- DELETE FROM vendors;

-- বা শুধু inactive করতে চাইলে:
-- UPDATE vendors SET is_active = false;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Reset হয়েছে কিনা চেক করুন:

SELECT 
  'Vendor Payments' as table_name, 
  COUNT(*) as record_count 
FROM vendor_payments
UNION ALL
SELECT 
  'Vendor Purchases', 
  COUNT(*) 
FROM vendor_purchases
UNION ALL
SELECT 
  'Material Purchases with vendor_id', 
  COUNT(*) 
FROM material_purchases 
WHERE vendor_id IS NOT NULL
UNION ALL
SELECT 
  'Vendor Products', 
  COUNT(*) 
FROM vendor_products
UNION ALL
SELECT 
  'Active Vendors', 
  COUNT(*) 
FROM vendors 
WHERE is_active = true;

-- =============================================
SELECT '✅ Vendor payment data reset complete!' as status;
-- =============================================
