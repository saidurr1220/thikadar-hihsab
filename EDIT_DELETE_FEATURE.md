# Edit এবং Delete Functionality যোগ করা হয়েছে

## ✅ কি যোগ করা হয়েছে

### নতুন Component: EntryActions

**Location:** `components/EntryActions.tsx`

একটি reusable component যা যেকোনো entry তে edit এবং delete option দেয়।

**Features:**

- 🔘 **Three-dots menu** - প্রতিটি entry তে একটা menu button
- ✏️ **Edit option** - সম্পাদনা করার জন্য (coming soon)
- 🗑️ **Delete option** - মুছে ফেলার জন্য
- ⚠️ **Confirmation modal** - মুছার আগে নিশ্চিত করতে হবে
- 🔄 **Auto refresh** - মুছার পর page automatically refresh হবে

---

## 📋 কোথায় কোথায় যোগ করা হয়েছে

### 1. শ্রমিক রেজিস্টার (Labor Register)

**File:** `app/(protected)/tender/[tenderId]/labor/page.tsx`

- প্রতিটি labor entry তে three-dots menu
- Contract এবং Daily দুই ধরনের entry ই delete করা যাবে
- Table: `labor_entries`

### 2. মালামাল রেজিস্টার (Materials Register)

**File:** `app/(protected)/tender/[tenderId]/materials/page.tsx`

- প্রতিটি material purchase এ three-dots menu
- Regular এবং Bulk breakdown দুই ধরনের entry ই delete করা যাবে
- Table: `material_purchases`

### 3. কাজভিত্তিক খরচ (Activities Register)

**File:** `app/(protected)/tender/[tenderId]/activities/page.tsx`

- প্রতিটি activity expense এ three-dots menu
- সব category এর entry delete করা যাবে
- Table: `activity_expenses`

### 4. অগ্রিম হিসাব (Advances Register)

**File:** `app/(protected)/tender/[tenderId]/advances/page.tsx`

- প্রতিটি advance entry তে three-dots menu
- অগ্রিম দেওয়ার entry delete করা যাবে
- Table: `advances`

---

## 🎯 কিভাবে ব্যবহার করবেন

### Delete করতে:

1. যেকোনো register page এ যান (Labor, Materials, Activities, Advances)
2. যে entry মুছতে চান তার ডান পাশে **three dots (⋮)** বাটনে ক্লিক করুন
3. Dropdown menu থেকে **"🗑️ মুছে ফেলুন"** select করুন
4. Confirmation modal আসবে
5. **"হ্যাঁ, মুছে ফেলুন"** বাটনে ক্লিক করুন
6. Entry মুছে যাবে এবং page refresh হবে

### ⚠️ সতর্কতা:

- Entry মুছে ফেলার পর আর ফিরিয়ে আনা যাবে না
- Delete করার আগে ভালো করে চেক করে নিন
- Confirmation modal এ "বাতিল" বাটন আছে যদি মন পরিবর্তন করেন

---

## 🔧 Technical Details

### EntryActions Component Props:

```typescript
interface EntryActionsProps {
  entryId: string; // Entry এর ID
  tableName: string; // Database table name
  onDelete?: () => void; // Optional callback after delete
  editUrl?: string; // Edit page URL (future use)
}
```

### Usage Example:

```tsx
<EntryActions entryId={entry.id} tableName="labor_entries" />
```

### Database Tables:

- `labor_entries` - শ্রমিক entries
- `material_purchases` - মালামাল purchases
- `activity_expenses` - কাজভিত্তিক খরচ
- `advances` - অগ্রিম entries

### Features Added:

1. **Client Component** - Interactive UI with state management
2. **Supabase Client** - Direct database operations
3. **Router Refresh** - Automatic page refresh after delete
4. **Error Handling** - Shows error messages if delete fails
5. **Loading States** - Shows "মুছছি..." while deleting
6. **Modal Overlay** - Prevents accidental clicks during confirmation

---

## 🚀 পরবর্তী ধাপ (Coming Soon)

### Edit Functionality:

Edit feature এর জন্য প্রতিটি module এ edit page তৈরি করতে হবে:

1. **Labor Edit Page** - `/tender/[tenderId]/labor/edit/[entryId]`
2. **Materials Edit Page** - `/tender/[tenderId]/materials/edit/[purchaseId]`
3. **Activities Edit Page** - `/tender/[tenderId]/activities/edit/[activityId]`
4. **Advances Edit Page** - `/tender/[tenderId]/advances/edit/[advanceId]`

প্রতিটি edit page এ:

- Existing data pre-filled form
- Update করার option
- Validation
- Success/error messages

---

## ✅ সব ঠিক আছে!

এখন আপনি যেকোনো ভুল entry সহজেই মুছে ফেলতে পারবেন। প্রতিটি register page এ three-dots menu দেখতে পাবেন।

**Test করুন:**

1. একটা test entry create করুন
2. Three-dots menu click করুন
3. Delete করে দেখুন
4. Page refresh হয়ে entry চলে যাবে

Edit functionality শীঘ্রই যোগ করা হবে!
