import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { assertId, normalizeString, validateEnum } from '@/src/server/utils';
import type { PersonCreateData, PersonGender, PersonRecord, PersonRow, PersonUpdateData } from '@/src/shared/types/person';


export class Person {
  private static getRow ( personId: string, userId?: string ) : PersonRow | null {
    assertId( personId, 'person' );

    return as< PersonRow | null >( conn().prepare(
      `SELECT * FROM persons WHERE id = ?${ userId ? ' AND user_id = ?' : '' }`
    ).get( ...( userId ? [ personId, userId ] : [ personId ] ) ) );
  }
}
