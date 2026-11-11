export type BookingType =
  | 'deposit' | 'withdrawal' | 'transfer' | 'direct_debit' | 'purchase' | 'sale' | 'fee'
  | 'interest' | 'dividend' | 'tax' | 'repayment' | 'adjustment' | 'other';

export type BookingValueType = 'relative' | 'absolute';

export type BookingReliability = 'documented' | 'reconstructed' | 'speculative' | 'assumed';
