export type CurrencyCode =
  | 'EUR' | 'USD' | 'GBP' | 'CHF' | 'RUB' | 'JPY'
  | 'CNY' | 'CAD' | 'AUD' | 'SEK' | 'PLN';

export type AssetType =
  | 'cash' | 'account' | 'depot' | 'collection' | 'property' | 'lease'
  | 'debt' | 'receivable' | 'contract' | 'investment' | 'insurance'
  | 'vehicle' | 'valuable' | 'right' | 'other';

export type LiquidationLevel =
  | 'instant' | 'very_high' | 'high' | 'medium'
  | 'low' | 'very_low' | 'illiquid';

export type BookingType =
  | 'deposit' | 'withdrawal' | 'transfer' | 'direct_debit' | 'purchase'
  | 'sale' | 'fee' | 'interest' | 'dividend' | 'tax' | 'repayment'
  | 'adjustment' | 'other';

export type LanguageCode = 'en' | 'de';

export type NodeEnvironment = 'dev' | 'development' | 'test' | 'prod' | 'production';

export type PersonGender = 'male' | 'female' | 'diverse';

export type PortfolioMemberRole = 'owner' | 'editor' | 'viewer';

export type AssetStatus = 'real' | 'fictional';

export type BookingValueType = 'relative' | 'absolute';

export type BookingReliability = 'documented' | 'reconstructed' | 'speculative' | 'assumed';

export interface CurrencyRecord {
  code: CurrencyCode;
  symbol: string;
  decimalPlaces: number;
}

export interface CurrencyRow {
  code: CurrencyCode;
  symbol: string;
  decimal_places: number;
}
