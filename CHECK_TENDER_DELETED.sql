-- Check if tender is actually deleted from database

-- 1. Check tenders table
SELECT 'Tenders' as table_name, COUNT(*) as count 
FROM tenders 
WHERE id = 'ca8de737-1f3f-4d5a-9d6e-4e2783778d03';

-- 2. Check tender_assignments table
SELECT 'Tender Assignments' as table_name, COUNT(*) as count 
FROM tender_assignments 
WHERE tender_id = 'ca8de737-1f3f-4d5a-9d6e-4e2783778d03';

-- 3. List all tenders for your user
SELECT t.id, t.tender_code, t.project_name, t.is_active
FROM tenders t
JOIN tender_assignments ta ON ta.tender_id = t.id
WHERE ta.user_id = 'bce3a381-10af-4eac-b5b7-242d3f351ff2'
ORDER BY t.created_at DESC;

-- If count is 0 for both, tender is deleted successfully
-- If you still see it in dashboard, it's a cache issue
