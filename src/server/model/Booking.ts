import { as, conn, db } from '@/src/server/core/Database';
import { Values } from '@/src/server/core/Values';
import { Asset } from '@/src/server/model/Asset';
import { Portfolio } from '@/src/server/model/Portfolio';
import { Transaction } from '@/src/server/model/Transaction';
import { assertId, parseDate, parseNumber, parseString, toRecord, toRow } from '@/src/server/utils';
import type { BookingCreateData, BookingRecord, BookingRow, BookingUpdateData } from '@/src/shared/types/booking';
import type { SQLInputValue } from 'node:sqlite';


const MIN = Number.MIN_SAFE_INTEGER, MAX = Number.MAX_SAFE_INTEGER, COLS = {
  assetId: 'asset_id', transactionId: 'transaction_id', type: 'type', valueType: 'value_type',
  amount: 'amount', minAmount: 'min_amount', maxAmount: 'max_amount', bookingDate: 'booking_date',
  valueDate: 'value_date', reliability: 'reliability', note: 'note'
};
