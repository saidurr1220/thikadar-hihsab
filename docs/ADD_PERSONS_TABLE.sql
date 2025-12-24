-- Create persons table for non-auth users (suppliers, contractors, etc.)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL, -- site_manager, foreman, supplier, contractor, driver, etc.
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_persons_active ON persons(is_active);
CREATE INDEX idx_persons_role ON persons(role);

-- Update tender_assignments to support both auth users and persons
ALTER TABLE tender_assignments 
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES persons(id) ON DELETE CASCADE;

-- Make user_id nullable (for persons who are not auth users)
ALTER TABLE tender_assignments 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraint: either user_id or person_id must be set
ALTER TABLE tender_assignments
  ADD CONSTRAINT check_user_or_person CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

-- Update advances table to support persons
ALTER TABLE advances
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES persons(id) ON DELETE CASCADE;

ALTER TABLE advances
  ALTER COLUMN person_id DROP NOT NULL;

-- Add check: either person_id (auth user) or person_id (non-auth) must be set
-- Note: We'll use person_id for both, but keep backward compatibility

-- Update expense_submissions to support persons
ALTER TABLE expense_submissions
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES persons(id) ON DELETE CASCADE;

-- RLS Policies for persons table
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all persons
CREATE POLICY "Allow authenticated users to read persons"
  ON persons FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert persons
CREATE POLICY "Allow authenticated users to insert persons"
  ON persons FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update persons
CREATE POLICY "Allow authenticated users to update persons"
  ON persons FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete persons
CREATE POLICY "Allow authenticated users to delete persons"
  ON persons FOR DELETE
  TO authenticated
  USING (true);

-- Create view to get all people (both auth users and persons)
CREATE OR REPLACE VIEW all_people AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  'auth_user' as person_type,
  p.is_active
FROM profiles p
UNION ALL
SELECT 
  ps.id,
  ps.full_name,
  ps.role,
  'person' as person_type,
  ps.is_active
FROM persons ps;

COMMENT ON VIEW all_people IS 'Combined view of auth users and non-auth persons';
