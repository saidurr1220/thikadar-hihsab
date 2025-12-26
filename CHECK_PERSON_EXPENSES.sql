-- Check person expenses data for the tender
-- Replace the tender_id with your actual tender ID

-- 1. Check person_advances for this tender
SELECT 
  pa.id,
  pa.advance_date,
  COALESCE(p.full_name, ps.full_name) as person_name,
  pa.amount,
  pa.purpose
FROM person_advances pa
LEFT JOIN profiles p ON p.id = pa.user_id
LEFT JOIN persons ps ON ps.id = pa.person_id
WHERE pa.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
ORDER BY pa.advance_date DESC;

-- 2. Check person_expenses for this tender
SELECT 
  pe.id,
  pe.expense_date,
  COALESCE(p.full_name, ps.full_name) as person_name,
  pe.amount,
  pe.description
FROM person_expenses pe
LEFT JOIN profiles p ON p.id = pe.user_id
LEFT JOIN persons ps ON ps.id = pe.person_id
WHERE pe.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
ORDER BY pe.expense_date DESC;

-- 3. Check totals per person
SELECT 
  COALESCE(p.full_name, ps.full_name) as person_name,
  COALESCE(SUM(pa.amount), 0) as total_advances,
  COALESCE(SUM(pe.amount), 0) as total_expenses,
  COALESCE(SUM(pa.amount), 0) - COALESCE(SUM(pe.amount), 0) as balance
FROM person_advances pa
FULL OUTER JOIN person_expenses pe ON 
  (pa.user_id = pe.user_id OR pa.person_id = pe.person_id)
  AND pa.tender_id = pe.tender_id
LEFT JOIN profiles p ON p.id = COALESCE(pa.user_id, pe.user_id)
LEFT JOIN persons ps ON ps.id = COALESCE(pa.person_id, pe.person_id)
WHERE pa.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
   OR pe.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
GROUP BY COALESCE(p.full_name, ps.full_name)
ORDER BY person_name;

-- 4. Use the actual get_person_balances function
SELECT * FROM get_person_balances('b7ea3020-5ebc-4601-87bb-16ece04ee68c');

-- 5. If you see wrong data in person_expenses, you can delete it
-- DELETE FROM person_expenses WHERE tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';
