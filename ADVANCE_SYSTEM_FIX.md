# Advance System Fix - Step by Step Guide

## সমস্যা

1. Give advance page এ 10,000 টাকা দেখাচ্ছে যা main advance এর সাথে মিলছে না
2. অন্য person এর জন্য 0 দেখাচ্ছে
3. পুরনো `advances` table এ data ছিল কিন্তু নতুন `person_advances` table ব্যবহার করা হচ্ছে
4. Database function গুলো পুরনো table reference করছিল

## সমাধান

### Step 1: Database Function Update করুন

Supabase SQL Editor এ যান এবং নিচের file টি run করুন:

```
FIX_PERSON_BALANCE_FUNCTION.sql
```

এটি `get_person_balance` এবং `get_person_balances` function গুলো update করবে যাতে তারা `person_advances` এবং `person_expenses` table ব্যবহার করে।

### Step 2: পুরনো Data Delete করুন

Supabase SQL Editor এ যান এবং এই query run করুন:

```sql
-- Check old data first
SELECT * FROM advances WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- If you see the 10,000 BDT entry, delete it
DELETE FROM advances WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';
```

অথবা `DELETE_OLD_ADVANCES.sql` file টি use করুন।

### Step 3: Verify

1. http://localhost:3000/tender/b7ea3020-5ebc-4601-87bb-16ece04ee68c/advances/give এ যান
2. একটি existing person select করুন
3. তাদের সঠিক balance দেখাবে (যদি আগে person_advances এ data থাকে)
4. Amount 0 দিলে শুধু person list এ add হবে, advance দেওয়া হবে না

## নতুন Features

### 1. Simplified Form

- Amount এখন optional (0 দিলে শুধু person add হবে)
- Purpose optional করা হয়েছে
- Amount 0 হলে payment method এবং reference field hide হবে

### 2. Balance Display

- Person select করলে তাদের current balance দেখাবে
- Positive balance = বাকি আছে (person এর কাছে টাকা আছে)
- Negative balance = পাওনা (person খরচ বেশি করেছে)

### 3. Person Management

- নতুন person যোগ করা যাবে
- Optional advance দেওয়া যাবে
- Existing person এ advance দেওয়া যাবে

## Database Schema Changes

### Old Tables (এখন আর ব্যবহার হয় না):

- `advances` - পুরনো advance tracking
- `expense_submissions` - পুরনো expense tracking

### New Tables (এখন ব্যবহার হচ্ছে):

- `person_advances` - নতুন advance tracking (auth users + non-auth persons)
- `person_expenses` - নতুন expense tracking

## Important Notes

1. পুরনো `advances` table এ যদি আরো data থাকে, সেগুলো migrate করতে হবে `person_advances` এ
2. Function update না করলে balance ভুল দেখাবে
3. নতুন advance সব `person_advances` table এ যাবে
4. Dashboard calculation ঠিক আছে - expense_rollup view সঠিকভাবে কাজ করছে
