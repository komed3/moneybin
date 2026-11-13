import type { DailyValueRecord } from '@/src/shared/types/daily';


export type StatsDailyValue = Omit< DailyValueRecord, 'assetId' >;

export interface StatsBookingRow {
  year: number;
  booking_count: number;
  active_asset_count?: number;
}

export interface StatsYearlyRow {
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

export interface StatsAssetYearlyRow extends StatsYearlyRow {
  asset_id: string;
}

export interface StatsPortfolioYearlyRow extends StatsYearlyRow {
  portfolio_id: string;
  asset_count: number;
  active_asset_count: number;
}

export interface StatsYearlyRecord {
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

export interface StatsPortfolioYearlyRecord extends StatsYearlyRecord {
  assetCount: number;
  activeAssetCount: number;
}
