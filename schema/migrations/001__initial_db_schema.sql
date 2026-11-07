-- MoneyBin: Migration 001 – Initial schema
-- Database: SQLite
-- Apply once to a new, empty database.


-- ============================================================
-- 1. Users and authentication
-- ============================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT,
  pw_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  disabled_at TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
);

CREATE INDEX sessions_user_idx ON sessions ( user_id );
CREATE INDEX sessions_expiry_idx ON sessions ( expires_at );

CREATE TABLE user_preferences (
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL CHECK ( json_valid( value_json ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( user_id, key )
);


-- ============================================================
-- 2. Persons and portfolios
-- ============================================================

CREATE TABLE persons (
  id TEXT PRIMARY KEY NOT NULL,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  name TEXT NOT NULL,
  birth_date TEXT,
  description TEXT,
  data_json TEXT NOT NULL DEFAULT '{}' CHECK ( json_valid( data_json ) ),
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
);

CREATE INDEX persons_created_by_idx ON persons ( created_by );

CREATE TABLE portfolios (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES persons ( id ) ON DELETE RESTRICT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_currency TEXT NOT NULL DEFAULT 'EUR' CHECK ( length( base_currency ) = 3 ),
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( end_date IS NULL OR end_date >= start_date )
);

CREATE INDEX portfolios_person_idx ON portfolios ( person_id );

CREATE TABLE portfolio_members (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK ( role IN ( 'owner', 'editor', 'viewer' ) ),
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, user_id )
);

CREATE INDEX portfolio_members_user_idx ON portfolio_members ( user_id, portfolio_id );
CREATE UNIQUE INDEX portfolio_members_owner_idx ON portfolio_members ( portfolio_id ) WHERE role = 'owner';

-- ============================================================
-- 3. Assets and liabilities
-- ============================================================

CREATE TABLE assets (
  id TEXT PRIMARY KEY NOT NULL,
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  class TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'asset' CHECK ( kind IN ( 'asset', 'liability' ) ),

  currency TEXT NOT NULL DEFAULT 'EUR' CHECK ( length( currency ) = 3 ),

  color TEXT NOT NULL,
  icon TEXT NOT NULL,

  liquidity TEXT NOT NULL DEFAULT 'unknown' CHECK ( liquidity IN (
    'immediate', 'short_term', 'medium_term', 'long_term', 'illiquid', 'unknown'
  ) ),

  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK ( is_active IN ( 0, 1 ) ),

  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK ( json_valid( metadata_json ) ),

  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( end_date IS NULL OR end_date >= start_date )
);

CREATE INDEX assets_portfolio_idx ON assets ( portfolio_id, is_active );
CREATE INDEX assets_class_idx ON assets ( class);
CREATE INDEX assets_kind_idx ON assets ( portfolio_id, kind );
CREATE INDEX assets_start_date_idx ON assets ( start_date );
