import { randomInt } from 'node:crypto';


const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';


export function generateId ( length: number ) : string {
  if ( ! Number.isInteger( length ) || length < 5 || length > 32 ) throw new Error( `Invalid ID length: ${ length }` );
  return Array.from( { length }, () => ID_ALPHABET[ randomInt( ID_ALPHABET.length ) ] ).join( '' );
}

export function assertId ( value: string | undefined, label: string ) : string | undefined;
export function assertId ( value: string | null | undefined, label: string, nullable: true ) : string | null | undefined;
export function assertId ( value: unknown, label: string, nullable = false ) : string | null | undefined {
  if ( value === undefined || ( nullable && value === null ) ) return value;
  if ( typeof value !== 'string' || ! /^[a-zA-Z0-9]{5,32}$/.test( value ) ) throw new Error( `Invalid ${ label } ID` );

  return value;
}

export function parseString ( value: unknown, label: string ) : string | undefined;
export function parseString ( value: unknown, label: string, nullable: true ) : string | null | undefined;
export function parseString ( value: unknown, label: string, nullable = false ) : string | null | undefined {
  if ( value === undefined || ( nullable && value === null ) ) return value;
  if ( typeof value !== 'string' || ! value.trim() || value.includes( '\0' ) ) throw new Error( `${ label } must not be empty` );
  return value.trim();
}

export function parseBoolean ( value: unknown, label: string ) : boolean | undefined {
  if ( value === undefined ) return undefined;
  if ( typeof value === 'boolean' ) return value;

  if ( typeof value === 'string' ) {
    const parsed = value.trim().toLowerCase();

    if ( parsed === 'true' || parsed === '1' ) return true;
    if ( parsed === 'false' || parsed === '0' ) return false;
  }

  if ( value === 0 || value === 1 ) return !! value;
  throw new Error( `${ label } must be true or false` );
}

export function parseNumber ( value: unknown, label: string, min: number, max: number, nullable = false ) : number | null | undefined {
  if ( value === undefined || ( nullable && value === null ) ) return value;

  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number( value ) : NaN;

  if ( ! Number.isSafeInteger( parsed ) || parsed < min || parsed > max )
    throw new Error( `${ label } must be an integer between ${ min } and ${ max }` );

  return parsed;
}

export function parseDate ( value: unknown, label: string ) : string | undefined;
export function parseDate ( value: unknown, label: string, nullable: true ) : string | null | undefined;
export function parseDate ( value: unknown, label: string, nullable = false ) : string | null | undefined {
  if ( value === undefined || ( nullable && value === null ) ) return value;
  if ( typeof value !== 'string' || ! /^\d{4}-\d{2}-\d{2}$/.test( value ) ) throw new Error( `${ label } must be a valid date` );

  const date = new Date( `${ value }T00:00:00.000Z` );
  if ( Number.isNaN( date.getTime() ) || date.toISOString().slice( 0, 10 ) !== value ) throw new Error( `${ label } must be a valid date` );

  return value;
}

export function parseEnum < T extends string > ( value: unknown, label: string, values: readonly T[] ) : T | undefined {
  if ( value === undefined ) return undefined;
  if ( typeof value !== 'string' || ! values.includes( value as T ) ) throw new Error( `Invalid value for ${ label }: ${ String( value ) }` );
  return value as T;
}
