export interface StatsDailyValue {
  valueDate: string;
  quality: number;
  open: number | null;
  high: number;
  low: number;
  close: number;
  change: number | null;
  changePercent: number | null;
}

export interface StatsDailyValueRow {
  asset_id: string;
  value_date: string;
  quality: number;
  open: number | null;
  high: number;
  low: number;
  close: number;
  change: number | null;
  change_percent: number | null;
}

export interface StatsBookingCountRow {
  year: number;
  booking_count: number;
}

export interface StatsPortfolioBookingCountRow extends StatsBookingCountRow {
  active_asset_count: number;
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

export interface StatsPortfolioYearlyRow extends StatsYearlyRow {
  asset_count: number;
  active_asset_count: number;
}
