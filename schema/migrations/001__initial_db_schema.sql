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
  birth_date TEXT CHECK ( birth_date IS NULL OR date( birth_date ) = birth_date ),
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
  base_currency TEXT NOT NULL DEFAULT 'EUR' CHECK ( base_currency GLOB '[A-Z][A-Z][A-Z]' ),
  start_date TEXT NOT NULL CHECK ( date( start_date ) = start_date ),
  end_date TEXT CHECK ( end_date IS NULL OR date( end_date ) = end_date ),
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
  ( 'cash' ), ( 'account' ), ( 'depot' ), ( 'security' ), ( 'property' ), ( 'leasehold' ),
  ( 'vehicle' ), ( 'valuables' ), ( 'collection' ), ( 'loan' ), ( 'participation' ),
  ( 'equipment' ), ( 'contract' ), ( 'other' );


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
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK ( currency GLOB '[A-Z][A-Z][A-Z]' ),
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  liquidity TEXT NOT NULL DEFAULT 'unknown' CHECK ( liquidity IN (
    'immediate', 'short_term', 'medium_term', 'long_term', 'illiquid', 'unknown'
  ) ),
  start_date TEXT NOT NULL CHECK ( date( start_date ) = start_date ),
  end_date TEXT CHECK ( end_date IS NULL OR date( end_date ) = end_date ),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK ( is_active IN ( 0, 1 ) ),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK ( json_valid( metadata_json ) ),
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( end_date IS NULL OR end_date >= start_date ),
  UNIQUE ( id, portfolio_id )
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
  ( 'opening' ), ( 'closing' ), ( 'valuation' ), ( 'adjustment' ), ( 'deposit' ), ( 'withdrawal' ),
  ( 'transfer' ), ( 'debit' ), ( 'standingorder' ), ( 'card' ), ( 'cash' ), ( 'purchase' ), ( 'sale' ),
  ( 'interest' ), ( 'dividend' ), ( 'income' ), ( 'expense' ), ( 'fee' ), ( 'tax' ), ( 'refund' ),
  ( 'gift' ), ( 'contribution' ), ( 'distribution' ), ( 'repayment' ), ( 'writeoff' ), ( 'other' );


-- ============================================================
-- Transaction types
-- ============================================================

CREATE TABLE transaction_types (
  id TEXT PRIMARY KEY NOT NULL
);

INSERT INTO transaction_types ( id ) VALUES
  ( 'transfer' ), ( 'purchase' ), ( 'sale' ), ( 'income' ), ( 'expense' ), ( 'contribution' ),
  ( 'distribution' ), ( 'repayment' ), ( 'other' );


-- ============================================================
-- Transactions
-- Optional grouping and shared information for asset entries.
-- ============================================================

CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other' REFERENCES transaction_types ( id ),
  counterparty TEXT,
  reference TEXT,
  description TEXT,
  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  UNIQUE ( id, portfolio_id )
);

CREATE INDEX transactions_portfolio_idx ON transactions ( portfolio_id, created_at );
CREATE INDEX transactions_type_idx ON transactions ( type );


-- ============================================================
-- Asset entries
-- ============================================================

CREATE TABLE asset_entries (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  transaction_id TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  type TEXT NOT NULL REFERENCES entry_types ( id ),
  mode TEXT NOT NULL DEFAULT 'relative' CHECK ( mode IN ( 'absolute', 'relative' ) ),
  amount INTEGER NOT NULL,
  amount_min INTEGER,
  amount_max INTEGER,
  effective_date TEXT NOT NULL CHECK ( date( effective_date ) = effective_date ),
  booking_date TEXT CHECK ( booking_date IS NULL OR date( booking_date ) = booking_date ),
  value_date TEXT CHECK ( value_date IS NULL OR date( value_date ) = value_date ),
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

  FOREIGN KEY ( transaction_id ) REFERENCES transactions ( id ) ON DELETE SET NULL,

  UNIQUE ( asset_id, effective_date, sequence ),
  UNIQUE ( id, asset_id )
);

