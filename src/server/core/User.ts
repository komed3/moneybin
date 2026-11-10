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
}
