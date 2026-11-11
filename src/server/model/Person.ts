import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { assertId, normalizeString, validateEnum } from '@/src/server/utils';
import type { PersonCreateData, PersonGender, PersonRecord, PersonRow, PersonUpdateData } from '@/src/shared/types/person';
import { SQLInputValue } from 'node:sqlite';


const COLS = {
  name: 'name', description: 'description', gender: 'gender', birthDate: 'birth_date', street: 'street',
  addressExtra: 'address_extra', postalCode: 'postal_code', city: 'city', region: 'region', country: 'country',
  email: 'email', phone: 'phone', website: 'website', notes: 'notes'
};


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

  private static validate ( data: PersonCreateData | PersonUpdateData ) : void {
    if ( data.name !== undefined ) data.name = normalizeString( data.name, 'Name' );
    if ( data.description !== undefined ) data.description = normalizeString( data.description, 'Description' );
    if ( data.gender !== undefined ) data.gender = validateEnum< PersonGender >( data.gender, 'gender', [ 'male', 'female', 'diverse' ] );
    if ( data.birthDate !== undefined ) data.birthDate = normalizeString( data.birthDate, 'Birth date' );
    if ( data.street !== undefined ) data.street = normalizeString( data.street, 'Street' );
    if ( data.addressExtra !== undefined ) data.addressExtra = normalizeString( data.addressExtra, 'Address extra' );
    if ( data.postalCode !== undefined ) data.postalCode = normalizeString( data.postalCode, 'Postal code' );
    if ( data.city !== undefined ) data.city = normalizeString( data.city, 'City' );
    if ( data.region !== undefined ) data.region = normalizeString( data.region, 'Region' );
    if ( data.country !== undefined ) data.country = normalizeString( data.country, 'Country' );
    if ( data.email !== undefined ) data.email = normalizeString( data.email, 'Email' );
    if ( data.phone !== undefined ) data.phone = normalizeString( data.phone, 'Phone' );
    if ( data.website !== undefined ) data.website = normalizeString( data.website, 'Website' );
    if ( data.notes !== undefined ) data.notes = normalizeString( data.notes, 'Notes' );
  }

  public static list ( userId: string ) : PersonRecord[] {
    User.assertUserIdSafe( userId );

    return as< PersonRow[] >( conn().prepare(
      'SELECT * FROM persons WHERE user_id = ? ORDER BY name COLLATE NOCASE'
    ).all( userId ) ).map( Person.toRecord );
  }

  public static get ( personId: string, userId: string ) : PersonRecord | null {
    User.assertUserIdSafe( userId );

    const row = Person.getRow( personId, userId );
    return row ? Person.toRecord( row ) : null;
  }

  public static getSafe ( personId: string, userId?: string ) : PersonRecord {
    const row = Person.getRow( personId, userId );
    if ( ! row ) throw new Error( `Person ${ personId } does not exist${ userId ? ' or is not assigned to this user' : '' }` );
    return Person.toRecord( row );
  }

  public static create ( userId: string, data: PersonCreateData ) : PersonRecord {
    User.assertUserIdSafe( userId );

    const name = Person.validateName( data.name );
    const gender = Person.validateGender( data.gender );

    const id = db.createWithId( id => {
      conn().prepare( `
        INSERT INTO persons (
          id, user_id, name, description, gender, birth_date,
          street, address_extra, postal_code, city, region, country,
          email, phone, website, notes
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
      ` ).run(
        id, userId, name, data.description ?? null, gender, data.birthDate ?? null,
        data.street ?? null, data.addressExtra ?? null, data.postalCode ?? null,
        data.city ?? null, data.region ?? null, data.country ?? null,
        data.email ?? null, data.phone ?? null, data.website ?? null, data.notes ?? null
      );

      return id;
    } );

    return Person.getSafe( id, userId );
  }

  public static update ( personId: string, userId: string, data: PersonUpdateData ) : PersonRecord {
    const person = Person.getSafe( personId, userId ), updates = { ...data };

    if ( updates.name !== undefined ) updates.name = Person.validateName( updates.name );
    if ( updates.gender !== undefined ) updates.gender = Person.validateGender( updates.gender );

    const entries = Object.entries( COLUMNS ).filter(
      ( [ key ] ) => updates[ key as keyof PersonUpdateData ] !== undefined
    );

    if ( ! entries.length ) return person;

    const values = entries.map( ( [ key ] ) => updates[ key as keyof PersonUpdateData ] );

    const result = conn().prepare( `
      UPDATE persons
      SET ${ entries.map( ( [ , column ] ) => `${ column } = ?` ).join( ', ' ) },
          updated_at = strftime( '%Y-%m-%dT%H:%M:%fZ', 'now' )
      WHERE id = ? AND user_id = ?
    ` ).run( ...values as SQLInputValue[], personId, userId );

    if ( ! result.changes ) throw new Error( 'Person does not exist or is not assigned to this user' );
    return Person.getSafe( personId, userId );
  }

  public static delete ( personId: string, userId: string ) : void {
    Person.getSafe( personId, userId );
    const result = conn().prepare( 'DELETE FROM persons WHERE id = ? AND user_id = ?' ).run( personId, userId );
    if ( ! result.changes ) throw new Error( 'Person does not exist or is not assigned to this user' );
  }
}
