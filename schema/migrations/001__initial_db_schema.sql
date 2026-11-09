-- MoneyBin: Migration 001 – Initial schema
-- Database: SQLite
-- Apply once to a new, empty database.
-- Monetary amounts are stored as integer minor currency units.


-- ============================================================
-- Users and authentication
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
-- Persons and portfolios
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
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK ( role IN ( 'owner', 'editor', 'viewer' ) ),
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, user_id )
);

CREATE INDEX portfolio_members_user_idx ON portfolio_members ( user_id, portfolio_id );
CREATE UNIQUE INDEX portfolio_members_owner_idx ON portfolio_members ( portfolio_id ) WHERE role = 'owner';


-- ============================================================
-- Asset classes
-- ============================================================

CREATE TABLE asset_classes (
  id TEXT PRIMARY KEY NOT NULL
);

INSERT INTO asset_classes ( id ) VALUES
  ( 'cash' ), ( 'account' ), ( 'depot' ), ( 'security' ), ( 'property' ),
  ( 'leasehold' ), ( 'vehicle' ), ( 'valuables' ), ( 'collection' ),
  ( 'loan' ), ( 'participation' ), ( 'equipment' ), ( 'contract' ), ( 'other' );


-- ============================================================
-- Assets and liabilities
-- ============================================================

CREATE TABLE assets (
  id TEXT PRIMARY KEY NOT NULL,
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  class TEXT NOT NULL REFERENCES asset_classes ( id ),
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
CREATE INDEX assets_class_idx ON assets ( portfolio_id, class );
CREATE INDEX assets_kind_idx ON assets ( portfolio_id, kind );
CREATE INDEX assets_start_date_idx ON assets ( start_date );


-- ============================================================
-- Entry types
-- ============================================================

CREATE TABLE entry_types (
  id TEXT PRIMARY KEY NOT NULL
);

INSERT INTO entry_types ( id ) VALUES
  ( 'opening' ), ( 'closing' ), ( 'valuation' ),
  ( 'deposit' ), ( 'withdrawal' ), ( 'payment_in' ), ( 'payment_out' ),
  ( 'purchase' ), ( 'sale' ), ( 'buy' ), ( 'sell' ),
  ( 'transfer_in' ), ( 'transfer_out' ),
  ( 'interest' ), ( 'fee' ), ( 'tax' ), ( 'refund' ),
  ( 'gift_in' ), ( 'gift_out' ), ( 'disbursement' ), ( 'repayment' ),
  ( 'write_off' ), ( 'contribution' ), ( 'distribution' ),
  ( 'acquisition' ), ( 'disposal' ), ( 'other' );


-- ============================================================
-- Transactions
-- ============================================================

CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
);

CREATE INDEX transactions_type_idx ON transactions ( type );


-- ============================================================
-- Asset entries
-- ============================================================

CREATE TABLE asset_entries (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  transaction_id TEXT REFERENCES transactions ( id ) ON DELETE SET NULL,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK ( mode IN ( 'absolute', 'relative' ) ),
  type TEXT NOT NULL REFERENCES entry_types ( id ),
  amount INTEGER NOT NULL,
  amount_min INTEGER,
  amount_max INTEGER,
  effective_date TEXT NOT NULL,
  booking_date TEXT,
  value_date TEXT,
  sequence INTEGER NOT NULL DEFAULT 0 CHECK ( sequence >= 0 ),
  quality TEXT NOT NULL DEFAULT 'documented' CHECK ( quality IN (
    'documented', 'estimated', 'speculative'
  ) ),
  note TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( amount_min IS NULL OR amount_min <= amount ),
  CHECK ( amount_max IS NULL OR amount_max >= amount ),
  CHECK (
    ( mode = 'absolute' AND amount >= 0 ) OR
    ( mode = 'relative' AND amount <> 0 )
  ),

  UNIQUE ( asset_id, effective_date, sequence )
);

-- An asset can have at most one absolute entry per day.
-- Relative entries may coexist with an absolute entry and with
-- other relative entries. Sequence determines their order.

CREATE UNIQUE INDEX asset_entries_absolute_date_idx
  ON asset_entries ( asset_id, effective_date )
  WHERE mode = 'absolute';

CREATE INDEX asset_entries_asset_date_idx ON asset_entries ( asset_id, effective_date, sequence );
CREATE INDEX asset_entries_date_idx ON asset_entries ( effective_date );
CREATE INDEX asset_entries_transaction_idx ON asset_entries ( transaction_id );
CREATE INDEX asset_entries_type_idx ON asset_entries ( type );
CREATE INDEX asset_entries_quality_idx ON asset_entries ( quality );


-- ============================================================
-- Asset conversion factors
-- ============================================================

