-- Fix Delete Permission for Tenders and Entries
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX: Allow owners to delete their own tenders
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Owners can delete tenders" ON tenders;

-- Create new policy that allows owners to delete
CREATE POLICY "Owners can delete tenders"
  ON tenders FOR DELETE
  USING (
    created_by = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- FIX: Update can_approve function to be more permissive
-- ============================================

CREATE OR REPLACE FUNCTION can_approve(check_tender_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is owner/admin globally
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has approver role in this tender
  RETURN EXISTS (
    SELECT 1 FROM tender_assignments
    WHERE tender_id = check_tender_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'accountant', 'site_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFY: Check if policies are working
-- ============================================

-- List all delete policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE cmd = 'DELETE'
  AND tablename IN ('tenders', 'labor_entries', 'material_purchases', 'activity_expenses', 'advances')
ORDER BY tablename, policyname;

-- Test if current user can delete (should return TRUE for owner)
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as user_role,
  can_approve('00000000-0000-0000-0000-000000000000'::uuid) as can_approve_test;
