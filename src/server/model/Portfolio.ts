import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Values } from '@/src/server/core/Values';
import { Person } from '@/src/server/model/Person';
import { assertId, parseString } from '@/src/server/utils';
import type {
  PortfolioCreateData, PortfolioMemberRecord, PortfolioMemberRow, PortfolioRecord,
  PortfolioRow, PortfolioUpdateData
} from '@/src/shared/types/portfolio';
import type { PortfolioMemberRole } from '@/src/shared/types/values';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';


const COLS = { personId: 'person_id', name: 'name', description: 'description', currency: 'currency', note: 'note' };


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

  private static getMemberRow ( portfolioId: string, userId: string ) : PortfolioMemberRow | null {
    return as< PortfolioMemberRow | null >( conn().prepare( `
      SELECT pm.*, u.username
      FROM portfolio_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.portfolio_id = ? AND pm.user_id = ?
    ` ).get( portfolioId, userId ) );
  }

  private static toMemberRecord ( row: PortfolioMemberRow ) : PortfolioMemberRecord {
    return {
      portfolioId: row.portfolio_id, userId: row.user_id, username: row.username,
      role: row.role, createdAt: row.created_at
    };
  }

  private static validate ( data: PortfolioUpdateData ) : void {
    data.personId = assertId( data.personId, 'person' );
    data.name = parseString( data.name, 'Name' );
    data.description = parseString( data.description, 'Description', true );
    data.currency = Values.validateCurrencyCode( data.currency ) ?? undefined;
    data.note = parseString( data.note, 'Note', true );
  }

  private static assertAtLeastOneOwner (
    tx: DatabaseSync, portfolioId: string, currentRole: PortfolioMemberRole, memberRole?: PortfolioMemberRole
  ) : void {
    if ( currentRole === 'owner' && memberRole !== 'owner' ) {
      const owners = as< { count: number } >( tx.prepare(
        `SELECT COUNT(*) AS count FROM portfolio_members WHERE portfolio_id = ? AND role = 'owner'`
      ).get( portfolioId ) ).count;

      if ( owners <= 1 ) throw new Error( 'A portfolio must have an owner' );
    }
  }

  public static assertPortfolioIdSafe ( portfolioId: string ) : void {
    if ( ! Portfolio.getRow( portfolioId ) ) throw new Error( `Portfolio ${ portfolioId } does not exist` );
  }

  public static assertMember ( portfolioId: string, userId: string ) : PortfolioMemberRole {
    assertId( portfolioId, 'portfolio' );
    User.assertUserIdSafe( userId );

    const role = Portfolio.getMemberRole( portfolioId, userId );
    if ( ! role ) throw new Error( 'User is not a portfolio member' );

    return role;
  }

  public static assertOwner ( portfolioId: string, userId: string ) : void {
    if ( Portfolio.assertMember( portfolioId, userId ) !== 'owner' )
      throw new Error( 'Only portfolio owners can perform this action' );
  }

  public static assertEditable ( portfolioId: string, userId: string ) : void {
    if ( ! [ 'owner', 'editor' ].includes( Portfolio.assertMember( portfolioId, userId ) ) )
      throw new Error( 'Only portfolio owners and editors can modify it' );
  }

  public static list ( userId: string ) : PortfolioRecord[] {
    User.assertUserIdSafe( userId );

    return as< PortfolioRow[] >( conn().prepare( `
      SELECT p.*
      FROM portfolios p
      JOIN portfolio_members pm ON pm.portfolio_id = p.id
      WHERE pm.user_id = ?
      ORDER BY p.name COLLATE NOCASE
    ` ).all( userId ) ).map( Portfolio.toRecord );
  }

  public static listByPerson ( personId: string, userId: string ) : PortfolioRecord[] {
    Person.assertPersonIdSafe( personId, userId );

    return as< PortfolioRow[] >( conn().prepare(
      'SELECT * FROM portfolios WHERE person_id = ? ORDER BY name COLLATE NOCASE'
    ).all( personId ) ).map( Portfolio.toRecord );
  }
}
