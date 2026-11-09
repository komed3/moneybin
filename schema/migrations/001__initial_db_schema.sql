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


-- --- persons ---

CREATE TABLE persons (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT,
  street TEXT,
  address_extra TEXT,
  postal_code TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( length( trim( name ) ) > 0 ),
  CHECK ( gender IN ( 'male', 'female', 'diverse' ) )
);

CREATE INDEX persons_user_idx ON persons ( user_id );


-- --- portfolios ---

CREATE TABLE portfolios (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES persons ( id ) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( length( trim( name ) ) > 0 )
);

CREATE INDEX portfolios_person_idx ON portfolios ( person_id );


-- --- portfolio members ---

CREATE TABLE portfolio_members (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE RESTRICT,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, user_id ),
  CHECK ( role IN ( 'owner', 'editor', 'viewer' ) )
);

CREATE INDEX portfolio_members_user_idx ON portfolio_members ( user_id );


-- --- asset types ---

CREATE TABLE asset_types (
  id TEXT PRIMARY KEY NOT NULL
);

INSERT INTO asset_types ( id ) VALUES
  ( 'cash' ), ( 'account' ), ( 'depot' ), ( 'collection' ), ( 'property' ), ( 'lease' ),
  ( 'debt' ), ( 'receivable' ), ( 'contract' ), ( 'investment' ), ( 'insurance' ),
  ( 'vehicle' ), ( 'valuable' ), ( 'right' ), ( 'other' );


-- --- liquidation levels ---

CREATE TABLE liquidation_levels (
  id TEXT PRIMARY KEY NOT NULL
);

INSERT INTO liquidation_levels ( id ) VALUES
  ( 'instant' ), ( 'very_high' ), ( 'high' ), ( 'medium' ), ( 'low' ),
  ( 'very_low' ), ( 'illiquid' );


-- --- assets ---

CREATE TABLE assets (
  id TEXT PRIMARY KEY NOT NULL,
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE RESTRICT,
  type TEXT NOT NULL REFERENCES asset_types ( id ) ON DELETE RESTRICT,
  liquidation_level TEXT NOT NULL REFERENCES liquidation_levels ( id ) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  street TEXT,
  address_extra TEXT,
  postal_code TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  opened_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( length( trim( name ) ) > 0 ),
  CHECK ( status IN ( 'real', 'fictional' ) ),
  CHECK ( archived IN ( 0, 1 ) )
);

CREATE INDEX assets_portfolio_idx ON assets ( portfolio_id );
CREATE INDEX assets_type_idx ON assets ( type );
CREATE INDEX assets_liquidation_level_idx ON assets ( liquidation_level );
