-- MoneyBin: Migration 001 – Initial schema
-- Database: SQLite
-- Apply once to a new, empty database.
-- Monetary amounts are stored as integer minor currency units.


-- --- users ---

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  pw_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( length( trim( username ) ) > 0 ),
  CHECK ( length( pw_hash ) > 0 )
);
