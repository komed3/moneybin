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
