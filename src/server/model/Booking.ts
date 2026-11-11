import { as, conn, db } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseDate, parseEnum, parseNumber, parseString } from '@/src/server/utils';
import type {
  BookingCreateData, BookingRecord, BookingReliability, BookingRow,
  BookingType, BookingUpdateData, BookingValueType
} from '@/src/shared/types/booking';
import type { SQLInputValue } from 'node:sqlite';


const MIN = Number.MIN_SAFE_INTEGER, MAX = Number.MAX_SAFE_INTEGER, COLS = {
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

    data.amount = parseNumber( data.amount, 'Amount', MIN, MAX, true );
    data.minAmount = parseNumber( data.minAmount, 'Minimum amount', MIN, MAX, true, false, true );
    data.maxAmount = parseNumber( data.maxAmount, 'Maximum amount', MIN, MAX, true, false, true );
    data.bookingDate = parseDate( data.bookingDate, 'Booking date' );
    data.valueDate = parseDate( data.valueDate, 'Value date' );
    data.note = parseString( data.note, 'Note', true );
  }

  private static validateAmounts ( amount: number, min: number | null, max: number | null ) : void {
    if ( min !== null && min > amount ) throw new Error( 'Minimum amount must not exceed amount' );
    if ( max !== null && max < amount ) throw new Error( 'Maximum amount must not be less than amount' );
    if ( min !== null && max !== null && min > max ) throw new Error( 'Minimum amount must not exceed maximum amount' );
  }

  private static assertTransaction ( transactionId: string, portfolioId: string, excludeBookingId?: string ) : void {
    if ( ! conn().prepare( 'SELECT 1 FROM transactions WHERE id = ?' ).get( transactionId ) )
      throw new Error( `Transaction ${ transactionId } does not exist` );

    const booking = as< { portfolio_id: string } | null >( conn().prepare( `
      SELECT a.portfolio_id
      FROM bookings b
      JOIN assets a ON a.id = b.asset_id
      WHERE b.transaction_id = ? AND b.id <> COALESCE( ?, '' )
      LIMIT 1
    ` ).get( transactionId, excludeBookingId ?? null ) );

    if ( booking && booking.portfolio_id !== portfolioId )
      throw new Error( 'A transaction cannot contain bookings from different portfolios' );
  }

  private static cleanupTransaction ( transactionId: string | null ) : void {
    if ( ! transactionId ) return;

    conn().prepare( `DELETE FROM transactions WHERE id = ? AND NOT EXISTS (
      SELECT 1 FROM bookings WHERE transaction_id = ?
    )` ).run( transactionId, transactionId );
  }

  public static list ( assetId: string, userId: string ) : BookingRecord[] {
    Asset.getSafe( assetId, userId );

    return as< BookingRow[] >( conn().prepare(
      'SELECT * FROM bookings WHERE asset_id = ? ORDER BY value_date DESC, booking_date DESC, created_at DESC'
    ).all( assetId ) ).map( Booking.toRecord );
  }

  public static listByPortfolio ( portfolioId: string, userId: string ) : BookingRecord[] {
    Portfolio.assertMember( portfolioId, userId );

    return as< BookingRow[] >( conn().prepare( `
      SELECT b.*
      FROM bookings b
      JOIN assets a ON a.id = b.asset_id
      WHERE a.portfolio_id = ?
      ORDER BY b.value_date DESC, b.booking_date DESC, b.created_at DESC
    ` ).all( portfolioId ) ).map( Booking.toRecord );
  }

  public static listByTransaction ( transactionId: string, portfolioId: string, userId: string ) : BookingRecord[] {
    assertId( transactionId, 'transaction' );
    Portfolio.assertMember( portfolioId, userId );

    return as< BookingRow[] >( conn().prepare( `
      SELECT b.*
      FROM bookings b
      JOIN assets a ON a.id = b.asset_id
      WHERE b.transaction_id = ? AND a.portfolio_id = ?
      ORDER BY b.value_date, b.booking_date, b.created_at
    ` ).all( transactionId, portfolioId ) ).map( Booking.toRecord );
  }
}
