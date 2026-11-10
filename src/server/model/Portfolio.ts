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

  private static toMemberRecord ( row: PortfolioMemberRow ) : PortfolioMemberRecord {
    return {
      portfolioId: row.portfolio_id, userId: row.user_id, username: row.username,
      role: row.role, createdAt: row.created_at
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

  private static validateName ( name: string ) : string {
    return normalizeString( name, 'Name' );
  }

  private static validateCurrency ( currency: string ) : string {
    const code = normalizeString( currency, 'Currency' );

    if ( ! conn().prepare( 'SELECT 1 FROM currencies WHERE code = ?' ).get( code ) )
      throw new Error( `Unknown currency: ${ code }` );

    return code;
  }

  private static validateRole ( role: unknown ) : PortfolioMemberRole {
    return validateEnum( role, 'role', [ 'owner', 'editor', 'viewer' ] );
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
    if ( ! Person.get( personId, userId ) )
      throw new Error( 'Person does not exist or is not assigned to this user' );

    return as< PortfolioRow[] >( conn().prepare( `
      SELECT * FROM portfolios
      WHERE person_id = ?
      ORDER BY name COLLATE NOCASE
    ` ).all( personId ) ).map( Portfolio.toRecord );
  }

  public static get ( portfolioId: string, userId: string ) : PortfolioRecord | null {
    const role = Portfolio.assertMember( portfolioId, userId );
    if ( ! role ) return null;

    const row = Portfolio.getRow( portfolioId );
    return row ? Portfolio.toRecord( row ) : null;
  }

  public static assertPortfolioId ( portfolioId: string ) : void {
    assertId( portfolioId, 'portfolio' );

    if ( ! conn().prepare( 'SELECT 1 FROM portfolios WHERE id = ?' ).get( portfolioId ) )
      throw new Error( `Portfolio ${ portfolioId } does not exist` );
  }

  public static create ( userId: string, data: PortfolioCreateData ) : PortfolioRecord {
    User.assertUserIdSafe( userId );
    if ( ! Person.get( data.personId, userId ) ) throw new Error( 'Person does not exist or is not assigned to this user' );

    const name = Portfolio.validateName( data.name );
    const currency = Portfolio.validateCurrency( data.currency );

    const id = db.transaction( tx => db.createWithId( id => {
      tx.prepare( `
        INSERT INTO portfolios ( id, person_id, name, description, currency, note )
        VALUES ( ?, ?, ?, ?, ?, ? )
      ` ).run( id, data.personId, name, data.description ?? null, currency, data.note ?? null );

      tx.prepare( `
        INSERT INTO portfolio_members ( portfolio_id, user_id, role )
        VALUES ( ?, ?, 'owner' )
      ` ).run( id, userId );

      return id;
    } ) );

    const portfolio = Portfolio.getRow( id );
    if ( ! portfolio ) throw new Error( 'Failed to create portfolio' );

    return Portfolio.toRecord( portfolio );
  }

  public static update ( portfolioId: string, userId: string, data: PortfolioUpdateData ) : PortfolioRecord {
    Portfolio.assertOwner( portfolioId, userId );

    const entries = Object.entries( COLUMNS ).filter( ( [ key ] ) => data[ key as keyof PortfolioUpdateData ] !== undefined );

    if ( ! entries.length ) {
      const portfolio = Portfolio.getRow( portfolioId );
      if ( ! portfolio ) throw new Error( 'Portfolio does not exist' );
      return Portfolio.toRecord( portfolio );
    }

    if ( data.personId !== undefined && ! Person.get( data.personId, userId ) )
      throw new Error( 'Person does not exist or is not assigned to this user' );

    if ( data.name !== undefined ) data.name = Portfolio.validateName( data.name );
    if ( data.currency !== undefined ) data.currency = Portfolio.validateCurrency( data.currency );

    const values = entries.map( ( [ key ] ) => data[ key as keyof PortfolioUpdateData ] );

    const result = conn().prepare( `
      UPDATE portfolios
      SET ${ entries.map( ( [ , column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ?
    ` ).run( ...values as SQLInputValue[], portfolioId );

    if ( ! result.changes ) throw new Error( 'Portfolio does not exist' );

    const portfolio = Portfolio.getRow( portfolioId );
    if ( ! portfolio ) throw new Error( 'Failed to update portfolio' );

    return Portfolio.toRecord( portfolio );
  }

  public static delete ( portfolioId: string, userId: string ) : void {
    Portfolio.assertOwner( portfolioId, userId );
    const result = conn().prepare( 'DELETE FROM portfolios WHERE id = ?' ).run( portfolioId );
    if ( ! result.changes ) throw new Error( 'Portfolio does not exist' );
  }

  public static listMembers ( portfolioId: string, userId: string ) : PortfolioMemberRecord[] {
    Portfolio.assertMember( portfolioId, userId );

    return as< PortfolioMemberRow[] >( conn().prepare( `
      SELECT pm.*, u.username
      FROM portfolio_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.portfolio_id = ?
      ORDER BY
        CASE pm.role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END,
        u.username COLLATE NOCASE
    ` ).all( portfolioId ) ).map( Portfolio.toMemberRecord );
  }

  public static addMember ( portfolioId: string, userId: string, memberId: string, role: PortfolioMemberRole = 'viewer' ) : PortfolioMemberRecord {
    Portfolio.assertOwner( portfolioId, userId );
    User.assertUserIdSafe( memberId );

    const memberRole = Portfolio.validateRole( role );

    conn().prepare(
      'INSERT INTO portfolio_members ( portfolio_id, user_id, role ) VALUES ( ?, ?, ? )'
    ).run( portfolioId, memberId, memberRole );

    const member = as< PortfolioMemberRow | null >( conn().prepare( `
      SELECT pm.*, u.username
      FROM portfolio_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.portfolio_id = ? AND pm.user_id = ?
    ` ).get( portfolioId, memberId ) );

    if ( ! member ) throw new Error( 'Failed to add portfolio member' );
    return Portfolio.toMemberRecord( member );
  }

  public static updateMemberRole ( portfolioId: string, userId: string, memberId: string, role: PortfolioMemberRole ) : PortfolioMemberRecord {
    Portfolio.assertOwner( portfolioId, userId );
    User.assertUserIdSafe( memberId );

    const memberRole = Portfolio.validateRole( role );
    const currentRole = Portfolio.getMemberRole( portfolioId, memberId );
    if ( ! currentRole ) throw new Error( 'Portfolio member does not exist' );

    if ( currentRole === 'owner' && memberRole !== 'owner' ) {
      const owners = as< { count: number } >( conn().prepare( `
        SELECT COUNT(*) AS count
        FROM portfolio_members
        WHERE portfolio_id = ? AND role = 'owner'
      ` ).get( portfolioId ) ).count;

      if ( owners <= 1 ) throw new Error( 'A portfolio must have at least one owner' );
    }

    conn().prepare( 'UPDATE portfolio_members SET role = ? WHERE portfolio_id = ? AND user_id = ?' )
      .run( memberRole, portfolioId, memberId );

    const member = as< PortfolioMemberRow | null >( conn().prepare( `
      SELECT pm.*, u.username
      FROM portfolio_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.portfolio_id = ? AND pm.user_id = ?
    ` ).get( portfolioId, memberId ) );

    if ( ! member ) throw new Error( 'Portfolio member does not exist' );
    return Portfolio.toMemberRecord( member );
  }

  public static removeMember ( portfolioId: string, userId: string, memberId: string ) : void {
    Portfolio.assertOwner( portfolioId, userId );
    User.assertUserIdSafe( memberId );

    const currentRole = Portfolio.getMemberRole( portfolioId, memberId );
    if ( ! currentRole ) throw new Error( 'Portfolio member does not exist' );

    if ( currentRole === 'owner' ) {
      const owners = as< { count: number } >( conn().prepare( `
        SELECT COUNT(*) AS count
        FROM portfolio_members
        WHERE portfolio_id = ? AND role = 'owner'
      ` ).get( portfolioId ) ).count;

      if ( owners <= 1 ) throw new Error( 'A portfolio must have at least one owner' );
    }

    const result = conn().prepare( 'DELETE FROM portfolio_members WHERE portfolio_id = ? AND user_id = ?' )
      .run( portfolioId, memberId );

    if ( ! result.changes ) throw new Error( 'Portfolio member does not exist' );
  }
}