-- Factors convert an asset's native currency into its portfolio's
-- base currency. They are maintained manually and historically.

CREATE TABLE asset_conversion_factors (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  numerator INTEGER NOT NULL CHECK ( numerator > 0 ),
  denominator INTEGER NOT NULL CHECK ( denominator > 0 ),
  quality TEXT NOT NULL DEFAULT 'documented' CHECK ( quality IN (
    'documented', 'estimated', 'speculative'
  ) ),
  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  UNIQUE ( asset_id, effective_date )
);

CREATE INDEX asset_conversion_factors_lookup_idx ON asset_conversion_factors ( asset_id, effective_date DESC );


-- ============================================================
-- Calculated asset values
-- ============================================================

-- Only dates with actual entries need to be stored.
-- Values between these dates are carried forward when queried.
-- Relative entries without a preceding absolute entry start at zero.

CREATE TABLE asset_value_points (
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  class TEXT NOT NULL REFERENCES asset_classes ( id ),
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  native_value INTEGER NOT NULL,
  native_value_min INTEGER,
  native_value_max INTEGER,
  portfolio_value INTEGER,
  portfolio_value_min INTEGER,
  portfolio_value_max INTEGER,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  conversion_factor_id TEXT REFERENCES asset_conversion_factors ( id ) ON DELETE SET NULL,
  last_entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE SET NULL,
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, effective_date ),

  CHECK ( native_value_min IS NULL OR native_value_min <= native_value ),
  CHECK ( native_value_max IS NULL OR native_value_max >= native_value ),
  CHECK ( portfolio_value_min IS NULL OR portfolio_value IS NOT NULL AND portfolio_value_min <= portfolio_value ),
  CHECK ( portfolio_value_max IS NULL OR portfolio_value IS NOT NULL AND portfolio_value_max >= portfolio_value )
);

CREATE INDEX asset_value_points_date_idx ON asset_value_points ( effective_date );
CREATE INDEX asset_value_points_class_idx ON asset_value_points ( class, kind, effective_date );


-- ============================================================
-- Calculated portfolio values
-- ============================================================

-- Values represent the sum of converted assets and liabilities.
-- If unconverted assets exist, these are known subtotals rather
-- than a complete portfolio valuation.

CREATE TABLE portfolio_value_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  gross_assets INTEGER NOT NULL,
  gross_assets_min INTEGER,
  gross_assets_max INTEGER,
  liabilities INTEGER NOT NULL,
  liabilities_min INTEGER,
  liabilities_max INTEGER,
  net_worth INTEGER NOT NULL,
  net_worth_min INTEGER,
  net_worth_max INTEGER,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, effective_date ),

  CHECK ( net_worth = gross_assets - liabilities ),
  CHECK ( gross_assets_min IS NULL OR gross_assets_min <= gross_assets ),
  CHECK ( gross_assets_max IS NULL OR gross_assets_max >= gross_assets ),
  CHECK ( liabilities_min IS NULL OR liabilities_min <= liabilities ),
  CHECK ( liabilities_max IS NULL OR liabilities_max >= liabilities ),
  CHECK ( net_worth_min IS NULL OR net_worth_min <= net_worth ),
  CHECK ( net_worth_max IS NULL OR net_worth_max >= net_worth ),
  CHECK ( is_complete = 0 OR unconverted_assets = 0 )
);

CREATE INDEX portfolio_value_points_date_idx ON portfolio_value_points ( portfolio_id, effective_date );


-- ============================================================
-- Optional documents and evidence
-- ============================================================

CREATE TABLE documents (
  id TEXT PRIMARY KEY NOT NULL,
  uploaded_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL CHECK ( size_bytes >= 0 ),
  file_hash TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
);

CREATE INDEX documents_hash_idx ON documents ( file_hash );

CREATE TABLE entry_documents (
  entry_id TEXT NOT NULL REFERENCES asset_entries ( id ) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents ( id ) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( entry_id, document_id )
);

CREATE INDEX entry_documents_document_idx ON entry_documents ( document_id );

CREATE TABLE asset_documents (
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents ( id ) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, document_id )
);

CREATE INDEX asset_documents_document_idx ON asset_documents ( document_id );


-- ============================================================
-- Audit log
-- ============================================================

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK ( action IN ( 'insert', 'update', 'delete' ) ),
  before_json TEXT CHECK ( before_json IS NULL OR json_valid( before_json ) ),
  after_json TEXT CHECK ( after_json IS NULL OR json_valid( after_json ) ),
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) )
);

CREATE INDEX audit_log_entity_idx ON audit_log ( entity_type, entity_id, created_at DESC );
CREATE INDEX audit_log_user_idx ON audit_log ( user_id, created_at DESC );
