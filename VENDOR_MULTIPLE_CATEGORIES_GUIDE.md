# ভেন্ডর সিস্টেম নতুন ফিচার গাইড

## 🎯 নতুন কি যুক্ত হয়েছে

### ১. ভেন্ডর পেমেন্ট রিসেট করার SQL
**ফাইল:** `RESET_VENDOR_PAYMENTS.sql`

এই SQL ফাইল দিয়ে আপনি সব vendor-related data রিসেট করতে পারবেন:
- সব vendor payments মুছে ফেলবে
- সব vendor purchases মুছে ফেলবে  
- Material purchases থেকে vendor link সরিয়ে ফেলবে
- Vendor products tracking ডেটা পরিষ্কার করবে

**কিভাবে ব্যবহার করবেন:**
1. Supabase SQL Editor খুলুন
2. `RESET_VENDOR_PAYMENTS.sql` ফাইলের সব কোড কপি করুন
3. SQL Editor-এ পেস্ট করুন
4. Run (Execute) করুন

⚠️ **সাবধান:** এই operation পূর্বাবস্থায় ফেরানো যাবে না!

---

### ২. একাধিক Category নির্বাচনের সুবিধা
**ফাইল:** `ADD_VENDOR_MULTIPLE_CATEGORIES.sql`

এখন vendor-দের একাধিক category assign করতে পারবেন। উদাহরণ:
- "মেসার্স জয়নাল ট্রেডার্স" একই সাথে "সিমেন্ট" এবং "রড" সরবরাহ করতে পারে
- একজন vendor একাধিক product category-র জন্য tag করা যাবে

**Database Migration চালান:**
1. Supabase SQL Editor খুলুন
2. `ADD_VENDOR_MULTIPLE_CATEGORIES.sql` ফাইলের কোড রান করুন
3. Success message দেখুন: ✅

**কি যুক্ত হয়েছে:**
- নতুন table: `vendor_category_mappings` (many-to-many relationship)
- Helper function: `get_vendor_categories()` - vendor-র সব categories পাওয়ার জন্য
- View: `vendor_with_categories` - সহজে query করার জন্য
- Automatic data migration - পুরোনো single category data নতুন system-এ চলে যাবে

---

## 🎨 Frontend পরিবর্তন

### Vendor Page Update
**ফাইল:** `app/(protected)/tender/[tenderId]/expenses/vendors/page.tsx`

**পরিবর্তনসমূহ:**

1. **Multi-Select Category Checkbox**
   - পুরোনো single dropdown এর পরিবর্তে checkbox grid
   - একাধিক category একসাথে select করা যাবে
   - Real-time update

2. **Category Display**
   - Vendor card-এ সব assigned categories badge হিসেবে দেখাবে
   - Color-coded badges যাতে easily দেখা যায়

3. **Category Filter**
   - Filter button-এ click করলে শুধু সেই category-র vendors দেখাবে
   - যেসব vendor-এ ওই category আছে, তারা সবাই দেখাবে

---

## 📖 ব্যবহারের উদাহরণ

### SQL Examples:

#### একটি vendor-এ multiple categories যোগ করুন
```sql
-- Vendor ID খুঁজে নিন
SELECT id, name FROM vendors WHERE name LIKE '%জয়নাল%';

-- Categories যোগ করুন
INSERT INTO vendor_category_mappings (vendor_id, category_id)
VALUES 
  ('vendor-uuid-here', (SELECT id FROM vendor_categories WHERE name = 'cement')),
  ('vendor-uuid-here', (SELECT id FROM vendor_categories WHERE name = 'steel'));
```

#### একটি vendor-র সব categories দেখুন
```sql
SELECT * FROM get_vendor_categories('vendor-uuid-here');
```

#### একটি category-র সব vendors খুঁজুন
```sql
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
```

---

## ✅ Setup Checklist

- [ ] Database migration চালান (`ADD_VENDOR_MULTIPLE_CATEGORIES.sql`)
- [ ] Verification queries চালিয়ে check করুন সব ঠিক আছে কিনা
- [ ] Frontend page reload করুন
- [ ] Test vendor তৈরি করে multiple categories select করুন
- [ ] Filter test করুন - different categories-এ switch করে দেখুন

---

## 🐛 Troubleshooting

### যদি migration error দেয়:
1. Check করুন `vendor_categories` table আছে কিনা
2. Check করুন আপনার user-এর permission আছে কিনা
3. SQL Editor-এ step by step run করুন

### যদি frontend-এ categories load না হয়:
1. Browser console check করুন error আছে কিনা
2. Supabase RLS policies check করুন
3. Page refresh করুন (Hard reload: Ctrl+Shift+R)

### যদি পুরোনো data missing হয়:
- Migration automatically পুরোনো single category data নতুন system-এ migrate করে দেয়
- `vendors.category_id` column এখনও আছে backward compatibility-র জন্য

---

## 📝 Notes

1. **Backward Compatibility**: পুরোনো `category_id` column এখনও আছে, কিছু break হবে না
2. **Performance**: Proper indexing করা আছে, query slow হবে না
3. **Data Integrity**: Unique constraint আছে, duplicate entry হবে না
4. **Security**: RLS policies সব place-এ enable করা আছে

---

## 💡 Future Improvements (ভবিষ্যৎ উন্নতি)

- [ ] Category-wise purchase reports
- [ ] Vendor performance analytics by category
- [ ] Auto-suggest vendors based on purchase item
- [ ] Vendor rating system
- [ ] Price comparison across vendors for same category

---

আরও সাহায্যের জন্য বা কোনো সমস্যা হলে জানান! 🙂
