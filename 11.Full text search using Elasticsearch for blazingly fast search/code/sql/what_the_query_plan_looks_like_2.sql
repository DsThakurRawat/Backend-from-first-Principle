EXPLAIN ANALYZE
SELECT id, name
FROM  products
WHERE name ILIKE '%laptop%';

-- Output (simplified)
-- Seq Scan on products  (cost=0.00..18450.00 rows=5 width=36)
--   Filter: ((name)::text ~~* '%laptop%'::text)
--   Rows Removed by Filter: 4 999 995
-- Planning Time: 0.2 ms
-- Execution Time: 28 940.7 ms   ← 29 seconds!