CREATE UNIQUE INDEX asset_entries_absolute_date_idx
  ON asset_entries ( asset_id, effective_date )
  WHERE mode = 'absolute';

CREATE INDEX asset_entries_date_idx ON asset_entries ( effective_date );
CREATE INDEX asset_entries_transaction_idx ON asset_entries ( transaction_id );
CREATE INDEX asset_entries_type_idx ON asset_entries ( type );
CREATE INDEX asset_entries_quality_idx ON asset_entries ( quality );


-- ============================================================
-- Asset entry integrity
-- ============================================================

CREATE TRIGGER asset_entries_mode_insert
BEFORE INSERT ON asset_entries
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM asset_entries e
      WHERE e.asset_id = NEW.asset_id
        AND e.effective_date = NEW.effective_date
        AND e.mode <> NEW.mode
    )
    THEN RAISE( ABORT, 'Absolute and relative entries cannot share an asset date' )
  END;
END;

CREATE TRIGGER asset_entries_mode_update
BEFORE UPDATE OF asset_id, effective_date, mode ON asset_entries
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM asset_entries e
      WHERE e.asset_id = NEW.asset_id
        AND e.effective_date = NEW.effective_date
        AND e.id <> OLD.id
        AND e.mode <> NEW.mode
    )
    THEN RAISE( ABORT, 'Absolute and relative entries cannot share an asset date' )
  END;
END;

CREATE TRIGGER asset_entries_transaction_insert
BEFORE INSERT ON asset_entries
WHEN NEW.transaction_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM transactions t
      JOIN assets a ON a.id = NEW.asset_id
      WHERE t.id = NEW.transaction_id
        AND t.portfolio_id = a.portfolio_id
    )
    THEN RAISE( ABORT, 'Transaction and asset must belong to the same portfolio' )
  END;
END;

CREATE TRIGGER asset_entries_transaction_update
BEFORE UPDATE OF transaction_id, asset_id ON asset_entries
WHEN NEW.transaction_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM transactions t
      JOIN assets a ON a.id = NEW.asset_id
      WHERE t.id = NEW.transaction_id
        AND t.portfolio_id = a.portfolio_id
    )
    THEN RAISE( ABORT, 'Transaction and asset must belong to the same portfolio' )
  END;
END;


-- ============================================================
-- Asset conversion factors
-- ============================================================

CREATE TABLE asset_conversion_factors (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL CHECK ( date( effective_date ) = effective_date ),
  numerator INTEGER NOT NULL CHECK ( numerator > 0 ),
  denominator INTEGER NOT NULL CHECK ( denominator > 0 ),
  quality TEXT NOT NULL DEFAULT 'documented' CHECK ( quality IN (
    'documented', 'estimated', 'speculative'
  ) ),
  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  UNIQUE ( asset_id, effective_date ),
  UNIQUE ( id, asset_id )
);


-- ============================================================
-- Calculated asset values
-- ============================================================

CREATE TABLE asset_value_points (
  asset_id TEXT NOT NULL,
  portfolio_id TEXT NOT NULL,
  effective_date TEXT NOT NULL CHECK ( date( effective_date ) = effective_date ),
  class TEXT NOT NULL REFERENCES asset_classes ( id ),
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  native_value INTEGER NOT NULL,
  native_value_min INTEGER,
  native_value_max INTEGER,
  portfolio_value INTEGER,
  portfolio_value_min INTEGER,
  portfolio_value_max INTEGER,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  conversion_factor_id TEXT,
  last_entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE SET NULL,
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, effective_date ),
  FOREIGN KEY ( asset_id, portfolio_id ) REFERENCES assets ( id, portfolio_id ) ON DELETE CASCADE,
  FOREIGN KEY ( conversion_factor_id, asset_id ) REFERENCES asset_conversion_factors ( id, asset_id ),

  CHECK ( native_value_min IS NULL OR native_value_min <= native_value ),
  CHECK ( native_value_max IS NULL OR native_value_max >= native_value ),
  CHECK ( portfolio_value_min IS NULL OR portfolio_value IS NOT NULL AND portfolio_value_min <= portfolio_value ),
  CHECK ( portfolio_value_max IS NULL OR portfolio_value IS NOT NULL AND portfolio_value_max >= portfolio_value ),
  CHECK (
    ( conversion_factor_id IS NULL AND portfolio_value IS NULL ) OR
    ( conversion_factor_id IS NOT NULL AND portfolio_value IS NOT NULL )
  )
);

