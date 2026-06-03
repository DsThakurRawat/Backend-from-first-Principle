EXPLAIN ANALYZE
SELECT p.*, u.name AS author_name
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.published = true
ORDER BY p.created_at DESC
LIMIT 20;

-- Look for "Seq Scan" in the output — that means no index is being used.
-- After adding an index, re-run and confirm it shows "Index Scan".
