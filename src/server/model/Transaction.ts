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
    Portfolio.getSafe( portfolioId );

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
}
