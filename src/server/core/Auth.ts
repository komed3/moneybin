import { Config } from '@/src/server/core/Config';
import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import type { ActiveSession, AuthResult, SessionRow } from '@/src/shared/types/auth';
import type { UserRecord } from '@/src/shared/types/user';
import { createHash, randomBytes } from 'node:crypto';


export class Auth {
  private static hashToken ( token: string ) : string {
    return createHash( 'sha256' ).update( token ).digest( 'hex' );
  }

  public static async login ( username: string, pw: string ) : Promise< AuthResult > {
    const user = User.getByUsername( username );
    if ( ! user || ! await User.verifyPassword( user.id, pw ) ) throw new Error( 'Invalid username or password' );

    const token = randomBytes( 32 ).toString( 'base64url' );
    const now = new Date(), createdAt = now.toISOString();
    const expiresAt = new Date( now.getTime() + Config.get( 'SESSION_LIFETIME_MS' ) ).toISOString();

    db.transaction( tx => {
      tx.prepare( 'DELETE FROM sessions WHERE expires_at <= ?' ).run( createdAt );

      db.createWithId( id => tx.prepare( `
        INSERT INTO sessions ( id, user_id, token_hash, created_at, expires_at, last_seen_at )
        VALUES ( ?, ?, ?, ?, ?, ? )
      ` ).run( id, user.id, Auth.hashToken( token ), createdAt, expiresAt, createdAt ) );
    } );

    return { token, expiresAt, user };
  }

  public static logout ( token: string | null | undefined ) : void {
    if ( ! token ) return;
    conn().prepare( 'DELETE FROM sessions WHERE token_hash = ?' ).run( Auth.hashToken( token ) );
  }
}
