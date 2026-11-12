import { Config } from '@/src/server/core/Config';
import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { Values } from '@/src/server/core/Values';
import { parseString } from '@/src/server/utils';
import type { UserPrefName, UserPrefRow, UserPrefSchema, UserPrefTable, UserPrefValue } from '@/src/shared/types/prefs';


export class UserPrefs {
  public static readonly schema = {
    APP_LANGUAGE: {
      type: 'string', desc: 'Application language', default: Config.get( 'APP_DEFAULT_LANG' ),
      validate: Values.validateLanguage
    },
    DEFAULT_CURRENCY: {
      type: 'string', desc: 'Default currency for new portfolios',
      default: Config.get( 'APP_DEFAULT_CURRENCY' ), validate: Values.validateCurrencyCode
    }
  } satisfies UserPrefTable;

  private static isName ( name: string ) : name is UserPrefName {
    return Object.hasOwn( this.schema, name );
  }

  public static resolveName ( name: string ) : UserPrefName {
    if ( ! this.isName( name ) ) throw new Error( `Unknown preference key: ${ name }` );
    return name;
  }

  private static parseValue < K extends UserPrefName > ( name: K, valueJson: string | null ) : UserPrefValue< K > {
    let value: unknown;

    try { value = JSON.parse( valueJson ?? '' ) }
    catch { throw new Error( `Stored preference ${ name } contains invalid JSON` ) }

    return this.validate( name, value );
  }

  public static validate < K extends UserPrefName > ( name: K, value: unknown ) : UserPrefValue< K > {
    const key = this.resolveName( name ), def = this.schema[ key ];
    return def.validate( parseString( value ?? '', key ) ?? '' ) as UserPrefValue< K >;
  }

  public static get < K extends UserPrefName > ( userId: string, name: K ) : UserPrefValue< K > {
    User.assertUserIdSafe( userId );

    const key = this.resolveName( name ), row = as< UserPrefRow | null >( conn().prepare(
      'SELECT * FROM user_preferences WHERE user_id = ? AND key = ?'
    ).get( userId, key ) );

    return ( row ? this.parseValue( key, row.value ) : this.schema[ key ].default ) as UserPrefValue< K >;
  }

  public static all ( userId: string ) : UserPrefSchema {
    User.assertUserIdSafe( userId );

    const result = Object.fromEntries( Object.entries( this.schema )
      .map( ( [ n, d ] ) => [ n, d.default ] ) ) as unknown as UserPrefSchema;

    const rows = as< UserPrefRow[] >( conn().prepare(
      'SELECT * FROM user_preferences WHERE user_id = ?'
    ).all( userId ) );

    for ( const row of rows ) {
      if ( ! this.isName( row.key ) ) continue;

      const key = this.resolveName( row.key );
      Object.assign( result, { [ key ]: this.parseValue( key, row.value ) } );
    }

    return result;
  }

  public static set < K extends UserPrefName > (
    userId: string, name: K, value: UserPrefValue< K >
  ) : UserPrefValue< K > {
    User.assertUserIdSafe( userId );

    const key = this.resolveName( name );
    const parsed = this.validate( key, value ) as UserPrefValue< K >;

    db.createWithId( id => conn().prepare( `
      INSERT INTO user_preferences ( id, user_id, key, value )
      VALUES ( ?, ?, ?, ? )
      ON CONFLICT ( user_id, key ) DO UPDATE SET
        value = excluded.value
    ` ).run( id, userId, key, JSON.stringify( parsed ) ) );

    return parsed;
  }

  public static reset ( userId: string, name: UserPrefName ) : boolean {
    User.assertUserIdSafe( userId );

    const key = this.resolveName( name );
    const result = conn().prepare(
      'DELETE FROM user_preferences WHERE user_id = ? AND key = ?'
    ).run( userId, key );

    return Number( result.changes ) > 0;
  }

  public static resetAll ( userId: string ) : number {
    User.assertUserIdSafe( userId );
    const result = conn().prepare( 'DELETE FROM user_preferences WHERE user_id = ?' ).run( userId );
    return Number( result.changes );
  }
}
