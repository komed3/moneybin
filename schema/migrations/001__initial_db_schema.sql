-- MoneyBin: Migration 001 – Initial schema
-- Database: SQLite
-- Apply once to a new, empty database.


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
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK ( role IN ( 'owner', 'editor', 'viewer' ) ),
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, user_id )
);

CREATE INDEX portfolio_members_user_idx ON portfolio_members ( user_id, portfolio_id );
CREATE UNIQUE INDEX portfolio_members_owner_idx ON portfolio_members ( portfolio_id ) WHERE role = 'owner';


-- ============================================================
-- Assets and liabilities
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


-- ============================================================
-- Asset conversion factors
-- ============================================================

CREATE TABLE asset_conversion_factors (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,

  effective_date TEXT NOT NULL,

  numerator INTEGER NOT NULL CHECK ( numerator > 0 ),
  denominator INTEGER NOT NULL CHECK ( denominator > 0 ),

  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),

  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  UNIQUE ( asset_id, effective_date )
);

CREATE INDEX asset_conversion_factors_lookup_idx ON asset_conversion_factors ( asset_id, effective_date DESC );


-- ============================================================
-- Transfers
-- ============================================================

CREATE TABLE transfers (
  id TEXT PRIMARY KEY NOT NULL,
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,

  source_asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE RESTRICT,
  target_asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE RESTRICT,

  effective_date TEXT NOT NULL,
  booking_date TEXT,
  value_date TEXT,

  source_amount_minor INTEGER NOT NULL CHECK ( source_amount_minor > 0 ),
  target_amount_minor INTEGER NOT NULL CHECK ( target_amount_minor > 0 ),

  fee_asset_id TEXT REFERENCES assets ( id ) ON DELETE RESTRICT,
  fee_amount_minor INTEGER NOT NULL DEFAULT 0 CHECK ( fee_amount_minor >= 0 ),

  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),

  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( source_asset_id <> target_asset_id ),
  CHECK (
    ( fee_amount_minor = 0 AND fee_asset_id IS NULL ) OR
    ( fee_amount_minor > 0 AND fee_asset_id IN ( source_asset_id, target_asset_id ) )
  )
);

CREATE INDEX transfers_portfolio_date_idx ON transfers ( portfolio_id, effective_date );
CREATE INDEX transfers_source_idx ON transfers ( source_asset_id, effective_date );
CREATE INDEX transfers_target_idx ON transfers ( target_asset_id, effective_date );


-- ============================================================
-- Asset entries
-- ============================================================

CREATE TABLE asset_entries (
  id TEXT PRIMARY KEY NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE RESTRICT,
  transfer_id TEXT REFERENCES transfers ( id ) ON DELETE CASCADE,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,

  entry_type TEXT NOT NULL CHECK ( entry_type IN ( 'absolute', 'relative' ) ),

  amount_minor INTEGER NOT NULL,

  effective_date TEXT NOT NULL,
  booking_date TEXT,
  value_date TEXT,

  sequence INTEGER NOT NULL DEFAULT 0 CHECK ( sequence >= 0 ),

  entry_kind TEXT NOT NULL CHECK ( entry_kind IN (
    'opening_balance', 'valuation', 'statement_balance', 'deposit', 'withdrawal',
    'transfer_in', 'transfer_out', 'interest', 'dividend', 'fee', 'purchase', 'sale',
    'repayment', 'adjustment', 'other'
  ) ),

  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),

  note TEXT,
  source TEXT,

  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK (
    ( entry_type = 'absolute' AND amount_minor >= 0 AND sequence = 0 ) OR
    ( entry_type = 'relative' AND amount_minor <> 0 )
  ),

  CHECK (
    ( transfer_id IS NULL AND entry_kind NOT IN ( 'transfer_in', 'transfer_out' ) ) OR
    ( transfer_id IS NOT NULL AND entry_kind IN ( 'transfer_in', 'transfer_out', 'fee' ) )
  ),

  UNIQUE ( asset_id, effective_date, sequence )
);

CREATE UNIQUE INDEX asset_entries_absolute_date_idx ON asset_entries ( asset_id, effective_date )
  WHERE entry_type = 'absolute';

CREATE INDEX asset_entries_asset_date_idx ON asset_entries ( asset_id, effective_date, sequence );
CREATE INDEX asset_entries_date_idx ON asset_entries ( effective_date );
CREATE INDEX asset_entries_transfer_idx ON asset_entries ( transfer_id );
CREATE INDEX asset_entries_kind_idx ON asset_entries ( entry_kind );
CREATE INDEX asset_entries_quality_idx ON asset_entries ( quality );


-- ============================================================
-- Entry consistency
-- ============================================================

-- Absolute and relative entries may not coexist on one asset
-- and effective date. Multiple relative entries are allowed.

CREATE TRIGGER asset_entries_date_type_insert
BEFORE INSERT ON asset_entries
WHEN EXISTS (
  SELECT 1
  FROM asset_entries
  WHERE asset_id = NEW.asset_id
    AND effective_date = NEW.effective_date
    AND entry_type <> NEW.entry_type
)
BEGIN
  SELECT RAISE( ABORT, 'Absolute and relative entries cannot coexist on the same asset and date.' );
END;

