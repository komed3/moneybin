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
  user_id TEXT NOT NULL REFERENCES users ( id ) ON DELETE RESTRICT,
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
CREATE INDEX assets_class_idx ON assets ( portfolio_id, class );
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
  source_asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  target_asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  booking_date TEXT,
  value_date TEXT,
  source_amount_minor INTEGER NOT NULL CHECK ( source_amount_minor > 0 ),
  source_amount_min_minor INTEGER CHECK ( source_amount_min_minor IS NULL OR source_amount_min_minor > 0 ),
  source_amount_max_minor INTEGER CHECK ( source_amount_max_minor IS NULL OR source_amount_max_minor > 0 ),
  target_amount_minor INTEGER NOT NULL CHECK ( target_amount_minor > 0 ),
  target_amount_min_minor INTEGER CHECK ( target_amount_min_minor IS NULL OR target_amount_min_minor > 0 ),
  target_amount_max_minor INTEGER CHECK ( target_amount_max_minor IS NULL OR target_amount_max_minor > 0 ),
  fee_asset_id TEXT REFERENCES assets ( id ) ON DELETE CASCADE,
  fee_amount_minor INTEGER NOT NULL DEFAULT 0 CHECK ( fee_amount_minor >= 0 ),
  fee_amount_min_minor INTEGER CHECK ( fee_amount_min_minor IS NULL OR fee_amount_min_minor >= 0 ),
  fee_amount_max_minor INTEGER CHECK ( fee_amount_max_minor IS NULL OR fee_amount_max_minor >= 0 ),
  note TEXT,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( source_asset_id <> target_asset_id ),
  CHECK ( source_amount_min_minor IS NULL OR source_amount_min_minor <= source_amount_minor ),
  CHECK ( source_amount_max_minor IS NULL OR source_amount_max_minor >= source_amount_minor ),
  CHECK ( target_amount_min_minor IS NULL OR target_amount_min_minor <= target_amount_minor ),
  CHECK ( target_amount_max_minor IS NULL OR target_amount_max_minor >= target_amount_minor ),
  CHECK ( fee_amount_min_minor IS NULL OR fee_amount_min_minor <= fee_amount_minor ),
  CHECK ( fee_amount_max_minor IS NULL OR fee_amount_max_minor >= fee_amount_minor ),
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
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  transfer_id TEXT REFERENCES transfers ( id ) ON DELETE CASCADE,
  created_by TEXT REFERENCES users ( id ) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK ( entry_type IN ( 'absolute', 'relative' ) ),
  amount_minor INTEGER NOT NULL,
  amount_min_minor INTEGER,
  amount_max_minor INTEGER,
  effective_date TEXT NOT NULL,
  booking_date TEXT,
  value_date TEXT,
  sequence INTEGER NOT NULL DEFAULT 0 CHECK ( sequence >= 0 ),
  entry_kind TEXT NOT NULL CHECK ( entry_kind IN (
    'opening_balance', 'valuation', 'statement_balance',
    'deposit', 'withdrawal', 'transfer_in', 'transfer_out',
    'purchase', 'sale', 'income', 'expense', 'interest', 'dividend',
    'fee', 'tax', 'repayment', 'loan_disbursement', 'loan_repayment',
    'contribution', 'distribution', 'adjustment', 'correction',
    'revaluation', 'other'
  ) ),
  quality TEXT NOT NULL CHECK ( quality IN ( 'documented', 'estimated', 'speculative' ) ),
  note TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),
  updated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  CHECK ( amount_min_minor IS NULL OR amount_min_minor <= amount_minor ),
  CHECK ( amount_max_minor IS NULL OR amount_max_minor >= amount_minor ),
  CHECK (
    ( entry_type = 'absolute' AND amount_minor >= 0 AND sequence = 0
      AND entry_kind IN ( 'opening_balance', 'valuation', 'statement_balance' ) ) OR
    ( entry_type = 'relative' AND amount_minor <> 0
      AND entry_kind NOT IN ( 'opening_balance', 'valuation', 'statement_balance' ) )
  ),
  CHECK (
    ( transfer_id IS NULL AND entry_kind NOT IN ( 'transfer_in', 'transfer_out' ) ) OR
    ( transfer_id IS NOT NULL AND entry_kind IN ( 'transfer_in', 'transfer_out', 'fee' ) )
  ),

  UNIQUE ( asset_id, effective_date, sequence )
);

