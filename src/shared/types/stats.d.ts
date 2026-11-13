import type { DailyValueRecord } from '@/src/shared/types/daily';


export type StatsDailyValue = Omit< DailyValueRecord, 'assetId' >;

export interface YearlyRow {
  year: number;
  quality: number;
  open: number | null;
  high: number;
  low: number;
  close: number;
  change: number | null;
  change_percent: number | null;
  average_value: number;
  volatility: number | null;
  max_drawdown: number;
  max_drawdown_percent: number;
  booking_count: number;
  positive_change: number;
  negative_change: number;
  average_change: number | null;
  best_day: number | null;
  worst_day: number | null;
  best_day_percent: number | null;
  worst_day_percent: number | null;
}

export interface AssetYearlyRow extends YearlyRow {
  asset_id: string;
}

export interface PortfolioYearlyRow extends YearlyRow {
  portfolio_id: string;
  asset_count: number;
  active_asset_count: number;
}

export interface YearlyRecord {
  year: number;
  quality: number;
  open: number | null;
  high: number;
  low: number;
  close: number;
  change: number | null;
  changePercent: number | null;
  averageValue: number;
  volatility: number | null;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  bookingCount: number;
  positiveChange: number;
  negativeChange: number;
  averageChange: number | null;
  bestDay: number | null;
  worstDay: number | null;
  bestDayPercent: number | null;
  worstDayPercent: number | null;
}

export interface PortfolioYearlyRecord extends YearlyRecord {
  assetCount: number;
  activeAssetCount: number;
}
