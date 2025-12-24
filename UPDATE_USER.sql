-- আপনার user profile update করুন
-- Supabase SQL Editor এ এটি run করুন

UPDATE profiles
SET 
  role = 'owner',
  full_name = 'Admin User',
  is_active = true
WHERE id = 'bce3a381-10af-4eac-b5b7-242d3f351ff2';

-- Verify করুন
SELECT * FROM profiles WHERE id = 'bce3a381-10af-4eac-b5b7-242d3f351ff2';