CREATE UNIQUE INDEX asset_entries_absolute_date_idx ON asset_entries ( asset_id, effective_date ) WHERE entry_type = 'absolute';
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
        AND t.fee_amount_minor > 0
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
        AND t.fee_amount_minor > 0
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
      NEW.fee_asset_id IS NULL OR EXISTS (
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
      NEW.fee_asset_id IS NULL OR EXISTS (
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
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  class TEXT NOT NULL,
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  native_value_minor INTEGER NOT NULL,
  native_value_min_minor INTEGER,
  native_value_max_minor INTEGER,
  portfolio_value_minor INTEGER,
  portfolio_value_min_minor INTEGER,
  portfolio_value_max_minor INTEGER,
  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),
  conversion_factor_id TEXT REFERENCES asset_conversion_factors ( id ) ON DELETE SET NULL,
  last_anchor_entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE SET NULL,
  last_entry_id TEXT REFERENCES asset_entries ( id ) ON DELETE SET NULL,
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, effective_date ),

  CHECK ( native_value_min_minor IS NULL OR native_value_min_minor <= native_value_minor ),
  CHECK ( native_value_max_minor IS NULL OR native_value_max_minor >= native_value_minor ),
  CHECK ( portfolio_value_min_minor IS NULL OR portfolio_value_minor IS NOT NULL AND portfolio_value_min_minor <= portfolio_value_minor ),
  CHECK ( portfolio_value_max_minor IS NULL OR portfolio_value_minor IS NOT NULL AND portfolio_value_max_minor >= portfolio_value_minor )
);

CREATE INDEX asset_value_points_portfolio_date_idx ON asset_value_points ( portfolio_id, effective_date );
CREATE INDEX asset_value_points_filter_idx ON asset_value_points ( portfolio_id, class, kind, effective_date );
CREATE INDEX asset_value_points_asset_date_idx ON asset_value_points ( asset_id, effective_date DESC );


-- ============================================================
-- Calculated asset class values
-- ============================================================

CREATE TABLE asset_class_value_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  class TEXT NOT NULL,
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  effective_date TEXT NOT NULL,
  value_minor INTEGER NOT NULL,
  value_min_minor INTEGER,
  value_max_minor INTEGER,
  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, class, kind, effective_date ),

  CHECK ( value_min_minor IS NULL OR value_min_minor <= value_minor ),
  CHECK ( value_max_minor IS NULL OR value_max_minor >= value_minor )
);

CREATE INDEX asset_class_value_points_date_idx ON asset_class_value_points ( portfolio_id, effective_date );
CREATE INDEX asset_class_value_points_filter_idx ON asset_class_value_points ( portfolio_id, class, kind, effective_date DESC );


-- ============================================================
-- Calculated portfolio values
-- ============================================================

CREATE TABLE portfolio_value_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  gross_assets_minor INTEGER NOT NULL CHECK ( gross_assets_minor >= 0 ),
  gross_assets_min_minor INTEGER,
  gross_assets_max_minor INTEGER,
  liabilities_minor INTEGER NOT NULL CHECK ( liabilities_minor >= 0 ),
  liabilities_min_minor INTEGER,
  liabilities_max_minor INTEGER,
  net_worth_minor INTEGER NOT NULL,
  net_worth_min_minor INTEGER,
  net_worth_max_minor INTEGER,
  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, effective_date ),

  CHECK ( net_worth_minor = gross_assets_minor - liabilities_minor ),
  CHECK ( gross_assets_min_minor IS NULL OR gross_assets_min_minor >= 0 AND gross_assets_min_minor <= gross_assets_minor ),
  CHECK ( gross_assets_max_minor IS NULL OR gross_assets_max_minor >= gross_assets_minor ),
  CHECK ( liabilities_min_minor IS NULL OR liabilities_min_minor >= 0 AND liabilities_min_minor <= liabilities_minor ),
  CHECK ( liabilities_max_minor IS NULL OR liabilities_max_minor >= liabilities_minor ),
  CHECK ( net_worth_min_minor IS NULL OR net_worth_min_minor <= net_worth_minor ),
  CHECK ( net_worth_max_minor IS NULL OR net_worth_max_minor >= net_worth_minor ),
  CHECK (
    ( is_complete = 1 AND unconverted_assets = 0 ) OR
    ( is_complete = 0 AND unconverted_assets > 0 )
  )
);

