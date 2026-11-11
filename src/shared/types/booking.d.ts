export type BookingType =
  | 'deposit' | 'withdrawal' | 'transfer' | 'direct_debit' | 'purchase' | 'sale' | 'fee'
  | 'interest' | 'dividend' | 'tax' | 'repayment' | 'adjustment' | 'other';

export type BookingValueType = 'relative' | 'absolute';

export type BookingReliability = 'documented' | 'reconstructed' | 'speculative' | 'assumed';

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

export interface BookingCreateData {
  assetId: string;
  transactionId?: string | null;
  type: BookingType;
  valueType: BookingValueType;
  amount: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  bookingDate?: string;
  valueDate?: string;
  reliability: BookingReliability;
  note?: string | null;
}

export type BookingUpdateData = Partial< BookingCreateData >;
