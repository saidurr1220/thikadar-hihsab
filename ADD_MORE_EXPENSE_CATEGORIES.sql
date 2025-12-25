-- Add More Common Expense Categories
-- Run this in Supabase SQL Editor

-- Add new main categories
INSERT INTO expense_categories (name_en, name_bn, description, icon) VALUES
('Labor Support', 'শ্রমিক সহায়তা', 'Work assistants, helpers, supervisors', '👷‍♂️'),
('Vehicle Rental', 'যানবাহন ভাড়া', 'Truck, pickup, vehicle rental costs', '🚛'),
('Site Maintenance', 'সাইট রক্ষণাবেক্ষণ', 'Site cleaning, maintenance, repairs', '🔧'),
('Food & Refreshment', 'খাবার ও জলপান', 'Worker meals, tea, snacks', '🍽️'),
('Communication', 'যোগাযোগ', 'Phone bills, internet, courier', '📞')
ON CONFLICT (name_en) DO NOTHING;

-- Add subcategories for Labor Support
INSERT INTO expense_subcategories (category_id, name_en, name_bn, description) 
SELECT 
  c.id,
  sub.name_en,
  sub.name_bn,
  sub.description
FROM expense_categories c
CROSS JOIN (
  VALUES 
    ('Work Assistant', 'কাজের সহকারী', 'Daily work assistant wages'),
    ('Site Supervisor', 'সাইট সুপারভাইজার', 'Supervisor salary/payment'),
    ('Helper', 'হেল্পার', 'General helper wages'),
    ('Night Guard', 'রাত্রি প্রহরী', 'Night security guard'),
    ('Cleaner', 'পরিচ্ছন্নতাকর্মী', 'Site cleaning staff')
) AS sub(name_en, name_bn, description)
WHERE c.name_en = 'Labor Support'
ON CONFLICT (category_id, name_en) DO NOTHING;

-- Add subcategories for Vehicle Rental
INSERT INTO expense_subcategories (category_id, name_en, name_bn, description)
SELECT 
  c.id,
  sub.name_en,
  sub.name_bn,
  sub.description
FROM expense_categories c
CROSS JOIN (
  VALUES 
    ('Truck Rental', 'ট্রাক ভাড়া', 'Truck rental for material transport'),
    ('Pickup Rental', 'পিকআপ ভাড়া', 'Pickup van rental'),
    ('Tractor Rental', 'ট্রাক্টর ভাড়া', 'Tractor rental for earthwork'),
    ('Rickshaw/Van', 'রিকশা/ভ্যান', 'Local transport'),
    ('Fuel Cost', 'জ্বালানি খরচ', 'Fuel for vehicles')
) AS sub(name_en, name_bn, description)
WHERE c.name_en = 'Vehicle Rental'
ON CONFLICT (category_id, name_en) DO NOTHING;

-- Add subcategories for Food & Refreshment
INSERT INTO expense_subcategories (category_id, name_en, name_bn, description)
SELECT 
  c.id,
  sub.name_en,
  sub.name_bn,
  sub.description
FROM expense_categories c
CROSS JOIN (
  VALUES 
    ('Worker Meals', 'শ্রমিক খাবার', 'Meals for workers'),
    ('Tea/Snacks', 'চা/নাস্তা', 'Tea and snacks'),
    ('Water', 'পানি', 'Drinking water'),
    ('Special Occasion', 'বিশেষ অনুষ্ঠান', 'Festival/special day meals')
) AS sub(name_en, name_bn, description)
WHERE c.name_en = 'Food & Refreshment'
ON CONFLICT (category_id, name_en) DO NOTHING;

-- Add subcategories for Communication
INSERT INTO expense_subcategories (category_id, name_en, name_bn, description)
SELECT 
  c.id,
  sub.name_en,
  sub.name_bn,
  sub.description
FROM expense_categories c
CROSS JOIN (
  VALUES 
    ('Mobile Bill', 'মোবাইল বিল', 'Phone bills'),
    ('Internet', 'ইন্টারনেট', 'Internet charges'),
    ('Courier', 'কুরিয়ার', 'Document delivery'),
    ('Printing', 'প্রিন্টিং', 'Document printing/photocopy')
) AS sub(name_en, name_bn, description)
WHERE c.name_en = 'Communication'
ON CONFLICT (category_id, name_en) DO NOTHING;

-- Verify new categories
SELECT 
  c.name_bn as category,
  COUNT(s.id) as subcategory_count
FROM expense_categories c
LEFT JOIN expense_subcategories s ON s.category_id = c.id
GROUP BY c.id, c.name_bn
ORDER BY c.name_bn;