CREATE INDEX asset_value_points_date_idx ON asset_value_points ( effective_date );
CREATE INDEX asset_value_points_portfolio_idx ON asset_value_points ( portfolio_id, effective_date );
CREATE INDEX asset_value_points_class_idx ON asset_value_points ( portfolio_id, class, kind, effective_date );


CREATE TRIGGER asset_value_points_metadata_insert
BEFORE INSERT ON asset_value_points
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM assets a
      WHERE a.id = NEW.asset_id
        AND a.portfolio_id = NEW.portfolio_id
        AND a.class = NEW.class
        AND a.kind = NEW.kind
    )
    THEN RAISE( ABORT, 'Asset value point metadata does not match its asset' )
  END;

  SELECT CASE
    WHEN NEW.last_entry_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM asset_entries e
      WHERE e.id = NEW.last_entry_id
        AND e.asset_id = NEW.asset_id
        AND e.effective_date <= NEW.effective_date
    )
    THEN RAISE( ABORT, 'Last entry must belong to the asset and be effective' )
  END;

  SELECT CASE
    WHEN NEW.conversion_factor_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM asset_conversion_factors f
      WHERE f.id = NEW.conversion_factor_id
        AND f.asset_id = NEW.asset_id
        AND f.effective_date <= NEW.effective_date
    )
    THEN RAISE( ABORT, 'Conversion factor must belong to the asset and be effective' )
  END;
END;

CREATE TRIGGER asset_value_points_metadata_update
BEFORE UPDATE ON asset_value_points
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM assets a
      WHERE a.id = NEW.asset_id
        AND a.portfolio_id = NEW.portfolio_id
        AND a.class = NEW.class
        AND a.kind = NEW.kind
    )
    THEN RAISE( ABORT, 'Asset value point metadata does not match its asset' )
  END;

  SELECT CASE
    WHEN NEW.last_entry_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM asset_entries e
      WHERE e.id = NEW.last_entry_id
        AND e.asset_id = NEW.asset_id
        AND e.effective_date <= NEW.effective_date
    )
    THEN RAISE( ABORT, 'Last entry must belong to the asset and be effective' )
  END;

  SELECT CASE
    WHEN NEW.conversion_factor_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM asset_conversion_factors f
      WHERE f.id = NEW.conversion_factor_id
        AND f.asset_id = NEW.asset_id
        AND f.effective_date <= NEW.effective_date
    )
    THEN RAISE( ABORT, 'Conversion factor must belong to the asset and be effective' )
  END;
END;


-- ============================================================
-- Calculated asset class values
-- ============================================================

CREATE TABLE asset_class_value_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL CHECK ( date( effective_date ) = effective_date ),
  class TEXT NOT NULL REFERENCES asset_classes ( id ),
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  value INTEGER NOT NULL,
  value_min INTEGER,
  value_max INTEGER,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, effective_date, class, kind ),

  CHECK ( value_min IS NULL OR value_min <= value ),
  CHECK ( value_max IS NULL OR value_max >= value ),
  CHECK ( is_complete = 0 OR unconverted_assets = 0 )
);


-- ============================================================
-- Calculated portfolio values
-- ============================================================

CREATE TABLE portfolio_value_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL CHECK ( date( effective_date ) = effective_date ),
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


-- ============================================================
-- Calculated annual asset values
-- ============================================================

