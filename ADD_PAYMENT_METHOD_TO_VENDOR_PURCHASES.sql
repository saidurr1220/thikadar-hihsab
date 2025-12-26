-- ============================================
-- STEP 1: Run this first (add enum value)
-- ============================================
-- Add 'due' to the payment_method enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'due' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')
    ) THEN
        ALTER TYPE payment_method ADD VALUE 'due';
    END IF;
END $$;

-- ============================================
-- STEP 2: Run this after STEP 1 is committed
-- ============================================
-- Now add the column
ALTER TABLE vendor_purchases 
ADD COLUMN IF NOT EXISTS payment_method payment_method DEFAULT 'due';

-- Update existing records to 'due' if not specified
UPDATE vendor_purchases 
SET payment_method = 'due' 
WHERE payment_method IS NULL;

-- Create index for payment method queries
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_payment_method 
ON vendor_purchases(payment_method);

COMMENT ON COLUMN vendor_purchases.payment_method IS 'Payment method: cash (paid immediately), bank (paid immediately), due (pay later)';
