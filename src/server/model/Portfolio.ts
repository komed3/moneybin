import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Person } from '@/src/server/model/Person';
import { assertId, normalizeString, validateEnum } from '@/src/server/utils';
import type {
  PortfolioCreateData, PortfolioMemberRecord, PortfolioMemberRole, PortfolioMemberRow,
  PortfolioRecord, PortfolioRow, PortfolioUpdateData
} from '@/src/shared/types/portfolio';
import { SQLInputValue } from 'node:sqlite';


const COLUMNS = { personId: 'person_id', name: 'name', description: 'description', currency: 'currency', note: 'note' };


export class Portfolio {
  private static getRow ( portfolioId: string ) : PortfolioRow | null {
    assertId( portfolioId, 'portfolio' );
    return as< PortfolioRow | null >( conn().prepare( 'SELECT * FROM portfolios WHERE id = ?' ).get( portfolioId ) );
  }

  private static toRecord ( row: PortfolioRow ) : PortfolioRecord {
    return {
      id: row.id, personId: row.person_id, name: row.name, description: row.description,
      currency: row.currency, note: row.note, createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  private static getMemberRole ( portfolioId: string, userId: string ) : PortfolioMemberRole | null {
    return as< { role: PortfolioMemberRole } | null >( conn().prepare(
      'SELECT role FROM portfolio_members WHERE portfolio_id = ? AND user_id = ?'
    ).get( portfolioId, userId ) )?.role ?? null;
  }

  private static assertMember ( portfolioId: string, userId: string ) : PortfolioMemberRole {
    User.assertUserIdSafe( userId );
    Portfolio.assertPortfolioId( portfolioId );

    const role = Portfolio.getMemberRole( portfolioId, userId );
    if ( ! role ) throw new Error( 'User is not a member of this portfolio' );

    return role;
  }

  private static assertOwner ( portfolioId: string, userId: string ) : void {
    if ( Portfolio.assertMember( portfolioId, userId ) !== 'owner' )
      throw new Error( 'Only portfolio owners can perform this action' );
  }
}
