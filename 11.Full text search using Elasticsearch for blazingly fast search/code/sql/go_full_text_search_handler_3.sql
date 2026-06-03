-- Add a generated tsvector column and index it
ALTER TABLE products
  ADD COLUMN search_vec tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX idx_products_fts ON products USING GIN(search_vec);
