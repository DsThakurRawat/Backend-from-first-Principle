-- ❌ VULNERABLE: fetches invoice 5 regardless of who is asking
SELECT * FROM invoices WHERE id = $1

-- ✅ FIXED: also requires the invoice to belong to the requesting user
SELECT * FROM invoices
WHERE  id = $1
  AND  user_id = $2    -- $2 comes from the verified session/JWT, not user input

-- If no row: return 404 (not 403)
-- Why 404? A 403 CONFIRMS the resource exists → information leak
-- A 404 gives the attacker no information → is it missing, or forbidden?
