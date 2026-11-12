import { Config } from '@/src/server/core/Config';
import { as, conn, db } from '@/src/server/core/Database';
import { User } from '@/src/server/core/User';
import { parseEnum, parseString } from '@/src/server/utils';
import type { UserPrefName, UserPrefRow, UserPrefSchema, UserPrefTable, UserPrefValue } from '@/src/shared/types/prefs';


export class UserPrefs {
  public static readonly schema = {
    APP_LANGUAGE: {
      type: 'enum', desc: 'Application language', default: Config.get( 'APP_DEFAULT_LANG' ),
      values: [ 'en', 'de' ]
    },
    DEFAULT_CURRENCY: {
      type: 'enum', desc: 'Default currency for new portfolios', default: Config.get( 'APP_DEFAULT_CURRENCY' ),
      values: [ 'EUR', 'USD', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'PLN' ]
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
    return parseEnum( value, key, def.values! ) as UserPrefValue< K >;
  }
}
