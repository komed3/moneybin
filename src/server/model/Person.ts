import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Values } from '@/src/server/core/Values';
import { assertId, parseDate, parseString, toRecord, toRow } from '@/src/server/utils';
import type { PersonCreateData, PersonRecord, PersonRow, PersonUpdateData } from '@/src/shared/types/person';
import type { SQLInputValue } from 'node:sqlite';


const COLS = {
  id: 'id', userId: 'user_id', name: 'name', description: 'description', gender: 'gender',
  birthDate: 'birth_date', street: 'street', addressExtra: 'address_extra', postalCode: 'postal_code',
  city: 'city', region: 'region', country: 'country', email: 'email', phone: 'phone',
  website: 'website', notes: 'notes', createdAt: 'created_at', updatedAt: 'updated_at'
};


export class Person {
  private static getRow ( personId: string, userId: string ) : PersonRow | null {
    assertId( personId, 'person' );
    User.getSafe( userId );

    return as< PersonRow | null >( conn().prepare(
      'SELECT * FROM persons WHERE id = ? AND user_id = ?'
    ).get( personId, userId ) );
  }

  private static toRecord ( row: PersonRow ) : PersonRecord {
    return toRecord< PersonRecord >( row, COLS );
  }

  private static validate ( data: PersonUpdateData ) : void {
    data.name = parseString( data.name, 'Name' );
    data.gender = Values.validatePersonGender( data.gender ) ?? undefined;
    data.description = parseString( data.description, 'Description', true );
    data.birthDate = parseDate( data.birthDate, 'Birth date', true );
    data.street = parseString( data.street, 'Street', true );
    data.addressExtra = parseString( data.addressExtra, 'Address extra', true );
    data.postalCode = parseString( data.postalCode, 'Postal code', true );
    data.city = parseString( data.city, 'City', true );
    data.region = parseString( data.region, 'Region', true );
    data.country = parseString( data.country, 'Country', true );
    data.email = parseString( data.email, 'Email', true );
    data.phone = parseString( data.phone, 'Phone', true );
    data.website = parseString( data.website, 'Website', true );
    data.notes = parseString( data.notes, 'Notes', true );
  }

  public static list ( userId: string ) : PersonRecord[] {
    User.getSafe( userId );

    return as< PersonRow[] >( conn().prepare(
      'SELECT * FROM persons WHERE user_id = ? ORDER BY name COLLATE NOCASE'
    ).all( userId ) ).map( Person.toRecord );
  }

  public static get ( personId: string, userId: string ) : PersonRecord | null {
    const row = Person.getRow( personId, userId );
    return row ? Person.toRecord( row ) : null;
  }

  public static getSafe ( personId: string, userId: string ) : PersonRecord {
    const row = Person.getRow( personId, userId );
    if ( ! row ) throw new Error( `Person ${ personId } does not exist` );

    return Person.toRecord( row );
  }

  public static create ( userId: string, data: PersonCreateData ) : PersonRecord {
    User.getSafe( userId );
    Person.validate( data );

    if ( ! data.name || ! data.gender ) throw new Error( 'Person is missing required fields' );

    const id = db.createWithId( id => {
      conn().prepare( `
        INSERT INTO persons (
          id, user_id, name, description, gender, birth_date,
          street, address_extra, postal_code, city, region, country,
          email, phone, website, notes
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
      ` ).run(
        id, userId, data.name, data.description ?? null, data.gender, data.birthDate ?? null,
        data.street ?? null, data.addressExtra ?? null, data.postalCode ?? null, data.city ?? null,
        data.region ?? null, data.country ?? null, data.email ?? null, data.phone ?? null,
        data.website ?? null, data.notes ?? null
      );

      return id;
    } );

    return Person.getSafe( id, userId );
  }

  public static update ( personId: string, userId: string, data: PersonUpdateData ) : PersonRecord {
    const person = Person.getSafe( personId, userId );
    Person.validate( data );

    const entries = Object.entries( toRow( data, COLS ) );
    if ( ! entries.length ) return person;

    const values = entries.map( ( [ , value ] ) => value );
    const result = conn().prepare( `
      UPDATE persons
      SET ${ entries.map( ( [ column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ? AND user_id = ?
    ` ).run( ...values as SQLInputValue[], personId, userId );

    if ( ! result.changes ) throw new Error( 'Person does not exist' );
    return Person.getSafe( personId, userId );
  }

  public static delete ( personId: string, userId: string ) : void {
    Person.getSafe( personId, userId );
    conn().prepare( 'DELETE FROM persons WHERE id = ? AND user_id = ?' ).run( personId, userId );
  }
}
