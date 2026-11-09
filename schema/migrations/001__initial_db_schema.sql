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


-- --- sessions ---

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  expires_at TEXT NOT NULL,

  CHECK ( expires_at > created_at )
);

CREATE INDEX sessions_user_idx ON sessions ( user_id );
CREATE INDEX sessions_expires_idx ON sessions ( expires_at );


-- --- user preferences ---

CREATE TABLE user_preferences (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,

  UNIQUE ( user_id, key )
);
