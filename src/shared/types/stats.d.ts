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
