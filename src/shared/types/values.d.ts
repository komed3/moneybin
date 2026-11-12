export type CurrencyCode =
  | 'EUR' | 'USD' | 'GBP' | 'CHF' | 'RUB' | 'JPY'
  | 'CNY' | 'CAD' | 'AUD' | 'SEK' | 'PLN';

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
