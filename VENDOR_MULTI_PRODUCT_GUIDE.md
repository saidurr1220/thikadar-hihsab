# Vendor Multi-Product Support Implementation

## Overview
This update enables vendors to supply multiple products and integrates vendor selection in the materials purchase system.

## Changes Made

### 1. Database Schema Updates (`ADD_VENDOR_SUPPORT_TO_MATERIALS.sql`)

#### New Columns
- **material_purchases.vendor_id** - Links material purchases to vendors table
- **vendors.tender_id** - Makes vendors tender-specific

#### New Table: vendor_products
Tracks which products each vendor supplies:
```sql
- vendor_id (FK to vendors)
- material_id (FK to materials) - for standard materials
- item_name (TEXT) - for custom items
- unit (TEXT)
- last_unit_price (DECIMAL) - tracks last known price
- Unique constraint: (vendor_id, material_id, item_name)
```

#### Automatic Updates
- Triggers automatically update `vendor_products` when purchases are made
- Tracks latest prices for vendor-material combinations
- Works for both `material_purchases` and `vendor_purchases`

### 2. Materials Add Page Updates

#### New Features
- **Vendor Selection Dropdown**: Shows all active vendors with phone numbers
- **Auto-fill Supplier**: When vendor is selected, supplier name is auto-filled
- **Manual Override**: Users can still enter supplier name manually if vendor not in list

#### UI Changes
```tsx
// New vendor dropdown before supplier field
<Label htmlFor="vendorId">Vendor</Label>
<select value={formData.vendorId} onChange={handleVendorChange}>
  <option value="">Select vendor or enter below</option>
  {vendors.map(v => (
    <option key={v.id} value={v.id}>
      {v.name} {v.phone ? `(${v.phone})` : ""}
    </option>
  ))}
</select>

// Updated supplier field
<Label htmlFor="supplier">Supplier</Label>
<Input 
  value={formData.supplier}
  placeholder="Enter supplier name manually"
/>
<p className="text-xs text-gray-500">
  Select vendor above or enter supplier name manually
</p>
```

### 3. Data Migration

The SQL script automatically:

1. **Links Existing Purchases**
   - Matches `material_purchases.supplier` with `vendors.name`
   - Sets `vendor_id` where names match

2. **Merges Duplicate Vendors**
   - Finds vendors like "মেসার্স জয়নাল ট্রেডার্স - রড" and "মেসার্স জয়নাল ট্রেডার্স - সিমেন্ট"
   - Consolidates to single vendor "মেসার্স জয়নাল ট্রেডার্স"
   - Updates all purchases to use consolidated vendor
   - Marks duplicates as inactive

3. **Populates Vendor Products**
   - Extracts unique vendor-product combinations from purchases
   - Records latest unit prices
   - Creates vendor_products entries for quick lookup

## Usage

### For Users

#### Adding Material Purchase with Vendor
1. Go to Materials → Add Purchase
2. Select existing vendor from dropdown (if available)
   - Vendor name auto-fills in supplier field
3. OR enter supplier name manually
4. Continue with quantity, price, etc.

#### Managing Vendors
- Create vendors from Vendors page
- Vendor automatically tracks all products purchased from them
- View vendor's product history and latest prices

### For Developers

#### Querying Materials with Vendor
```typescript
const { data } = await supabase
  .from('material_purchases')
  .select(`
    *,
    vendor:vendors(name, phone),
    material:materials(name_bn)
  `)
  .eq('tender_id', tenderId);
```

#### Getting Vendor Products
```typescript
const { data } = await supabase
  .from('vendor_products')
  .select(`
    *,
    vendor:vendors(name, phone),
    material:materials(name_bn)
  `)
  .eq('vendor_id', vendorId);
```

## Benefits

1. **Multi-Product Vendors**: Single vendor can supply multiple materials (rod, cement, bricks, etc.)
2. **Price History**: Track latest prices for each vendor-material combination
3. **Quick Selection**: Dropdown of existing vendors speeds up data entry
4. **Flexibility**: Can still enter supplier manually if vendor not in system
5. **Data Integrity**: Foreign keys ensure referential integrity
6. **Automatic Tracking**: Vendor products automatically updated on each purchase

## Migration Steps

1. Run the SQL migration: `ADD_VENDOR_SUPPORT_TO_MATERIALS.sql`
2. Verify vendors table has tender_id column
3. Verify material_purchases has vendor_id column
4. Check vendor_products table is created
5. Verify duplicate vendors are merged
6. Test materials add page with vendor selection

## Example Scenarios

### Scenario 1: Existing Vendor
User "shahnewaz" has supplied materials before:
1. Create vendor entry for "Shahnewaz" with phone number
2. Migration script links past purchases to this vendor
3. vendor_products table tracks what shahnewaz supplies
4. Future purchases can select "Shahnewaz" from dropdown

### Scenario 2: Multiple Products
"মেসার্স জয়নাল ট্রেডার্স" supplies both rod and cement:
1. Migration merges duplicate entries
2. Single vendor entry: "মেসার্স জয়নাল ট্রেডার্স"
3. vendor_products has two entries:
   - রড (rod) with last price
   - সিমেন্ট (cement) with last price
4. Both products' purchases linked to same vendor

### Scenario 3: New Vendor
Adding purchase from new supplier:
1. Enter supplier name manually in field
2. Later, create proper vendor entry
3. Run update query to link past purchases
4. OR use vendor dropdown for future purchases

## Technical Notes

- **Tender-Specific Vendors**: Each tender can have its own vendor list
- **Soft Delete**: Duplicate vendors marked inactive, not deleted (preserves references)
- **Automatic Updates**: Triggers handle vendor_products updates
- **Price Tracking**: Always stores latest unit price per vendor-material
- **Null Safety**: vendor_id is nullable - can have purchases without vendor link

## Testing Checklist

- [ ] Vendor dropdown loads in materials add page
- [ ] Selecting vendor auto-fills supplier name
- [ ] Manual supplier entry still works
- [ ] Purchase saves with vendor_id
- [ ] vendor_products updates after purchase
- [ ] Duplicate vendors merged successfully
- [ ] Reports include vendor information
- [ ] Edit page also has vendor selection

## Future Enhancements

1. **Vendor Management UI**
   - View all products a vendor supplies
   - Edit vendor product prices
   - Add new products to vendor

2. **Price Suggestions**
   - Show last price when selecting vendor-material combo
   - Warn if price significantly different from last purchase

3. **Vendor Analytics**
   - Total spent per vendor
   - Most used vendors
   - Price trends per vendor

4. **Bulk Import**
   - Import vendors from Excel
   - Import past purchases with vendor linking
