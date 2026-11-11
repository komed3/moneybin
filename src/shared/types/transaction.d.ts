import type { BookingCreateData, BookingRecord } from '@/src/shared/types/booking';


export interface TransactionRecord {
  id: string;
  portfolioId: string;
  note: string | null;
  bookings: BookingRecord[];
  createdAt: string;
}

export interface TransactionRow {
  id: string;
  note: string | null;
  created_at: string;
}

export interface TransactionCreateData {
  note?: string | null;
  bookings: BookingCreateData[];
}

export interface TransactionUpdateData {
  note?: string | null;
}
