-- Fix RLS Policies for Delete Operations
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Update can_approve function
-- ============================================

CREATE OR REPLACE FUNCTION can_approve(check_tender_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check if user is owner/admin globally
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Then check if user has approver role in this specific tender
  RETURN EXISTS (
    SELECT 1 FROM tender_assignments
    WHERE tender_id = check_tender_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'accountant', 'site_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Fix Tender Delete Policy
-- ============================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Owners can delete tenders" ON tenders;

-- Create new policy
CREATE POLICY "Owners can delete tenders"
  ON tenders FOR DELETE
  USING (
    -- Allow if user created the tender
    created_by = auth.uid() 
    OR 
    -- Allow if user is owner/admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR
    -- Allow if user has access to this tender
    EXISTS (
      SELECT 1 FROM tender_assignments
      WHERE tender_id = tenders.id AND user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 3: Verify policies exist
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('tenders', 'labor_entries', 'material_purchases', 'activity_expenses', 'advances')
  AND cmd = 'DELETE'
ORDER BY tablename;
