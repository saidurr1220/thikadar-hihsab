-- =============================================
-- ADD MULTIPLE CATEGORY SUPPORT TO VENDORS
-- =============================================
-- এই migration vendor-দের একাধিক category নির্বাচন করার সুবিধা যোগ করবে

-- =============================================
-- STEP 1: CREATE JUNCTION TABLE
-- =============================================
-- Vendor এবং category-র মধ্যে many-to-many relationship তৈরি করুন

CREATE TABLE IF NOT EXISTS vendor_category_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES vendor_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- একই vendor এর জন্য একই category দুইবার যোগ হবে না
  UNIQUE(vendor_id, category_id)
);

-- Index তৈরি করুন faster query-র জন্য
CREATE INDEX IF NOT EXISTS idx_vendor_category_mappings_vendor 
ON vendor_category_mappings(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_category_mappings_category 
ON vendor_category_mappings(category_id);

-- =============================================
-- STEP 2: MIGRATE EXISTING DATA
-- =============================================
-- পুরোনো single category data-কে new table-এ মাইগ্রেট করুন

INSERT INTO vendor_category_mappings (vendor_id, category_id)
SELECT id, category_id
FROM vendors
WHERE category_id IS NOT NULL
ON CONFLICT (vendor_id, category_id) DO NOTHING;

-- =============================================
-- STEP 3: ADD RLS POLICIES
-- =============================================
-- Row Level Security enable করুন

ALTER TABLE vendor_category_mappings ENABLE ROW LEVEL SECURITY;

-- Authenticated users read করতে পারবে
CREATE POLICY "Allow authenticated users to read vendor category mappings"
  ON vendor_category_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users insert করতে পারবে
CREATE POLICY "Allow authenticated users to insert vendor category mappings"
  ON vendor_category_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users delete করতে পারবে
CREATE POLICY "Allow authenticated users to delete vendor category mappings"
  ON vendor_category_mappings FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- STEP 4: CREATE HELPER FUNCTION
-- =============================================
-- Vendor-র সব categories পাওয়ার জন্য helper function

CREATE OR REPLACE FUNCTION get_vendor_categories(p_vendor_id UUID)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_name_bn TEXT
) AS $$
  SELECT 
    vc.id as category_id,
    vc.name as category_name,
    vc.name_bn as category_name_bn
  FROM vendor_category_mappings vcm
  JOIN vendor_categories vc ON vc.id = vcm.category_id
  WHERE vcm.vendor_id = p_vendor_id
  AND vc.is_active = true
  ORDER BY vc.name_bn;
$$ LANGUAGE sql;

-- =============================================
-- STEP 5: CREATE HELPER VIEW (OPTIONAL)
-- =============================================
-- Vendor-দের সাথে তাদের categories দেখার জন্য view

CREATE OR REPLACE VIEW vendor_with_categories AS
SELECT 
  v.id,
  v.name,
  v.phone,
  v.notes,
  v.is_active,
  v.category_id as legacy_category_id,
  v.created_at,
  v.created_by,
  ARRAY_AGG(DISTINCT vc.name_bn ORDER BY vc.name_bn) FILTER (WHERE vc.id IS NOT NULL) as category_names_bn,
  ARRAY_AGG(DISTINCT vc.name ORDER BY vc.name) FILTER (WHERE vc.id IS NOT NULL) as category_names,
  ARRAY_AGG(DISTINCT vcm.category_id) FILTER (WHERE vcm.category_id IS NOT NULL) as category_ids
FROM vendors v
LEFT JOIN vendor_category_mappings vcm ON vcm.vendor_id = v.id
LEFT JOIN vendor_categories vc ON vc.id = vcm.category_id AND vc.is_active = true
GROUP BY v.id, v.name, v.phone, v.notes, v.is_active, v.category_id, v.created_at, v.created_by;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check: Junction table created
SELECT 
  'vendor_category_mappings table' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ Created' ELSE '❌ Not found' END as status
FROM information_schema.tables 
WHERE table_name = 'vendor_category_mappings';

-- Check: Data migrated
SELECT 
  'Migrated mappings' as check_item,
  COUNT(*) || ' records' as status
FROM vendor_category_mappings;

-- Check: Helper function created
SELECT 
  'get_vendor_categories function' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ Created' ELSE '❌ Not found' END as status
FROM pg_proc 
WHERE proname = 'get_vendor_categories';

-- Check: View created
SELECT 
  'vendor_with_categories view' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ Created' ELSE '❌ Not found' END as status
FROM information_schema.views 
WHERE table_name = 'vendor_with_categories';

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Example 1: একটি vendor-এ multiple categories যোগ করুন
/*
INSERT INTO vendor_category_mappings (vendor_id, category_id)
VALUES 
  ('vendor-uuid-here', (SELECT id FROM vendor_categories WHERE name = 'cement')),
  ('vendor-uuid-here', (SELECT id FROM vendor_categories WHERE name = 'steel'));
*/

-- Example 2: একটি vendor-র সব categories দেখুন
/*
SELECT * FROM get_vendor_categories('vendor-uuid-here');
*/

-- Example 3: View ব্যবহার করে সব vendor এবং তাদের categories দেখুন
/*
SELECT 
  name,
  phone,
  category_names_bn,
  is_active
FROM vendor_with_categories
WHERE is_active = true
ORDER BY name;
*/

-- Example 4: একটি specific category-র সব vendors খুঁজুন
/*
SELECT DISTINCT
  v.id,
  v.name,
  v.phone
FROM vendors v
JOIN vendor_category_mappings vcm ON vcm.vendor_id = v.id
JOIN vendor_categories vc ON vc.id = vcm.category_id
WHERE vc.name = 'cement'
  AND v.is_active = true
ORDER BY v.name;
*/

-- =============================================
SELECT '✅ Multiple category support added successfully!' as status;
-- =============================================

-- =============================================
-- NOTES (নোট):
-- =============================================
-- 1. পুরোনো vendors.category_id column এখনও আছে backward compatibility-র জন্য
-- 2. নতুন vendor_category_mappings table ব্যবহার করুন multiple categories-র জন্য
-- 3. Frontend update করতে হবে multi-select dropdown যোগ করার জন্য
-- =============================================
