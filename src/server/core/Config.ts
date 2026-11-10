import { normalizeString, validateBoolean, validateEnum, validateNumber } from '@/src/server/utils';
import type { ConfigName, ConfigSchema, ConfigTable, ConfigValue } from '@/src/shared/types/config';
import dotenv from 'dotenv';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';


const nodeEnv = process.env.NODE_ENV;
dotenv.config( { override: true, quiet: true } );
if ( nodeEnv !== undefined ) process.env.NODE_ENV = nodeEnv;


export class Config {
  public static readonly schema = {
    APP_NAME: { type: 'string', desc: 'Platform name', default: 'MoneyBin' },
    APP_DEFAULT_LANG: { type: 'enum', desc: 'Default language', default: 'en', values: [ 'en', 'de' ] },
    NODE_ENV: { type: 'enum', desc: 'Runtime environment', default: 'dev', values: [ 'dev', 'development', 'test', 'prod', 'production' ] },
    ID_LENGTH: { type: 'integer', desc: 'Length of generated IDs', default: 7, min: 5, max: 32 },

    HOST: { type: 'string', desc: 'HTTP bind address', default: '0.0.0.0' },
    PORT: { type: 'integer', desc: 'HTTP port', default: 3000, min: 1, max: 65535 },

    DB_PATH: { type: 'path', desc: 'SQLite database path', default: 'data/moneybin.sqlite' },
    DB_BUSY_TIMEOUT_MS: { type: 'integer', desc: 'SQLite busy timeout', default: 5000, min: 0, max: 60000 },

    SESSION_LIFETIME_MS: { type: 'integer', desc: 'Session lifetime', default: 2592e6, min: 60000, max: 31536e6 },
    PASSWORD_STRICT: { type: 'boolean', desc: 'Enforce strong password requirements', default: true }
  } satisfies ConfigTable;

  private static isName ( name: string ) : name is ConfigName {
    return Object.hasOwn( this.schema, name );
  }

  public static resolveName ( name: string ) : ConfigName {
    if ( ! this.isName( name ) ) throw new Error( `Unknown configuration key: ${ name }` );
    return name;
  }

  public static validate < K extends ConfigName > ( name: K, value: unknown ) : ConfigValue< K > {
    const key = this.resolveName( name ), def = this.schema[ key ];
    if ( def.type === 'boolean' ) return validateBoolean( value, key, true ) as ConfigValue< K >;
    if ( def.type === 'integer' ) return validateNumber( value, key, def.min, def.max, def.type === 'integer', true ) as ConfigValue< K >;

    const parsed = normalizeString( value, key );
    if ( def.type === 'enum' ) return validateEnum( parsed, key, def.values ) as ConfigValue< K >;

    return ( def.type === 'path' ? key === 'DB_PATH' && parsed === ':memory:' ? parsed : resolve( parsed ) : parsed ) as ConfigValue< K >;
  }
}
