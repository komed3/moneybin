import { as, conn, db } from '@/src/server/core/Database';
import { Asset } from '@/src/server/model/Asset';
import { Booking } from '@/src/server/model/Booking';
import { Portfolio } from '@/src/server/model/Portfolio';
import { assertId, parseString } from '@/src/server/utils';
import type {
  TransactionCreateData, TransactionRecord, TransactionUpdateData,
  TransactionWithPortfolio
} from '@/src/shared/types/transaction';


export class Transaction {
  private static getRow ( transactionId: string ) : TransactionWithPortfolio | null {
    assertId( transactionId, 'transaction' );

    return as< TransactionWithPortfolio | null >( conn().prepare( `
      SELECT t.*, a.portfolio_id
      FROM transactions t
      JOIN bookings b ON b.transaction_id = t.id
      JOIN assets a ON a.id = b.asset_id
      WHERE t.id = ?
      GROUP BY t.id
    ` ).get( transactionId ) );
  }

  private static toRecord ( row: TransactionWithPortfolio, userId: string ) : TransactionRecord {
    return {
      id: row.id, portfolioId: row.portfolio_id, note: row.note, createdAt: row.created_at,
      bookings: Booking.listByTransaction( row.id, row.portfolio_id, userId )
    };
  }

  private static validate ( data: TransactionCreateData | TransactionUpdateData ) : void {
    data.note = parseString( data.note, 'Note', true );
  }

  public static assertTransactionIdSafe ( transactionId: string, portfolioId: string, excludeBookingId?: string ) : void {
    assertId( transactionId, 'transaction' );
    Portfolio.assertPortfolioIdSafe( portfolioId );

    const row = as< { id: string; portfolio_id: string | null } | null >( conn().prepare( `
      SELECT t.id, MIN( a.portfolio_id ) AS portfolio_id
      FROM transactions t
      LEFT JOIN bookings b ON b.transaction_id = t.id AND b.id <> COALESCE( ?, '' )
      LEFT JOIN assets a ON a.id = b.asset_id
      WHERE t.id = ?
      GROUP BY t.id
    ` ).get( excludeBookingId ?? null, transactionId ) );

    if ( ! row ) throw new Error( `Transaction ${ transactionId } does not exist` );
    if ( row.portfolio_id && row.portfolio_id !== portfolioId ) throw new Error( 'Transaction belongs to another portfolio' );
  }

  public static list ( portfolioId: string, userId: string ) : TransactionRecord[] {
    Portfolio.assertMember( portfolioId, userId );

    return as< TransactionWithPortfolio[] >( conn().prepare( `
      SELECT t.*, a.portfolio_id
      FROM transactions t
      JOIN bookings b ON b.transaction_id = t.id
      JOIN assets a ON a.id = b.asset_id
      WHERE a.portfolio_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
    ` ).all( portfolioId ) ).map( row => Transaction.toRecord( row, userId ) );
  }

  public static get ( transactionId: string, userId: string ) : TransactionRecord | null {
    const row = Transaction.getRow( transactionId );
    if ( ! row ) return null;

    Portfolio.assertMember( row.portfolio_id, userId );
    return Transaction.toRecord( row, userId );
  }

  public static getSafe ( transactionId: string, userId: string ) : TransactionRecord {
    const transaction = Transaction.get( transactionId, userId );
    if ( ! transaction ) throw new Error( `Transaction ${ transactionId } does not exist` );
    return transaction;
  }

  public static create ( portfolioId: string, userId: string, data: TransactionCreateData ) : TransactionRecord {
    Portfolio.assertEditable( portfolioId, userId );
    Transaction.validate( data );

    if ( ! Array.isArray( data.bookings ) || ! data.bookings.length ) throw new Error( 'Transaction needs at least one booking' );

    data.bookings.forEach( booking => {
      const asset = Asset.getSafe( booking.assetId, userId );
      if ( asset.portfolioId !== portfolioId ) throw new Error( 'Bookings must belong to one portfolio' );
    } );

    const id = db.transaction( tx => db.createWithId( id => {
      tx.prepare( 'INSERT INTO transactions ( id, note ) VALUES ( ?, ? )' ).run( id, data.note ?? null );
      data.bookings.forEach( booking => Booking.create( userId, { ...booking, transactionId: id } ) );
      return id;
    } ) );

    return Transaction.getSafe( id, userId );
  }

  public static update ( transactionId: string, userId: string, data: TransactionUpdateData ) : TransactionRecord {
    const transaction = Transaction.getSafe( transactionId, userId );
    Transaction.validate( data );

    if ( data.note === undefined ) return transaction;

    Portfolio.assertEditable( transaction.portfolioId, userId );
    conn().prepare( 'UPDATE transactions SET note = ? WHERE id = ?' ).run( data.note ?? null, transactionId );

    return Transaction.getSafe( transactionId, userId );
  }

  public static delete ( transactionId: string, userId: string ) : void {
    const transaction = Transaction.getSafe( transactionId, userId );
    Portfolio.assertEditable( transaction.portfolioId, userId );
    conn().prepare( 'DELETE FROM transactions WHERE id = ?' ).run( transactionId );
  }
}
