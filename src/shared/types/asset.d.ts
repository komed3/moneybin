export type AssetType =
  | 'cash' | 'account' | 'depot' | 'collection' | 'property' | 'lease'
  | 'debt' | 'receivable' | 'contract' | 'investment' | 'insurance'
  | 'vehicle' | 'valuable' | 'right' | 'other';

export type AssetLiquidationLevel =
  | 'instant' | 'very_high' | 'high' | 'medium' | 'low' | 'very_low' | 'illiquid';

export type AssetStatus = 'real' | 'fictional';