CREATE TRIGGER asset_entries_date_type_update
BEFORE UPDATE OF asset_id, effective_date, entry_type ON asset_entries
WHEN EXISTS (
  SELECT 1
  FROM asset_entries
  WHERE asset_id = NEW.asset_id
    AND effective_date = NEW.effective_date
    AND entry_type <> NEW.entry_type
    AND id <> NEW.id
)
BEGIN
  SELECT RAISE( ABORT, 'Absolute and relative entries cannot coexist on the same asset and date.' );
END;


-- Validate transfer entries against their transfer record.

CREATE TRIGGER asset_entries_transfer_insert
BEFORE INSERT ON asset_entries
WHEN NEW.transfer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM transfers t
    WHERE t.id = NEW.transfer_id
      AND NEW.entry_type = 'relative'
      AND NEW.effective_date = t.effective_date
      AND ( (
        NEW.asset_id = t.source_asset_id
        AND NEW.entry_kind = 'transfer_out'
        AND NEW.amount_minor = -t.source_amount_minor
      ) OR (
        NEW.asset_id = t.target_asset_id
        AND NEW.entry_kind = 'transfer_in'
        AND NEW.amount_minor = t.target_amount_minor
      ) OR (
        NEW.asset_id = t.fee_asset_id
        AND NEW.entry_kind = 'fee'
        AND NEW.amount_minor = -t.fee_amount_minor
      ) )
  )
BEGIN
  SELECT RAISE( ABORT, 'Invalid asset entry for transfer.' );
END;

CREATE TRIGGER asset_entries_transfer_update
BEFORE UPDATE OF asset_id, transfer_id, entry_type, effective_date, entry_kind, amount_minor ON asset_entries
WHEN NEW.transfer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM transfers t
    WHERE t.id = NEW.transfer_id
      AND NEW.entry_type = 'relative'
      AND NEW.effective_date = t.effective_date
      AND ( (
        NEW.asset_id = t.source_asset_id
        AND NEW.entry_kind = 'transfer_out'
        AND NEW.amount_minor = -t.source_amount_minor
      ) OR (
        NEW.asset_id = t.target_asset_id
        AND NEW.entry_kind = 'transfer_in'
        AND NEW.amount_minor = t.target_amount_minor
      ) OR (
        NEW.asset_id = t.fee_asset_id
        AND NEW.entry_kind = 'fee'
        AND NEW.amount_minor = -t.fee_amount_minor
      ) )
  )
BEGIN
  SELECT RAISE( ABORT, 'Invalid asset entry for transfer.' );
END;


-- Transfers may only connect assets of the same portfolio.
-- Liabilities are not transfer endpoints; debt payments are
-- recorded as ordinary relative entries.

CREATE TRIGGER transfers_portfolio_insert
BEFORE INSERT ON transfers
WHEN NOT EXISTS (
  SELECT 1
  FROM assets source
  JOIN assets target ON target.id = NEW.target_asset_id
  WHERE source.id = NEW.source_asset_id
    AND source.portfolio_id = NEW.portfolio_id
    AND target.portfolio_id = NEW.portfolio_id
    AND source.kind = 'asset'
    AND target.kind = 'asset'
    AND (
      NEW.fee_asset_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM assets fee
        WHERE fee.id = NEW.fee_asset_id
          AND fee.portfolio_id = NEW.portfolio_id
          AND fee.kind = 'asset'
      )
    )
)
BEGIN
  SELECT RAISE( ABORT, 'Transfer assets must belong to the same portfolio and be assets.' );
END;

CREATE TRIGGER transfers_portfolio_update
BEFORE UPDATE OF portfolio_id, source_asset_id, target_asset_id, fee_asset_id ON transfers
WHEN NOT EXISTS (
  SELECT 1
  FROM assets source
  JOIN assets target ON target.id = NEW.target_asset_id
  WHERE source.id = NEW.source_asset_id
    AND source.portfolio_id = NEW.portfolio_id
    AND target.portfolio_id = NEW.portfolio_id
    AND source.kind = 'asset'
    AND target.kind = 'asset'
    AND (
      NEW.fee_asset_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM assets fee
        WHERE fee.id = NEW.fee_asset_id
          AND fee.portfolio_id = NEW.portfolio_id
          AND fee.kind = 'asset'
      )
    )
)
BEGIN
  SELECT RAISE( ABORT, 'Transfer assets must belong to the same portfolio and be assets.' );
END;


-- ============================================================
-- Calculated asset values
-- ============================================================

CREATE TABLE asset_value_points (
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,

  native_value_minor INTEGER NOT NULL,
  portfolio_value_minor INTEGER,

  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),

  conversion_factor_id TEXT REFERENCES asset_conversion_factors ( id ) ON DELETE SET NULL,
  last_anchor_entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE SET NULL,
  last_entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE SET NULL,

  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, effective_date )
);

CREATE INDEX asset_value_points_date_idx ON asset_value_points ( effective_date );
CREATE INDEX asset_value_points_asset_date_idx ON asset_value_points ( asset_id, effective_date DESC );


-- ============================================================
-- Calculated portfolio values
-- ============================================================

CREATE TABLE portfolio_value_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,

  gross_assets_minor INTEGER NOT NULL,
  liabilities_minor INTEGER NOT NULL,
  net_worth_minor INTEGER NOT NULL,

  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),

  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),

  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, effective_date ),

  CHECK ( net_worth_minor = gross_assets_minor - liabilities_minor )
);

CREATE INDEX portfolio_value_points_date_idx ON portfolio_value_points ( effective_date );


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
