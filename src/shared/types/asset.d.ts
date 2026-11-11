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
