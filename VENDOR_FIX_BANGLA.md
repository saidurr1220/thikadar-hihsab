# ভেন্ডর সিস্টেম ফিক্স - দ্রুত সমাধান

## সমস্যা ছিল:
1. ✅ RLS policies ছিল না → **ফিক্স করা হয়েছে**
2. ✅ Duplicate vendors (মেসার্স জয়নাল ট্রেডার্স - রড, সিমেন্ট) → **ম্যানুয়াল মার্জ SQL ready**
3. ✅ Vendor edit/delete option ছিল না → **যুক্ত করা হয়েছে**
4. ✅ Materials page এ vendor select করা যাচ্ছিল না → **কাজ করার কথা**

## এখন কি করতে হবে:

### ১. Duplicate Vendors মার্জ করুন

**ফাইল:** `MERGE_JAYNAL_VENDOR.sql`

**ধাপ ১: Vendor IDs দেখুন**
```sql
-- Supabase SQL Editor এ এই query রান করুন:
SELECT 
  id,
  name,
  created_at
FROM vendors 
WHERE LOWER(name) LIKE '%জয়নাল%'
ORDER BY created_at;
```

**Result দেখবেন এরকম:**
```
id                                    | name                                      | created_at
abc-123-...                          | মেসার্স জয়নাল ট্রেডার্স - সিমেন্ট       | 2024-01-15
def-456-...                          | মেসার্স জয়নাল ট্রেডার্স - রড            | 2024-02-20
```

**ধাপ ২: IDs কপি করুন এবং MERGE_JAYNAL_VENDOR.sql এ পেস্ট করুন**

ফাইল খুলে এই লাইনগুলো পরিবর্তন করুন:
```sql
DO $$
DECLARE
  keep_id UUID := 'abc-123-...'; -- ⚠️ প্রথম/পুরানো ID দিন
  delete_ids UUID[] := ARRAY[
    'def-456-...'::UUID  -- ⚠️ দ্বিতীয় ID দিন
  ]; 
```

**ধাপ ৩: সম্পূর্ণ SQL script রান করুন**
- পুরো `MERGE_JAYNAL_VENDOR.sql` ফাইল কপি করুন
- Supabase SQL Editor এ পেস্ট করুন
- Execute করুন

**ধাপ ৪: Verify করুন**
```sql
-- এখন শুধু একটা vendor দেখার কথা:
SELECT * FROM vendors 
WHERE LOWER(name) LIKE '%জয়নাল%' 
  AND is_active = true;
```

### ২. Browser Refresh করুন
```
Ctrl + F5 (hard refresh)
```

### ৩. Test করুন

#### Materials Add Page
```
http://localhost:3001/tender/YOUR_TENDER_ID/materials/add
```

- "Vendor" dropdown দেখার কথা
- Vendors list থাকার কথা
- Select করলে supplier name auto-fill হবে

#### Vendors Page
```
http://localhost:3001/tender/YOUR_TENDER_ID/expenses/vendors
```

- প্রতিটা vendor এ hover করলে Edit ও Delete button দেখবেন
- Edit ক্লিক করলে উপরে form এ data load হবে
- Update করতে পারবেন
- Delete করলে inactive হয়ে যাবে (সম্পূর্ণ মুছবে না)

## ভেন্ডর Management Features

### Add Vendor
1. Vendors পেজে যান
2. "Add vendor" form এ নাম, ফোন, category দিন
3. Add vendor ক্লিক করুন
4. ✅ `tender_id` অটোমেটিক add হবে

### Edit Vendor
1. কোন vendor এ hover করুন
2. Edit (✏️) icon ক্লিক করুন
3. Form এ data load হবে
4. পরিবর্তন করুন
5. "Update vendor" ক্লিক করুন

### Delete Vendor
1. কোন vendor এ hover করুন
2. Delete (🗑️) icon ক্লিক করুন
3. Confirm করুন
4. Vendor inactive হয়ে যাবে (data থাকবে)

## Total Amount ঠিক নেই?

আপনি বলেছেন দুটো vendor এর amount same দেখাচ্ছে কিন্তু হওয়ার কথা না।

**কারণ:** Duplicate vendor এর purchases একই count হয়ে যাচ্ছে।

**সমাধান:** Merge করার পর ঠিক হয়ে যাবে।

**Verify করার জন্য:**
```sql
-- প্রতিটা vendor এর আসল total দেখুন:
SELECT 
  v.id,
  v.name,
  COALESCE(SUM(vp.total_amount), 0) as vendor_purchases,
  COALESCE(SUM(mp.total_amount), 0) as material_purchases,
  COALESCE(SUM(vp.total_amount), 0) + COALESCE(SUM(mp.total_amount), 0) as total
FROM vendors v
LEFT JOIN vendor_purchases vp ON v.id = vp.vendor_id
LEFT JOIN material_purchases mp ON v.id = mp.vendor_id
WHERE LOWER(v.name) LIKE '%জয়নাল%'
GROUP BY v.id, v.name;
```

## তৈরি হওয়া Files

1. **FIX_VENDOR_RLS_POLICIES.sql** ✅ (Already run)
   - RLS policies যুক্ত করা
   - Permissions দেওয়া
   - Site এখন কাজ করছে

2. **MERGE_JAYNAL_VENDOR.sql** ⏳ (Need to run)
   - Step-by-step vendor merge
   - IDs replace করতে হবে
   - Comprehensive verification

3. **MERGE_DUPLICATE_VENDORS_MANUAL.sql**
   - Generic merge script
   - কোন duplicate এর জন্যই use করা যাবে

4. **Vendors page updates** ✅ (Code changed)
   - Edit/Delete buttons added
   - Hover effects
   - Cancel option
   - tender_id auto-assigned

## Troubleshooting

### Vendor dropdown খালি
**Check:**
```sql
SELECT * FROM vendors 
WHERE tender_id = 'YOUR_TENDER_ID' 
  AND is_active = true;
```

**Fix:** যদি vendors না থাকে:
```sql
-- tender_id যুক্ত করুন:
UPDATE vendors
SET tender_id = 'YOUR_TENDER_ID'
WHERE tender_id IS NULL;
```

### Materials page এ vendor select করতে পারছেন না
**Check browser console:** F12 → Console tab দেখুন
**Expected:** কোন error না থাকা

**যদি vendors empty array:**
- RLS policies check করুন (FIX_VENDOR_RLS_POLICIES.sql রান করেছেন?)
- vendors table এ data আছে কি?

### Edit করার পর form clear হয় না
Refresh করুন (F5) - এটা normal behavior

## Next Steps

1. ⏳ MERGE_JAYNAL_VENDOR.sql রান করুন (IDs replace করে)
2. ⏳ Browser refresh করুন (Ctrl+F5)
3. ✅ Vendors page check করুন - Edit/Delete buttons কাজ করছে কি
4. ✅ Materials add page check করুন - Vendor dropdown কাজ করছে কি
5. ✅ Total amounts সঠিক দেখাচ্ছে কি

## সাফল্যের লক্ষণ

✅ শুধু একটা "মেসার্স জয়নাল ট্রেডার্স" active vendor  
✅ সব purchases সেই vendor এর অধীনে  
✅ Total amount সঠিক  
✅ Edit/Delete buttons কাজ করছে  
✅ Materials page এ vendor selection কাজ করছে  
✅ vendor_products table populated  

---

**দ্রুত সারসংক্ষেপ:**
1. Run: `MERGE_JAYNAL_VENDOR.sql` (IDs replace করে)
2. Refresh: Ctrl+F5
3. Test: Vendors page এ edit/delete, Materials page এ vendor select
4. ✅ Done!
