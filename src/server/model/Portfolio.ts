import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Person } from '@/src/server/model/Person';
import { assertId, parseEnum, parseString } from '@/src/server/utils';
import type {
  PortfolioCreateData, PortfolioMemberRecord, PortfolioMemberRole, PortfolioMemberRow,
  PortfolioRecord, PortfolioRow, PortfolioUpdateData
} from '@/src/shared/types/portfolio';
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

  private static validate ( data: PortfolioCreateData | PortfolioUpdateData ) : void {
    data.personId = assertId( data.personId, 'person' );
    data.name = parseString( data.name, 'Name' );
    data.description = parseString( data.description, 'Description', true );
    data.note = parseString( data.note, 'Note', true );
    data.currency = parseString( data.currency, 'Currency' );

    if ( data.currency !== undefined && ! conn().prepare( 'SELECT 1 FROM currencies WHERE code = ?' ).get( data.currency ) )
      throw new Error( `Unknown currency: ${ data.currency }` );
  }

  private static validateRole ( role: unknown ) : PortfolioMemberRole {
    return parseEnum( role, 'role', [ 'owner', 'editor', 'viewer' ], true );
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
    assertId( portfolioId, 'portfolio' );
    if ( ! conn().prepare( 'SELECT 1 FROM portfolios WHERE id = ?' ).get( portfolioId ) )
      throw new Error( `Portfolio ${ portfolioId } does not exist` );
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

  public static get ( portfolioId: string, userId: string ) : PortfolioRecord | null {
    assertId( portfolioId, 'portfolio' );
    User.assertUserIdSafe( userId );

    const row = as< PortfolioRow | null >( conn().prepare( `
      SELECT p.*
      FROM portfolios p
      JOIN portfolio_members pm ON pm.portfolio_id = p.id
      WHERE p.id = ? AND pm.user_id = ?
    ` ).get( portfolioId, userId ) );

    return row ? Portfolio.toRecord( row ) : null;
  }

  public static getSafe ( portfolioId: string ) : PortfolioRecord {
    const row = Portfolio.getRow( portfolioId );
    if ( ! row ) throw new Error( `Portfolio ${ portfolioId } does not exist` );
    return Portfolio.toRecord( row );
  }

  public static create ( userId: string, data: PortfolioCreateData ) : PortfolioRecord {
    Portfolio.validate( data );
    Person.assertPersonIdSafe( data.personId, userId );

    const id = db.transaction( tx => db.createWithId( id => {
      tx.prepare( 'INSERT INTO portfolios ( id, person_id, name, description, currency, note ) VALUES ( ?, ?, ?, ?, ?, ? )' )
        .run( id, data.personId, data.name, data.description ?? null, data.currency, data.note ?? null );

      tx.prepare( `INSERT INTO portfolio_members ( portfolio_id, user_id, role ) VALUES ( ?, ?, 'owner' )` ).run( id, userId );
      return id;
    } ) );

    return Portfolio.getSafe( id );
  }

  public static update ( portfolioId: string, userId: string, data: PortfolioUpdateData ) : PortfolioRecord {
    Portfolio.assertOwner( portfolioId, userId );
    const portfolio = Portfolio.getSafe( portfolioId );
    Portfolio.validate( data );

    if ( data.personId !== undefined ) Person.assertPersonIdSafe( data.personId, userId );

    const entries = Object.entries( COLS ).filter( ( [ k ] ) => data[ k as keyof PortfolioUpdateData ] !== undefined );
    if ( ! entries.length ) return portfolio;

    const values = entries.map( ( [ key ] ) => data[ key as keyof PortfolioUpdateData ] );
    const result = conn().prepare( `
      UPDATE portfolios
      SET ${ entries.map( ( [ , column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ?
    ` ).run( ...values as SQLInputValue[], portfolioId );

    if ( ! result.changes ) throw new Error( 'Portfolio does not exist' );
    return Portfolio.getSafe( portfolioId );
  }

  public static delete ( portfolioId: string, userId: string ) : void {
    Portfolio.assertOwner( portfolioId, userId );
    conn().prepare( 'DELETE FROM portfolios WHERE id = ?' ).run( portfolioId );
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

    conn().prepare( 'INSERT INTO portfolio_members ( portfolio_id, user_id, role ) VALUES ( ?, ?, ? )' )
      .run( portfolioId, memberId, memberRole );

    const member = Portfolio.getMemberRow( portfolioId, memberId );
    if ( ! member ) throw new Error( 'Failed to add portfolio member' );

    return Portfolio.toMemberRecord( member );
  }

  public static updateMemberRole ( portfolioId: string, userId: string, memberId: string, role: PortfolioMemberRole ) : PortfolioMemberRecord {
    const memberRole = Portfolio.validateRole( role );

    db.transaction( tx => {
      Portfolio.assertOwner( portfolioId, userId );
      User.assertUserIdSafe( memberId );

      const currentRole = Portfolio.getMemberRole( portfolioId, memberId );
      if ( ! currentRole ) throw new Error( 'Portfolio member does not exist' );
      Portfolio.assertAtLeastOneOwner( tx, portfolioId, currentRole, memberRole );

      tx.prepare( 'UPDATE portfolio_members SET role = ? WHERE portfolio_id = ? AND user_id = ?' )
        .run( memberRole, portfolioId, memberId );
    } );

    const member = Portfolio.getMemberRow( portfolioId, memberId );
    if ( ! member ) throw new Error( 'Portfolio member does not exist' );

    return Portfolio.toMemberRecord( member );
  }

  public static removeMember ( portfolioId: string, userId: string, memberId: string ) : void {
    db.transaction( tx => {
      Portfolio.assertOwner( portfolioId, userId );
      User.assertUserIdSafe( memberId );

      const currentRole = Portfolio.getMemberRole( portfolioId, memberId );
      if ( ! currentRole ) throw new Error( 'Portfolio member does not exist' );
      Portfolio.assertAtLeastOneOwner( tx, portfolioId, currentRole );

      const result = tx.prepare( 'DELETE FROM portfolio_members WHERE portfolio_id = ? AND user_id = ?' )
        .run( portfolioId, memberId );

      if ( ! result.changes ) throw new Error( 'Portfolio member does not exist' );
    } );
  }
}
