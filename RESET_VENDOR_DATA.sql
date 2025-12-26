-- Reset all vendor-related data
-- This will delete all purchases, payments, and vendors
-- Use with caution - this cannot be undone!

-- Delete vendor purchases
DELETE FROM vendor_purchases;

-- Delete vendor payments
DELETE FROM vendor_payments;

-- Delete material purchases with vendor_id
UPDATE material_purchases SET vendor_id = NULL WHERE vendor_id IS NOT NULL;

-- Delete vendors (optional - comment out if you want to keep vendor records)
DELETE FROM vendors;

-- Reset sequences (if any)
-- This ensures IDs start fresh

SELECT 'All vendor data has been reset!' as status;
