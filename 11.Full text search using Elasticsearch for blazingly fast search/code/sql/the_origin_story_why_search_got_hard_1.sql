-- Works great at 5 000 rows
SELECT * FROM products
WHERE  name        ILIKE '%laptop%'
   OR  description ILIKE '%laptop%';
