import { as, conn, db } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseDate, parseEnum, parseNumber, parseString } from '@/src/server/utils';
import type {
  BookingCreateData, BookingRecord, BookingReliability, BookingRow,
  BookingType, BookingUpdateData, BookingValueType
} from '@/src/shared/types/booking';
import type { SQLInputValue } from 'node:sqlite';


const COLS = {
  assetId: 'asset_id', transactionId: 'transaction_id', type: 'type', valueType: 'value_type',
  amount: 'amount', minAmount: 'min_amount', maxAmount: 'max_amount', bookingDate: 'booking_date',
  valueDate: 'value_date', reliability: 'reliability', note: 'note'
};


export class Booking {
  private static getRow ( bookingId: string ) : BookingRow | null {
    assertId( bookingId, 'booking' );
    return as< BookingRow | null >( conn().prepare( 'SELECT * FROM bookings WHERE id = ?' ).get( bookingId ) );
  }

  private static toRecord ( row: BookingRow ) : BookingRecord {
    return {
      id: row.id, assetId: row.asset_id, transactionId: row.transaction_id, type: row.type,
      valueType: row.value_type, amount: row.amount, minAmount: row.min_amount, maxAmount: row.max_amount,
      bookingDate: row.booking_date, valueDate: row.value_date, reliability: row.reliability,
      note: row.note, createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  private static validate ( data: BookingCreateData | BookingUpdateData ) : void {
    if ( data.assetId !== undefined ) assertId( data.assetId, 'asset' );
    if ( data.transactionId ) assertId( data.transactionId, 'transaction' );

    data.type = parseEnum< BookingType >( data.type, 'type', [
      'deposit', 'withdrawal', 'transfer', 'direct_debit', 'purchase', 'sale',
      'fee', 'interest', 'dividend', 'tax', 'repayment', 'adjustment', 'other'
    ] );

    data.valueType = parseEnum< BookingValueType >( data.valueType, 'value type', [ 'relative', 'absolute' ] );

    data.reliability = parseEnum< BookingReliability >( data.reliability, 'reliability', [
      'documented', 'reconstructed', 'speculative', 'assumed'
    ] );

    data.amount = parseNumber( data.amount, 'Amount', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true );
    data.minAmount = parseNumber( data.minAmount, 'Minimum amount', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true, false, true );
    data.maxAmount = parseNumber( data.maxAmount, 'Maximum amount', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true, false, true );
    data.bookingDate = parseDate( data.bookingDate, 'Booking date' );
    data.valueDate = parseDate( data.valueDate, 'Value date' );
    data.note = parseString( data.note, 'Note', true );
  }
}
