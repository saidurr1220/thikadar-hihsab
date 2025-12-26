-- Delete old advances data from the 'advances' table
-- This script will clean up any data from the old advances table
-- Make sure to run FIX_PERSON_BALANCE_FUNCTION.sql first to update the functions

-- Check what data exists in old advances table (for this specific tender)
-- SELECT * FROM advances WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- Delete all data from old advances table for this tender
DELETE FROM advances WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- Optional: Delete all advances table data (if you're sure)
-- DELETE FROM advances;

-- Check if expense_submissions table also has old data
-- SELECT * FROM expense_submissions WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- If needed, clean up expense_submissions too
-- DELETE FROM expense_submissions WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- Verify person_advances table (this should be the correct data)
-- SELECT * FROM person_advances WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';
