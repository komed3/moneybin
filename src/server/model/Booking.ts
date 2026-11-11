import { as, conn, db } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, normalizeString, validateEnum, validateNumber } from '@/src/server/utils';
import type {
  BookingCreateData, BookingRecord, BookingReliability, BookingRow, BookingType,
  BookingUpdateData, BookingValueType
} from '@/src/shared/types/booking';
import type { SQLInputValue } from 'node:sqlite';


const COLS = {
  assetId: 'asset_id', transactionId: 'transaction_id', type: 'type', valueType: 'value_type',
  amount: 'amount', minAmount: 'min_amount', maxAmount: 'max_amount', bookingDate: 'booking_date',
  valueDate: 'value_date', reliability: 'reliability', note: 'note'
};