CREATE INDEX portfolio_value_points_date_idx ON portfolio_value_points ( portfolio_id, effective_date );


-- ============================================================
-- Calculated yearly asset values
-- ============================================================

CREATE TABLE asset_year_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets ( id ) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK ( year BETWEEN 1 AND 9999 ),
  class TEXT NOT NULL,
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  opening_value_minor INTEGER NOT NULL,
  opening_value_min_minor INTEGER,
  opening_value_max_minor INTEGER,
  closing_value_minor INTEGER NOT NULL,
  closing_value_min_minor INTEGER,
  closing_value_max_minor INTEGER,
  change_minor INTEGER NOT NULL,
  change_min_minor INTEGER,
  change_max_minor INTEGER,
  change_basis_points INTEGER,
  share_basis_points INTEGER,
  share_min_basis_points INTEGER,
  share_max_basis_points INTEGER,
  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( asset_id, year ),

  CHECK ( change_minor = closing_value_minor - opening_value_minor ),
  CHECK ( opening_value_min_minor IS NULL OR opening_value_min_minor <= opening_value_minor ),
  CHECK ( opening_value_max_minor IS NULL OR opening_value_max_minor >= opening_value_minor ),
  CHECK ( closing_value_min_minor IS NULL OR closing_value_min_minor <= closing_value_minor ),
  CHECK ( closing_value_max_minor IS NULL OR closing_value_max_minor >= closing_value_minor ),
  CHECK ( change_min_minor IS NULL OR change_min_minor <= change_minor ),
  CHECK ( change_max_minor IS NULL OR change_max_minor >= change_minor ),
  CHECK ( share_min_basis_points IS NULL OR share_min_basis_points <= share_basis_points ),
  CHECK ( share_max_basis_points IS NULL OR share_max_basis_points >= share_basis_points )
);

CREATE INDEX asset_year_points_portfolio_year_idx ON asset_year_points ( portfolio_id, year );
CREATE INDEX asset_year_points_filter_idx ON asset_year_points ( portfolio_id, class, kind, year );


-- ============================================================
-- Calculated yearly asset class values
-- ============================================================

CREATE TABLE asset_class_year_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  class TEXT NOT NULL,
  kind TEXT NOT NULL CHECK ( kind IN ( 'asset', 'liability' ) ),
  year INTEGER NOT NULL CHECK ( year BETWEEN 1 AND 9999 ),
  opening_value_minor INTEGER NOT NULL,
  opening_value_min_minor INTEGER,
  opening_value_max_minor INTEGER,
  closing_value_minor INTEGER NOT NULL,
  closing_value_min_minor INTEGER,
  closing_value_max_minor INTEGER,
  change_minor INTEGER NOT NULL,
  change_min_minor INTEGER,
  change_max_minor INTEGER,
  change_basis_points INTEGER,
  share_basis_points INTEGER,
  share_min_basis_points INTEGER,
  share_max_basis_points INTEGER,
  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, class, kind, year ),

  CHECK ( change_minor = closing_value_minor - opening_value_minor ),
  CHECK ( opening_value_min_minor IS NULL OR opening_value_min_minor <= opening_value_minor ),
  CHECK ( opening_value_max_minor IS NULL OR opening_value_max_minor >= opening_value_minor ),
  CHECK ( closing_value_min_minor IS NULL OR closing_value_min_minor <= closing_value_minor ),
  CHECK ( closing_value_max_minor IS NULL OR closing_value_max_minor >= closing_value_minor ),
  CHECK ( change_min_minor IS NULL OR change_min_minor <= change_minor ),
  CHECK ( change_max_minor IS NULL OR change_max_minor >= change_minor ),
  CHECK ( share_min_basis_points IS NULL OR share_min_basis_points <= share_basis_points ),
  CHECK ( share_max_basis_points IS NULL OR share_max_basis_points >= share_basis_points )
);

CREATE INDEX asset_class_year_points_year_idx ON asset_class_year_points ( portfolio_id, year );
CREATE INDEX asset_class_year_points_filter_idx ON asset_class_year_points ( portfolio_id, class, kind, year );


-- ============================================================
-- Calculated yearly portfolio values
-- ============================================================

