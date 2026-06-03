-- instead of: SELECT * FROM projects;  then per row: SELECT * FROM tasks WHERE project_id = ?
SELECT
  p.*,
  COALESCE(jsonb_agg(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id;        -- one round trip, every project with its tasks nested
