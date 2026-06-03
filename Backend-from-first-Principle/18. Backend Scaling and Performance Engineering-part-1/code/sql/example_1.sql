-- Basic single-column index
CREATE INDEX idx_posts_author_id ON posts (author_id);

-- Composite index: order matters!
-- This helps queries filtering by user_id, or user_id + created_at
-- It does NOT help queries filtering ONLY by created_at
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);

-- Covering index: all needed data lives IN the index
-- The query never touches the main table at all
CREATE INDEX idx_departments_name ON departments (name) INCLUDE (id);
