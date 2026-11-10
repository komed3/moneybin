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
}
