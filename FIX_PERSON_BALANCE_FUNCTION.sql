-- Fix get_person_balance function to use person_advances and person_expenses

-- Drop existing function first
DROP FUNCTION IF EXISTS get_person_balance(UUID, UUID);

CREATE OR REPLACE FUNCTION get_person_balance(
  p_tender_id UUID,
  p_person_id UUID
)
RETURNS TABLE (balance DECIMAL(12,2)) AS $$
DECLARE
  v_advances DECIMAL(12,2);
  v_expenses DECIMAL(12,2);
BEGIN
  -- Get total advances from person_advances table
  SELECT COALESCE(SUM(amount), 0) INTO v_advances
  FROM person_advances
  WHERE tender_id = p_tender_id
    AND (user_id = p_person_id OR person_id = p_person_id);

  -- Get total expenses from person_expenses table
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM person_expenses
  WHERE tender_id = p_tender_id
    AND (user_id = p_person_id OR person_id = p_person_id);

  -- Balance = advances - expenses (positive means person has money left)
  RETURN QUERY SELECT v_advances - v_expenses;
END;
$$ LANGUAGE plpgsql;

-- Also fix get_person_balances for all people
-- Drop existing function first
DROP FUNCTION IF EXISTS get_person_balances(UUID);

CREATE OR REPLACE FUNCTION get_person_balances(p_tender_id UUID)
RETURNS TABLE (
  person_id UUID,
  person_name TEXT,
  person_type TEXT,
  role user_role,
  total_advances DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  balance DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH person_list AS (
    -- Get all persons assigned to this tender
    SELECT 
      ta.user_id AS id,
      p.full_name AS name,
      'user'::TEXT AS type,
      ta.role
    FROM tender_assignments ta
    JOIN profiles p ON p.id = ta.user_id
    WHERE ta.tender_id = p_tender_id AND ta.user_id IS NOT NULL
    
    UNION ALL
    
    SELECT 
      ta.person_id AS id,
      ps.full_name AS name,
      'person'::TEXT AS type,
      ta.role
    FROM tender_assignments ta
    JOIN persons ps ON ps.id = ta.person_id
    WHERE ta.tender_id = p_tender_id AND ta.person_id IS NOT NULL
  ),
  advance_totals AS (
    -- Calculate advances per person
    SELECT 
      COALESCE(user_id, person_id) AS id,
      SUM(amount) AS total_adv
    FROM person_advances
    WHERE tender_id = p_tender_id
    GROUP BY COALESCE(user_id, person_id)
  ),
  expense_totals AS (
    -- Calculate expenses per person
    SELECT 
      COALESCE(user_id, person_id) AS id,
      SUM(amount) AS total_exp
    FROM person_expenses
    WHERE tender_id = p_tender_id
    GROUP BY COALESCE(user_id, person_id)
  )
  SELECT 
    pl.id,
    pl.name,
    pl.type,
    pl.role,
    COALESCE(adv.total_adv, 0) AS total_advances,
    COALESCE(exp.total_exp, 0) AS total_expenses,
    COALESCE(adv.total_adv, 0) - COALESCE(exp.total_exp, 0) AS balance
  FROM person_list pl
  LEFT JOIN advance_totals adv ON adv.id = pl.id
  LEFT JOIN expense_totals exp ON exp.id = pl.id
  WHERE COALESCE(adv.total_adv, 0) > 0 OR COALESCE(exp.total_exp, 0) > 0
  ORDER BY pl.name;
END;
$$ LANGUAGE plpgsql;

-- Clean up any old advances table data (if exists)
-- WARNING: This will delete old data from advances table
-- DELETE FROM advances WHERE tender_id = 'your-tender-id';
