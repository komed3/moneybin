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


-- --- currencies ---

CREATE TABLE currencies (
  code TEXT PRIMARY KEY NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER NOT NULL,

  CHECK ( length( code ) = 3 ),
  CHECK ( code = upper( code ) ),
  CHECK ( decimal_places BETWEEN 0 AND 3 )
);

INSERT INTO currencies ( code, symbol, decimal_places ) VALUES
  ( 'EUR', '€', 2 ), ( 'USD', '$', 2 ), ( 'GBP', '£', 2 ), ( 'CHF', 'CHF', 2 ),
  ( 'RUB', '₽', 2 ), ( 'JPY', '¥', 0 ), ( 'CNY', '¥', 2 ), ( 'CAD', '$', 2 ),
  ( 'AUD', '$', 2 ), ( 'SEK', 'kr', 2 ), ( 'PLN', 'zł', 2 );


-- --- persons ---

CREATE TABLE persons (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
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
  currency TEXT NOT NULL REFERENCES currencies ( code ) ON DELETE RESTRICT,
  note TEXT,
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
  note TEXT,
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


-- --- booking types ---

CREATE TABLE booking_types (
  id TEXT PRIMARY KEY NOT NULL
);

INSERT INTO booking_types ( id ) VALUES
  ( 'deposit' ), ( 'withdrawal' ), ( 'transfer' ), ( 'direct_debit' ), ( 'purchase' ),
  ( 'sale' ), ( 'fee' ), ( 'interest' ), ( 'dividend' ), ( 'tax' ), ( 'repayment' ),
  ( 'adjustment' ), ( 'other' );


-- --- transactions ---

CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
);


-- --- bookings ---

CREATE TABLE bookings (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE RESTRICT,
  transaction_id TEXT REFERENCES transactions ( id ) ON DELETE SET NULL,
  type TEXT NOT NULL REFERENCES booking_types ( id ) ON DELETE RESTRICT,
  value_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  min_amount INTEGER,
  max_amount INTEGER,
  booking_date TEXT NOT NULL,
  value_date TEXT NOT NULL,
  reliability TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( value_type IN ( 'relative', 'absolute' ) ),
  CHECK ( min_amount IS NULL OR min_amount <= amount ),
  CHECK ( max_amount IS NULL OR max_amount >= amount ),
  CHECK ( min_amount IS NULL OR max_amount IS NULL OR min_amount <= max_amount ),
  CHECK ( reliability IN ( 'documented', 'reconstructed', 'speculative', 'assumed' ) )
);

CREATE UNIQUE INDEX bookings_asset_absolute_idx
  ON bookings ( asset_id, value_date )
  WHERE value_type = 'absolute';

CREATE INDEX bookings_asset_idx ON bookings ( asset_id );
CREATE INDEX bookings_transaction_idx ON bookings ( transaction_id );
CREATE INDEX bookings_booking_date_idx ON bookings ( booking_date );
CREATE INDEX bookings_value_date_idx ON bookings ( value_date );
CREATE INDEX bookings_type_idx ON bookings ( type );


-- --- asset daily values ---

CREATE TABLE asset_daily_values (
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  value_date TEXT NOT NULL,
  quality REAL NOT NULL,

  open INTEGER,
  high INTEGER NOT NULL,
  low INTEGER NOT NULL,
  close INTEGER NOT NULL,
  change INTEGER,
  change_percent REAL,

  PRIMARY KEY ( asset_id, value_date ),

  CHECK ( quality BETWEEN 0.0 AND 1.0 ),
  CHECK ( high >= close ),
  CHECK ( low <= close ),
  CHECK ( open IS NULL OR high >= open ),
  CHECK ( open IS NULL OR low <= open )
);

CREATE INDEX asset_daily_values_date_idx ON asset_daily_values ( value_date );


-- --- asset yearly stats ---

CREATE TABLE asset_yearly_stats (
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quality REAL NOT NULL,

  open INTEGER,
  high INTEGER NOT NULL,
  low INTEGER NOT NULL,
  close INTEGER NOT NULL,
  change INTEGER,
  change_percent REAL,

  average_value REAL NOT NULL,
  volatility REAL,
  max_drawdown INTEGER NOT NULL,
  max_drawdown_percent REAL NOT NULL,

  booking_count INTEGER NOT NULL,
  positive_change INTEGER NOT NULL,
  negative_change INTEGER NOT NULL,
  average_change REAL,
  best_day INTEGER,
  worst_day INTEGER,
  best_day_percent REAL,
  worst_day_percent REAL,

  PRIMARY KEY ( asset_id, year ),

  CHECK ( year BETWEEN 1 AND 9999 ),
  CHECK ( quality BETWEEN 0.0 AND 1.0 ),
  CHECK ( high >= close ),
  CHECK ( low <= close ),
  CHECK ( open IS NULL OR high >= open ),
  CHECK ( open IS NULL OR low <= open ),
  CHECK ( volatility IS NULL OR volatility >= 0 ),
  CHECK ( max_drawdown >= 0 ),
  CHECK ( max_drawdown_percent >= 0 ),
  CHECK ( booking_count >= 0 ),
  CHECK ( positive_change >= 0 ),
  CHECK ( negative_change <= 0 ),
  CHECK ( best_day IS NULL OR worst_day IS NULL OR worst_day <= best_day ),
  CHECK ( best_day_percent IS NULL OR worst_day_percent IS NULL OR worst_day_percent <= best_day_percent )
);

CREATE INDEX asset_yearly_stats_year_idx ON asset_yearly_stats ( year );


-- --- portfolio yearly stats ---

CREATE TABLE portfolio_yearly_stats (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quality REAL NOT NULL,

  open INTEGER,
  high INTEGER NOT NULL,
  low INTEGER NOT NULL,
  close INTEGER NOT NULL,
  change INTEGER,
  change_percent REAL,

  average_value REAL NOT NULL,
  volatility REAL,
  max_drawdown INTEGER NOT NULL,
  max_drawdown_percent REAL NOT NULL,

  asset_count INTEGER NOT NULL,
  active_asset_count INTEGER NOT NULL,
  booking_count INTEGER NOT NULL,
  positive_change INTEGER NOT NULL,
  negative_change INTEGER NOT NULL,
  average_change REAL,
  best_day INTEGER,
  worst_day INTEGER,
  best_day_percent REAL,
  worst_day_percent REAL,

  PRIMARY KEY ( portfolio_id, year ),

  CHECK ( year BETWEEN 1 AND 9999 ),
  CHECK ( quality BETWEEN 0.0 AND 1.0 ),
  CHECK ( high >= close ),
  CHECK ( low <= close ),
  CHECK ( open IS NULL OR high >= open ),
  CHECK ( open IS NULL OR low <= open ),
  CHECK ( volatility IS NULL OR volatility >= 0 ),
  CHECK ( max_drawdown >= 0 ),
  CHECK ( max_drawdown_percent >= 0 ),
  CHECK ( asset_count >= 0 ),
  CHECK ( active_asset_count >= 0 ),
  CHECK ( active_asset_count <= asset_count ),
  CHECK ( booking_count >= 0 ),
  CHECK ( positive_change >= 0 ),
  CHECK ( negative_change <= 0 ),
  CHECK ( best_day IS NULL OR worst_day IS NULL OR worst_day <= best_day ),
  CHECK ( best_day_percent IS NULL OR worst_day_percent IS NULL OR worst_day_percent <= best_day_percent )
);

CREATE INDEX portfolio_yearly_stats_year_idx ON portfolio_yearly_stats ( year );
