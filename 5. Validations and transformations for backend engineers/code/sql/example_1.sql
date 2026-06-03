CREATE TABLE books (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL   -- expects text, refuses an integer
);
