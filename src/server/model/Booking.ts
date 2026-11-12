import { as, conn, db } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { AssetValue } from '@/src/server/model/AssetValue';
import { Portfolio } from '@/src/server/model/Portfolio';
import { Transaction } from '@/src/server/model/Transaction';
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
    data.type = parseEnum< BookingType >( data.type, 'type', [
      'deposit', 'withdrawal', 'transfer', 'direct_debit', 'purchase', 'sale',
      'fee', 'interest', 'dividend', 'tax', 'repayment', 'adjustment', 'other'
    ] );

    data.valueType = parseEnum< BookingValueType >( data.valueType, 'value type', [ 'relative', 'absolute' ] );

    data.reliability = parseEnum< BookingReliability >( data.reliability, 'reliability', [
      'documented', 'reconstructed', 'speculative', 'assumed'
    ] );

    data.assetId = assertId( data.assetId, 'asset' );
    data.transactionId = assertId( data.transactionId, 'transaction', true );
    data.amount = parseNumber( data.amount, 'Amount', MIN, MAX );
    data.minAmount = parseNumber( data.minAmount, 'Minimum amount', MIN, MAX, true );
    data.maxAmount = parseNumber( data.maxAmount, 'Maximum amount', MIN, MAX, true );
    data.bookingDate = parseDate( data.bookingDate, 'Booking date' );
    data.valueDate = parseDate( data.valueDate, 'Value date' );
    data.note = parseString( data.note, 'Note', true );
  }

  private static validateAmounts ( amount: number, min: number | null, max: number | null ) : void {
    if ( min !== null && min > amount ) throw new Error( 'Minimum amount exceeds amount' );
    if ( max !== null && max < amount ) throw new Error( 'Maximum amount is below amount' );
    if ( min !== null && max !== null && min > max ) throw new Error( 'Minimum amount exceeds maximum' );
  }

  public static validateDate ( data: BookingCreateData ) : void {
    data.valueDate ??= data.bookingDate;
    if ( ! data.valueDate ) throw new Error( 'At least one booking date is required' );
    data.bookingDate ??= data.valueDate;
  }

  private static cleanupTransaction ( transactionId: string | null ) : void {
    if ( ! transactionId ) return;

    conn().prepare( `DELETE FROM transactions WHERE id = ? AND NOT EXISTS (
      SELECT 1 FROM bookings WHERE transaction_id = ?
    )` ).run( transactionId, transactionId );
  }

  public static assertBookingIdSafe ( bookingId: string, userId: string ) : void {
    assertId( bookingId, 'booking' );

    if ( ! conn().prepare( `
      SELECT 1
      FROM bookings b
      JOIN assets a ON a.id = b.asset_id
      JOIN portfolio_members pm ON pm.portfolio_id = a.portfolio_id
      WHERE b.id = ? AND pm.user_id = ?
    ` ).get( bookingId, userId ) ) throw new Error( `Booking ${ bookingId } does not exist` );
  }

  public static list ( assetId: string, userId: string ) : BookingRecord[] {
    Asset.assertAssetIdSafe( assetId, userId );

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

  public static get ( bookingId: string, userId: string ) : BookingRecord | null {
    const row = Booking.getRow( bookingId );
    if ( ! row ) return null;

    Asset.assertAssetIdSafe( row.asset_id, userId );
    return Booking.toRecord( row );
  }

  public static getSafe ( bookingId: string, userId: string ) : BookingRecord {
    const booking = Booking.get( bookingId, userId );
    if ( ! booking ) throw new Error( `Booking ${ bookingId } does not exist` );
    return booking;
  }

  public static create ( userId: string, data: BookingCreateData ) : BookingRecord {
    Booking.validate( data );
    Booking.validateAmounts( data.amount, data.minAmount ?? null, data.maxAmount ?? null );
    Booking.validateDate( data );

    if ( ! data.type || ! data.valueType || data.amount === undefined || ! data.reliability )
      throw new Error( 'Booking is missing required fields' );

    Asset.assertAssetIdSafe( data.assetId, userId );
    const asset = Asset.getSafe( data.assetId, userId );
    Portfolio.assertEditable( asset.portfolioId, userId );

    if ( data.transactionId ) Transaction.assertTransactionIdSafe( data.transactionId, asset.portfolioId );

    const id = db.createWithId( id => {
      conn().prepare( `
        INSERT INTO bookings (
          id, asset_id, transaction_id, type, value_type, amount, min_amount, max_amount,
          booking_date, value_date, reliability, note
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
      ` ).run(
        id, data.assetId, data.transactionId ?? null, data.type, data.valueType, data.amount,
        data.minAmount ?? null, data.maxAmount ?? null, data.bookingDate!, data.valueDate!,
        data.reliability, data.note ?? null
      );

      return id;
    } );

    AssetValue.recalculate( data.assetId, userId );
    return Booking.getSafe( id, userId );
  }

  public static update ( bookingId: string, userId: string, data: BookingUpdateData ) : BookingRecord {
    const booking = Booking.getSafe( bookingId, userId );
    Booking.validate( data );

    const assetId = data.assetId ?? booking.assetId;
    Asset.assertAssetIdSafe( assetId, userId );

    const asset = Asset.getSafe( assetId, userId );
    Portfolio.assertEditable( asset.portfolioId, userId );

    const transactionId = data.transactionId === undefined ? booking.transactionId : data.transactionId;
    if ( transactionId ) Transaction.assertTransactionIdSafe( transactionId, asset.portfolioId, bookingId );

    const amount = data.amount ?? booking.amount;
    const min = data.minAmount === undefined ? booking.minAmount : data.minAmount;
    const max = data.maxAmount === undefined ? booking.maxAmount : data.maxAmount;
    Booking.validateAmounts( amount, min, max );

    const entries = Object.entries( COLS ).filter( ( [ k ] ) => data[ k as keyof BookingUpdateData ] !== undefined );
    if ( ! entries.length ) return booking;

    const values = entries.map( ( [ key ] ) => {
      const value = data[ key as keyof BookingUpdateData ];
      return key === 'transactionId' || key === 'note' || key === 'minAmount' || key === 'maxAmount'
        ? value ?? null : value;
    } );

    conn().prepare( `
      UPDATE bookings
      SET ${ entries.map( ( [ , column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ?
    ` ).run( ...values as SQLInputValue[], bookingId );

    if ( booking.transactionId && booking.transactionId !== transactionId )
      Booking.cleanupTransaction( booking.transactionId );

    const updated = Booking.getSafe( bookingId, userId );

    if ( booking.assetId !== updated.assetId ) AssetValue.recalculate( booking.assetId, userId );
    AssetValue.recalculate( updated.assetId, userId );

    return updated;
  }

  public static delete ( bookingId: string, userId: string ) : void {
    const booking = Booking.getSafe( bookingId, userId );
    const asset = Asset.getSafe( booking.assetId, userId );

    Portfolio.assertEditable( asset.portfolioId, userId );
    conn().prepare( 'DELETE FROM bookings WHERE id = ?' ).run( bookingId );
    Booking.cleanupTransaction( booking.transactionId );
    AssetValue.recalculate( booking.assetId, userId );
  }
}
