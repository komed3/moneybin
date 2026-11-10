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

  private static toRecord ( row: PersonRow ) : PersonRecord {
    return {
      id: row.id, userId: row.user_id, name: row.name, description: row.description, gender: row.gender,
      birthDate: row.birth_date, street: row.street, addressExtra: row.address_extra, postalCode: row.postal_code,
      city: row.city, region: row.region, country: row.country, email: row.email, phone: row.phone,
      website: row.website, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  private static validateName ( name: string ) : string {
    return normalizeString( name, 'Name' );
  }

  private static validateGender ( gender: unknown ) : PersonGender {
    return validateEnum( gender, 'gender', [ 'male', 'female', 'diverse' ] );
  }

  public static list ( userId: string ) : PersonRecord[] {
    User.assertUserIdSafe( userId );

    return as< PersonRow[] >( conn().prepare(
      'SELECT * FROM persons WHERE user_id = ? ORDER BY name COLLATE NOCASE'
    ).all( userId ) ).map( Person.toRecord );
  }
}