CREATE TABLE asset_year_points (
  asset_id TEXT NOT NULL,
  portfolio_id TEXT NOT NULL,
  class TEXT NOT NULL REFERENCES asset_classes ( id ),
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  year INTEGER NOT NULL CHECK ( year BETWEEN 1 AND 9999 ),
  opening_native_value INTEGER NOT NULL,
  closing_native_value INTEGER NOT NULL,
  opening_portfolio_value INTEGER,
  closing_portfolio_value INTEGER,
  purchase_volume INTEGER NOT NULL DEFAULT 0,
  sale_volume INTEGER NOT NULL DEFAULT 0,
  deposits INTEGER NOT NULL DEFAULT 0,
  withdrawals INTEGER NOT NULL DEFAULT 0,
  distributions INTEGER NOT NULL DEFAULT 0,
  fees INTEGER NOT NULL DEFAULT 0,
  taxes INTEGER NOT NULL DEFAULT 0,
  interest_income INTEGER NOT NULL DEFAULT 0,
  contributions INTEGER NOT NULL DEFAULT 0,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, year ),
  FOREIGN KEY ( asset_id, portfolio_id ) REFERENCES assets ( id, portfolio_id ) ON DELETE CASCADE
);

CREATE INDEX asset_year_points_portfolio_idx ON asset_year_points ( portfolio_id, year );


CREATE TRIGGER asset_year_points_metadata_insert
BEFORE INSERT ON asset_year_points
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM assets a
      WHERE a.id = NEW.asset_id
        AND a.portfolio_id = NEW.portfolio_id
        AND a.class = NEW.class
        AND a.kind = NEW.kind
    )
    THEN RAISE( ABORT, 'Asset year point metadata does not match its asset' )
  END;
END;

CREATE TRIGGER asset_year_points_metadata_update
BEFORE UPDATE ON asset_year_points
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM assets a
      WHERE a.id = NEW.asset_id
        AND a.portfolio_id = NEW.portfolio_id
        AND a.class = NEW.class
        AND a.kind = NEW.kind
    )
    THEN RAISE( ABORT, 'Asset year point metadata does not match its asset' )
  END;
END;


-- ============================================================
-- Calculated annual asset class values
-- ============================================================

CREATE TABLE asset_class_year_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  class TEXT NOT NULL REFERENCES asset_classes ( id ),
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  year INTEGER NOT NULL CHECK ( year BETWEEN 1 AND 9999 ),
  opening_value INTEGER NOT NULL,
  closing_value INTEGER NOT NULL,
  purchase_volume INTEGER NOT NULL DEFAULT 0,
  sale_volume INTEGER NOT NULL DEFAULT 0,
  deposits INTEGER NOT NULL DEFAULT 0,
  withdrawals INTEGER NOT NULL DEFAULT 0,
  distributions INTEGER NOT NULL DEFAULT 0,
  fees INTEGER NOT NULL DEFAULT 0,
  taxes INTEGER NOT NULL DEFAULT 0,
  interest_income INTEGER NOT NULL DEFAULT 0,
  contributions INTEGER NOT NULL DEFAULT 0,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, class, kind, year ),

  CHECK ( is_complete = 0 OR unconverted_assets = 0 )
);

CREATE INDEX asset_class_year_points_portfolio_idx ON asset_class_year_points ( portfolio_id, year );


-- ============================================================
-- Calculated annual portfolio values
-- ============================================================

CREATE TABLE portfolio_year_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK ( year BETWEEN 1 AND 9999 ),
  opening_gross_assets INTEGER NOT NULL,
  closing_gross_assets INTEGER NOT NULL,
  opening_liabilities INTEGER NOT NULL,
  closing_liabilities INTEGER NOT NULL,
  opening_net_worth INTEGER NOT NULL,
  closing_net_worth INTEGER NOT NULL,
  purchase_volume INTEGER NOT NULL DEFAULT 0,
  sale_volume INTEGER NOT NULL DEFAULT 0,
  deposits INTEGER NOT NULL DEFAULT 0,
  withdrawals INTEGER NOT NULL DEFAULT 0,
  distributions INTEGER NOT NULL DEFAULT 0,
  fees INTEGER NOT NULL DEFAULT 0,
  taxes INTEGER NOT NULL DEFAULT 0,
  interest_income INTEGER NOT NULL DEFAULT 0,
  contributions INTEGER NOT NULL DEFAULT 0,
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, year ),

  CHECK ( opening_net_worth = opening_gross_assets - opening_liabilities ),
  CHECK ( closing_net_worth = closing_gross_assets - closing_liabilities ),
  CHECK ( is_complete = 0 OR unconverted_assets = 0 )
);


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

