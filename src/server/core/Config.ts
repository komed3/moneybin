import { Values } from '@/src/server/core/Values';
import { parseBoolean, parseNumber, parseString } from '@/src/server/utils';
import type { ConfigName, ConfigSchema, ConfigTable, ConfigValue } from '@/src/shared/types/config';
import dotenv from 'dotenv';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';


const nodeEnv = process.env.NODE_ENV;
dotenv.config( { override: true, quiet: true } );
if ( nodeEnv !== undefined ) process.env.NODE_ENV = nodeEnv;


export class Config {
  public static readonly schema: ConfigTable = {
    APP_NAME: { type: 'string', desc: 'Platform name', default: 'MoneyBin' },
        APP_DEFAULT_LANG: {
      type: 'string', desc: 'Default language', default: 'en', values: () => Values.languages,
      validate: value => Values.validateLanguage( value, true ) as ConfigValue< 'APP_DEFAULT_LANG' >
    },
    APP_DEFAULT_CURRENCY: {
      type: 'string', desc: 'Default currency', default: 'EUR', values: () => Values.currencyCodes,
      validate: value => Values.validateCurrencyCode( value, true ) as ConfigValue< 'APP_DEFAULT_CURRENCY' >
    },
    NODE_ENV: {
      type: 'string', desc: 'Runtime environment', default: 'dev', values: () => Values.nodeEnvironments,
      validate: value => Values.validateNodeEnvironment( value, true ) as ConfigValue< 'NODE_ENV' >
    },
    ID_LENGTH: { type: 'integer', desc: 'Length of generated IDs', default: 7, min: 5, max: 32 },

    HOST: { type: 'string', desc: 'HTTP bind address', default: '0.0.0.0' },
    PORT: { type: 'integer', desc: 'HTTP port', default: 3000, min: 1, max: 65535 },

    DB_PATH: { type: 'path', desc: 'SQLite database path', default: 'data/moneybin.sqlite' },
    DB_BUSY_TIMEOUT_MS: { type: 'integer', desc: 'SQLite busy timeout', default: 5000, min: 0, max: 60000 },

    QUALITY_DOCUMENTED: { type: 'integer', desc: 'Asset quality factor for documented bookings', default: 100, min: 0, max: 100 },
    QUALITY_RECONSTRUCTED: { type: 'integer', desc: 'Asset quality factor for reconstructed bookings', default: 75, min: 0, max: 100 },
    QUALITY_SPECULATIVE: { type: 'integer', desc: 'Asset quality factor for speculative bookings', default: 25, min: 0, max: 100 },
    QUALITY_ASSUMED: { type: 'integer', desc: 'Asset quality factor for assumed bookings', default: 0, min: 0, max: 100 },

    SESSION_LIFETIME_MS: { type: 'integer', desc: 'Session lifetime', default: 2592e6, min: 60000, max: 31536e6 },
    PASSWORD_STRICT: { type: 'boolean', desc: 'Enforce strong password requirements', default: true }
  };

  private static isName ( name: string ) : name is ConfigName {
    return Object.hasOwn( this.schema, name );
  }

  public static resolveName ( name: string ) : ConfigName {
    if ( ! this.isName( name ) ) throw new Error( `Unknown configuration key: ${ name }` );
    return name;
  }

  public static validate < K extends ConfigName > ( name: K, value: unknown ) : ConfigValue< K > {
    const key = this.resolveName( name ), def = this.schema[ key ];

    if ( def.type === 'boolean' ) return parseBoolean( value ?? '', key ) as ConfigValue< K >;
    if ( def.type === 'integer' ) return parseNumber( value ?? NaN, key, def.min, def.max ) as ConfigValue< K >;

    const parsed = parseString( value ?? '', key ) ?? '';
    if ( def.validate ) return def.validate( parsed ) as ConfigValue< K >;

    return ( def.type === 'path' ? key === 'DB_PATH' && parsed === ':memory:'
      ? parsed : resolve( parsed ) : parsed ) as ConfigValue< K >;
  }

  public static get < K extends ConfigName > ( name: K ) : ConfigValue< K > {
    const key = this.resolveName( name );
    return this.validate( key, process.env[ key ] ?? this.schema[ key ].default ) as ConfigValue< K >;
  }

  public static set < K extends ConfigName > ( name: K, value: ConfigValue< K > ) : ConfigValue< K > {
    const key = this.resolveName( name ), parsed = this.validate( key, value ) as ConfigValue< K >;
    const file = resolve( '.env' );
    const lines = ( existsSync( file ) ? readFileSync( file, 'utf8' ) : '' ).split( /\r?\n/ );
    const pattern = new RegExp( `^\\s*(?:export\\s+)?${ key }\\s*=` );
    const matches = lines.reduce( ( idx, l, i ) => pattern.test( l ) ? [ ...idx, i ] : idx, [] as number[] );
    const line = `${ key }=${ JSON.stringify( parsed ) }`;

    if ( matches.length ) {
      lines[ matches[ 0 ] ] = line;
      for ( const index of matches.slice( 1 ).reverse() ) lines.splice( index, 1 );
    } else lines.push( line );

    writeFileSync( file, `${ lines.filter( line => line.trim() !== '' ).join( '\n' ) }\n`, { mode: 0o600 } );
    chmodSync( file, 0o600 );
    process.env[ key ] = String( parsed );

    return parsed;
  }

  public static reset ( name: ConfigName ) : void {
    const key = this.resolveName( name );
    this.set( key, this.schema[ key ].default as ConfigValue< typeof key > );
  }

  public static all () : ConfigSchema {
    const values = Object.create( null ) as Record< ConfigName, ConfigSchema[ ConfigName ] >;
    for ( const key of Object.keys( this.schema ) as ConfigName[] ) values[ key ] = this.get( key );
    return values as ConfigSchema;
  }
}
