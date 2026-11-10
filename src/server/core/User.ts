import { Config } from '@/src/server/core/Config';
import { as, conn, db } from '@/src/server/core/Database';
import { assertId } from '@/src/server/utils';
import type { UserRecord, UserRow } from '@/src/shared/types/user';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';


export class User {
  private static getRow ( userId: string ) : UserRow | null {
    assertId( userId, 'user' );
    return as< UserRow | null >( conn().prepare( 'SELECT * FROM users WHERE id = ?' ).get( userId ) );
  }

  private static toRecord ( row: UserRow ) : UserRecord {
    return { id: row.id, username: row.username, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  private static hashPassword ( pw: string ) : Promise< string > {
    const salt = randomBytes( 16 );

    return new Promise( ( resolve, reject ) => {
      scrypt( pw, salt, 64, ( err, key ) => {
        if ( err ) return reject( err );
        resolve( `scrypt$${ salt.toString( 'base64url' ) }$${ key.toString( 'base64url' ) }` );
      } );
    } );
  }

  private static async verifyHash ( pw: string, hash: string ) : Promise< boolean > {
    const [ algorithm, saltValue, keyValue ] = hash.split( '$' );
    if ( algorithm !== 'scrypt' || ! saltValue || ! keyValue ) return false;

    const salt = Buffer.from( saltValue, 'base64url' );
    const expected = Buffer.from( keyValue, 'base64url' );
    if ( salt.length !== 16 || expected.length !== 64 ) return false;

    const actual = await new Promise< Buffer >( ( resolve, reject ) => {
      scrypt( pw, salt, expected.length, ( err, key ) => {
        if ( err ) return reject( err );
        resolve( key );
      } );
    } );

    return timingSafeEqual( actual, expected );
  }

  public static validateUsername ( username: string ) : string {
    const value = username.trim();
    if ( ! value || value.length > 64 ) throw new Error( 'Username must contain between 1 and 64 characters' );
    if ( ! /^[a-zA-Z0-9_]+$/.test( value ) ) throw new Error( 'Username can only contain letters, numbers and underscores' );
    if ( ! /^[a-zA-Z]/.test( value ) ) throw new Error( 'Username must start with a letter' );

    return value;
  }

  public static validatePassword ( pw: string ) : void {
    if ( ! pw ) throw new Error( 'Password must not be empty' );
    if ( ! Config.get( 'PASSWORD_STRICT' ) ) return;

    if ( pw.length < 12 ) throw new Error( 'Password must contain at least 12 characters' );
    if ( ! /[a-z]/.test( pw ) ) throw new Error( 'Password must contain at least one lowercase letter' );
    if ( ! /[A-Z]/.test( pw ) ) throw new Error( 'Password must contain at least one uppercase letter' );
    if ( ! /[0-9]/.test( pw ) ) throw new Error( 'Password must contain at least one number' );
    if ( ! /[^a-zA-Z0-9]/.test( pw ) ) throw new Error( 'Password must contain at least one special character' );
  }

  public static list () : UserRecord[] {
    return as< UserRow[] >( conn().prepare(
      'SELECT * FROM users ORDER BY username COLLATE NOCASE'
    ).all() ).map( User.toRecord );
  }

   public static get ( userId: string ) : UserRecord | null {
    const row = User.getRow( userId );
    return row ? User.toRecord( row ) : null;
  }

  public static getByUsername ( username: string ) : UserRecord | null {
    const row = as< UserRow | null >( conn().prepare(
      'SELECT * FROM users WHERE username = ? COLLATE NOCASE'
    ).get( username.trim() ) );

    return row ? User.toRecord( row ) : null;
  }

  public static async create ( username: string, pw: string ) : Promise< UserRecord > {
    const name = User.validateUsername( username );
    if ( User.getByUsername( name ) ) throw new Error( 'Username is already taken' );

    User.validatePassword( pw );
    const hash = await User.hashPassword( pw );

    const id = db.createWithId( id => {
      conn().prepare( 'INSERT INTO users ( id, username, pw_hash ) VALUES ( ?, ?, ? )' ).run( id, name, hash );
      return id;
    } );

    const user = User.get( id );
    if ( ! user ) throw new Error( 'Failed to create user' );

    return user;
  }
}