CREATE TABLE document_links (
  document_id TEXT NOT NULL REFERENCES documents ( id ) ON DELETE CASCADE,
  asset_id TEXT REFERENCES assets ( id ) ON DELETE CASCADE,
  entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK (
    ( asset_id IS NOT NULL AND entry_id IS NULL ) OR
    ( asset_id IS NULL AND entry_id IS NOT NULL )
  )
);

CREATE UNIQUE INDEX document_links_asset_unique_idx ON document_links ( document_id, asset_id ) WHERE asset_id IS NOT NULL;
CREATE UNIQUE INDEX document_links_entry_unique_idx ON document_links ( document_id, entry_id ) WHERE entry_id IS NOT NULL;

CREATE INDEX document_links_asset_lookup_idx ON document_links ( asset_id );
CREATE INDEX document_links_entry_lookup_idx ON document_links ( entry_id );


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


-- ============================================================
-- Asset metadata integrity
-- ============================================================

CREATE TRIGGER assets_history_metadata_update
BEFORE UPDATE OF portfolio_id, class, kind, currency, start_date, end_date ON assets
WHEN
  NEW.portfolio_id <> OLD.portfolio_id OR
  NEW.class <> OLD.class OR
  NEW.kind <> OLD.kind OR
  NEW.currency <> OLD.currency OR
  NEW.start_date <> OLD.start_date OR
  NEW.end_date IS NOT OLD.end_date
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM asset_entries e
      WHERE e.asset_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_conversion_factors f
      WHERE f.asset_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_value_points p
      WHERE p.asset_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_year_points p
      WHERE p.asset_id = OLD.id
    )
    THEN RAISE( ABORT, 'Asset historical metadata cannot change after history exists' )
  END;
END;


-- ============================================================
-- Portfolio currency integrity
-- ============================================================

CREATE TRIGGER portfolios_currency_history_update
BEFORE UPDATE OF base_currency ON portfolios
WHEN NEW.base_currency <> OLD.base_currency
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM assets a
      JOIN asset_conversion_factors f ON f.asset_id = a.id
      WHERE a.portfolio_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_value_points p
      WHERE p.portfolio_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_class_value_points p
      WHERE p.portfolio_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM portfolio_value_points p
      WHERE p.portfolio_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_year_points p
      WHERE p.portfolio_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM asset_class_year_points p
      WHERE p.portfolio_id = OLD.id
    )
    OR EXISTS (
      SELECT 1
      FROM portfolio_year_points p
      WHERE p.portfolio_id = OLD.id
    )
    THEN RAISE( ABORT, 'Portfolio currency cannot change after historical values exist' )
  END;
END;


-- ============================================================
-- Conversion factor integrity
-- ============================================================

CREATE TRIGGER asset_conversion_factors_update
BEFORE UPDATE OF asset_id, effective_date, numerator, denominator, quality
ON asset_conversion_factors
WHEN EXISTS (
  SELECT 1
  FROM asset_value_points p
  WHERE p.conversion_factor_id = OLD.id
)
BEGIN
  SELECT RAISE( ABORT, 'Conversion factor cannot change while historical values reference it' );
END;

CREATE TRIGGER asset_conversion_factors_delete
BEFORE DELETE ON asset_conversion_factors
WHEN EXISTS (
  SELECT 1
  FROM asset_value_points p
  WHERE p.conversion_factor_id = OLD.id
)
BEGIN
  SELECT RAISE( ABORT, 'Conversion factor cannot be deleted while historical values reference it' );
END;


-- ============================================================
-- Transaction integrity
-- ============================================================

CREATE TRIGGER transactions_portfolio_update
BEFORE UPDATE OF portfolio_id ON transactions
WHEN NEW.portfolio_id <> OLD.portfolio_id
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM asset_entries e
      WHERE e.transaction_id = OLD.id
    )
    THEN RAISE( ABORT, 'Transaction portfolio cannot change while entries exist' )
  END;
END;
