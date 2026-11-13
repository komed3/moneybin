import type { BookingReliability, BookingType, BookingValueType } from '@/src/shared/types/values';


export interface BookingRecord {
  id: string;
  assetId: string;
  transactionId: string | null;
  type: BookingType;
  valueType: BookingValueType;
  amount: number;
  minAmount: number | null;
  maxAmount: number | null;
  bookingDate: string;
  valueDate: string;
  reliability: BookingReliability;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRow {
  id: string;
  asset_id: string;
  transaction_id: string | null;
  type: BookingType;
  value_type: BookingValueType;
  amount: number;
  min_amount: number | null;
  max_amount: number | null;
  booking_date: string;
  value_date: string;
  reliability: BookingReliability;
  note: string | null;
  created_at: string;
  updated_at: string;
}
