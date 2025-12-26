# Vendor System Quick Reference (বিক্রেতা সিস্টেম)

## কি পরিবর্তন হয়েছে (What Changed)

### ১. মালামাল যোগ করার পেজ (Materials Add Page)
- এখন **বিক্রেতা নির্বাচন** dropdown আছে
- বিক্রেতা সিলেক্ট করলে নাম অটোমেটিক ভরা হবে
- বা ম্যানুয়ালি সরবরাহকারীর নাম লিখতে পারবেন

### ২. মালামাল এডিট পেজ (Materials Edit Page)
- একইভাবে বিক্রেতা সিলেক্ট করা যাবে
- পুরানো ক্রয়ের বিক্রেতা দেখা যাবে

### ৩. ডাটাবেজ মাইগ্রেশন (Database Migration)
- ডুপ্লিকেট বিক্রেতা মার্জ হবে
- যেমন: "মেসার্স জয়নাল ট্রেডার্স - রড" এবং "মেসার্স জয়নাল ট্রেডার্স - সিমেন্ট" → একটা হবে "মেসার্স জয়নাল ট্রেডার্স"
- সব প্রোডাক্ট একই বিক্রেতার অধীনে ট্র্যাক হবে

## কিভাবে ব্যবহার করবেন (How to Use)

### মালামাল ক্রয় যোগ করা (Adding Material Purchase)

**অপশন ১: পুরানো বিক্রেতা থেকে (From Existing Vendor)**
1. Materials → Add Purchase
2. **বিক্রেতা** dropdown থেকে সিলেক্ট করুন
3. সরবরাহকারীর নাম অটোমেটিক ভরা হবে
4. পরিমাণ, দাম ইত্যাদি দিন
5. সংরক্ষণ করুন

**অপশন ২: নতুন সরবরাহকারী (New Supplier)**
1. Materials → Add Purchase
2. বিক্রেতা dropdown খালি রাখুন
3. সরবরাহকারী ফিল্ডে ম্যানুয়ালি নাম লিখুন
4. সংরক্ষণ করুন

### মালামাল ক্রয় এডিট করা (Editing Material Purchase)
1. Materials → ক্রয়ের পাশে Edit ক্লিক করুন
2. বিক্রেতা চেঞ্জ করতে পারবেন
3. অথবা সরবরাহকারী নাম ম্যানুয়ালি চেঞ্জ করতে পারবেন

## ডাটাবেজ সেটআপ (Database Setup)

### মাইগ্রেশন রান করুন (Run Migration)
```sql
-- Supabase SQL Editor এ যান
-- এই ফাইলটি রান করুন:
ADD_VENDOR_SUPPORT_TO_MATERIALS.sql
```

### কি হবে (What Will Happen)
1. ✅ material_purchases এ vendor_id কলাম যুক্ত হবে
2. ✅ vendors এ tender_id কলাম যুক্ত হবে
3. ✅ vendor_products টেবিল তৈরি হবে
4. ✅ পুরানো ক্রয়গুলো বিক্রেতার সাথে লিঙ্ক হবে (নাম মিললে)
5. ✅ ডুপ্লিকেট বিক্রেতা মার্জ হবে
6. ✅ Trigger সেট হবে (অটোমেটিক আপডেটের জন্য)

### Shahnewaz এর ক্রয় মাইগ্রেট করা (Migrate Shahnewaz Purchases)

```sql
-- Step 1: Check existing purchases
SELECT * FROM material_purchases 
WHERE LOWER(supplier) LIKE '%shahnewaz%';

-- Step 2: Create vendor entry (if not exists)
INSERT INTO vendors (name, phone, tender_id, is_active, created_by)
VALUES (
  'Shahnewaz',
  '01712345678', -- actual phone number
  'your-tender-id', -- actual tender ID
  true,
  'your-user-id' -- actual user ID
);

-- Step 3: Get the new vendor ID
SELECT id FROM vendors WHERE name = 'Shahnewaz';

-- Step 4: Link purchases to vendor
UPDATE material_purchases
SET vendor_id = 'vendor-id-from-step-3'
WHERE LOWER(supplier) LIKE '%shahnewaz%';
```

## সুবিধা (Benefits)

### ১. দ্রুত এন্ট্রি (Faster Entry)
- বিক্রেতা dropdown থেকে সিলেক্ট করুন
- নাম টাইপ করার দরকার নেই

### ২. একই বিক্রেতা, অনেক প্রোডাক্ট (One Vendor, Many Products)
- একই বিক্রেতা থেকে রড, সিমেন্ট, ইট সব কিনতে পারবেন
- আলাদা আলাদা এন্ট্রি দরকার নেই

### ৩. দাম ট্র্যাকিং (Price Tracking)
- প্রতিটি বিক্রেতার শেষ দাম সেভ থাকবে
- পরে দামের তুলনা করতে পারবেন

### ৪. রিপোর্ট (Reports)
- বিক্রেতা অনুযায়ী খরচ দেখতে পারবেন
- কোন বিক্রেতা থেকে কি কিনেছেন দেখতে পারবেন

## উদাহরণ (Example)

### আগে (Before)
```
Vendors:
- মেসার্স জয়নাল ট্রেডার্স - রড
- মেসার্স জয়নাল ট্রেডার্স - সিমেন্ট
- মেসার্স জয়নাল ট্রেডার্স - ইট
```

### পরে (After)
```
Vendor:
- মেসার্স জয়নাল ট্রেডার্স

Products:
  - রড (last price: ৭৫ টাকা/kg)
  - সিমেন্ট (last price: ৪৫০ টাকা/bag)
  - ইট (last price: ৮ টাকা/piece)
```

## প্রযুক্তিগত তথ্য (Technical Info)

### নতুন ডাটাবেজ ফিল্ড (New Database Fields)
- `material_purchases.vendor_id` - বিক্রেতা লিঙ্ক
- `vendors.tender_id` - টেন্ডার লিঙ্ক
- `vendor_products` table - বিক্রেতা-প্রোডাক্ট ম্যাপিং

### পুরানো ফিল্ড (Old Fields - Still Work)
- `material_purchases.supplier` - এখনও কাজ করে
- Backward compatible

## সমস্যা সমাধান (Troubleshooting)

### বিক্রেতা dropdown খালি (Vendor dropdown empty)
- Check: vendors টেবিলে tender_id দিয়ে এন্ট্রি আছে কি?
- Check: vendors.is_active = true কি?
- Solution: Vendors পেজ থেকে বিক্রেতা যোগ করুন

### পুরানো ক্রয় vendor_id নেই (Old purchases no vendor_id)
- Migration script রান করেছেন কি?
- Supplier name vendors.name এর সাথে exact match করে কি?
- Solution: Manual update query চালান

### ডুপ্লিকেট বিক্রেতা এখনও আছে (Duplicate vendors still exist)
- Migration script রান করেছেন কি?
- Check: vendors টেবিলে is_active = false হয়েছে কি পুরানো এন্ট্রিগুলোর?
- Solution: Migration script আবার রান করুন

## সাহায্যের জন্য (For Help)

**Documentation Files:**
- `ADD_VENDOR_SUPPORT_TO_MATERIALS.sql` - Migration script
- `VENDOR_MULTI_PRODUCT_GUIDE.md` - Detailed guide
- `VENDOR_IMPLEMENTATION_COMPLETE.md` - Complete summary
- `VENDOR_QUICK_REFERENCE.md` - This file

**Contact Developer if:**
- Migration fails
- Data not linking correctly
- Need custom vendor management features