CREATE TABLE portfolio_year_points (
  portfolio_id TEXT NOT NULL REFERENCES portfolios ( id ) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK ( year BETWEEN 1 AND 9999 ),
  opening_gross_assets_minor INTEGER NOT NULL CHECK ( opening_gross_assets_minor >= 0 ),
  opening_gross_assets_min_minor INTEGER,
  opening_gross_assets_max_minor INTEGER,
  closing_gross_assets_minor INTEGER NOT NULL CHECK ( closing_gross_assets_minor >= 0 ),
  closing_gross_assets_min_minor INTEGER,
  closing_gross_assets_max_minor INTEGER,
  opening_liabilities_minor INTEGER NOT NULL CHECK ( opening_liabilities_minor >= 0 ),
  opening_liabilities_min_minor INTEGER,
  opening_liabilities_max_minor INTEGER,
  closing_liabilities_minor INTEGER NOT NULL CHECK ( closing_liabilities_minor >= 0 ),
  closing_liabilities_min_minor INTEGER,
  closing_liabilities_max_minor INTEGER,
  opening_net_worth_minor INTEGER NOT NULL,
  opening_net_worth_min_minor INTEGER,
  opening_net_worth_max_minor INTEGER,
  closing_net_worth_minor INTEGER NOT NULL,
  closing_net_worth_min_minor INTEGER,
  closing_net_worth_max_minor INTEGER,
  change_minor INTEGER NOT NULL,
  change_min_minor INTEGER,
  change_max_minor INTEGER,
  change_basis_points INTEGER,
  quality TEXT CHECK ( quality IS NULL OR quality IN ( 'documented', 'estimated', 'speculative' ) ),
  unconverted_assets INTEGER NOT NULL DEFAULT 0 CHECK ( unconverted_assets >= 0 ),
  is_complete INTEGER NOT NULL DEFAULT 1 CHECK ( is_complete IN ( 0, 1 ) ),
  calculation_version INTEGER NOT NULL DEFAULT 1 CHECK ( calculation_version > 0 ),
  calculated_at TEXT NOT NULL DEFAULT ( strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' ) ),

  PRIMARY KEY ( portfolio_id, year ),

  CHECK ( opening_net_worth_minor = opening_gross_assets_minor - opening_liabilities_minor ),
  CHECK ( closing_net_worth_minor = closing_gross_assets_minor - closing_liabilities_minor ),
  CHECK ( change_minor = closing_net_worth_minor - opening_net_worth_minor ),
  CHECK ( opening_gross_assets_min_minor IS NULL OR opening_gross_assets_min_minor <= opening_gross_assets_minor ),
  CHECK ( opening_gross_assets_max_minor IS NULL OR opening_gross_assets_max_minor >= opening_gross_assets_minor ),
  CHECK ( closing_gross_assets_min_minor IS NULL OR closing_gross_assets_min_minor <= closing_gross_assets_minor ),
  CHECK ( closing_gross_assets_max_minor IS NULL OR closing_gross_assets_max_minor >= closing_gross_assets_minor ),
  CHECK ( opening_liabilities_min_minor IS NULL OR opening_liabilities_min_minor <= opening_liabilities_minor ),
  CHECK ( opening_liabilities_max_minor IS NULL OR opening_liabilities_max_minor >= opening_liabilities_minor ),
  CHECK ( closing_liabilities_min_minor IS NULL OR closing_liabilities_min_minor <= closing_liabilities_minor ),
  CHECK ( closing_liabilities_max_minor IS NULL OR closing_liabilities_max_minor >= closing_liabilities_minor ),
  CHECK ( opening_net_worth_min_minor IS NULL OR opening_net_worth_min_minor <= opening_net_worth_minor ),
  CHECK ( opening_net_worth_max_minor IS NULL OR opening_net_worth_max_minor >= opening_net_worth_minor ),
  CHECK ( closing_net_worth_min_minor IS NULL OR closing_net_worth_min_minor <= closing_net_worth_minor ),
  CHECK ( closing_net_worth_max_minor IS NULL OR closing_net_worth_max_minor >= closing_net_worth_minor ),
  CHECK ( change_min_minor IS NULL OR change_min_minor <= change_minor ),
  CHECK ( change_max_minor IS NULL OR change_max_minor >= change_minor ),
  CHECK (
    ( is_complete = 1 AND unconverted_assets = 0 ) OR
    ( is_complete = 0 AND unconverted_assets > 0 )
  )
);

CREATE INDEX portfolio_year_points_year_idx ON portfolio_year_points ( portfolio_id, year );


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
