CREATE INDEX idx_users_email        ON users (email);              -- WHERE / JOIN on email
CREATE INDEX idx_users_created_at    ON users (created_at DESC);    -- ORDER BY newest first
CREATE INDEX idx_tasks_project_id    ON tasks (project_id);         -- FK join (not auto-indexed)
CREATE INDEX idx_tasks_assigned_to   ON tasks (assigned_to);        -- FK join (not auto-indexed)
CREATE INDEX idx_tasks_status        ON tasks (status);             -- WHERE status = ...
CREATE INDEX idx_tasks_created_at    ON tasks (created_at DESC);    -- ORDER BY newest first
