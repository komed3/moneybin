export type AssetType =
  | 'cash' | 'account' | 'depot' | 'collection' | 'property' | 'lease'
  | 'debt' | 'receivable' | 'contract' | 'investment' | 'insurance'
  | 'vehicle' | 'valuable' | 'right' | 'other';

export type AssetLiquidationLevel =
  | 'instant' | 'very_high' | 'high' | 'medium' | 'low' | 'very_low' | 'illiquid';

export type AssetStatus = 'real' | 'fictional';

export interface AssetRecord {
  id: string;
  portfolioId: string;
  type: AssetType;
  liquidationLevel: AssetLiquidationLevel;
  name: string;
  description: string | null;
  status: AssetStatus;
  archived: boolean;
  icon: string;
  color: string;
  street: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  note: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRow {
  id: string;
  portfolio_id: string;
  type: AssetType;
  liquidation_level: AssetLiquidationLevel;
  name: string;
  description: string | null;
  status: AssetStatus;
  archived: number;
  icon: string;
  color: string;
  street: string | null;
  address_extra: string | null;
  postal_code: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  note: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetCreateData {
  type: AssetType;
  liquidationLevel: AssetLiquidationLevel;
  name: string;
  description?: string | null;
  status: AssetStatus;
  archived?: boolean;
  icon: string;
  color: string;
  street?: string | null;
  addressExtra?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  note?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
}

export type AssetUpdateData = Partial< AssetCreateData >;
