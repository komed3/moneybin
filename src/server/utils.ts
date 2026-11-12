import type { Optional } from '@/src/shared/types/utils';
import { randomInt } from 'node:crypto';


const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';


export function generateId ( length: number ) : string {
  if ( ! Number.isInteger( length ) || length < 5 || length > 32 )
    throw new Error( `Invalid ID length: ${ length }` );

  return Array.from( { length }, () => ID_ALPHABET[ randomInt( ID_ALPHABET.length ) ] ).join( '' );
}

export function assertId < T extends string | null | undefined, N extends boolean = false > (
  value: T, label: string, nullable?: N
) : N extends true ? T : Exclude< T, null > {
  if ( value === undefined || ( nullable && value === null ) )
    return value as N extends true ? T : Exclude< T, null >;

  if ( typeof value !== 'string' || ! /^[a-zA-Z0-9]{5,32}$/.test( value ) )
    throw new Error( `Invalid ${ label } ID` );

  return value as N extends true ? T : Exclude< T, null >;
}

export function parseString < T, N extends boolean = false > (
  value: T, label: string, nullable?: N
) : string | Optional< T, N > {
  if ( value === undefined || ( nullable && value === null ) ) return value as Optional< T, N >;

  if ( typeof value !== 'string' || ! value.trim() || value.includes( '\0' ) )
    throw new Error( `${ label } must not be empty` );

  return value.trim();
}

export function parseBoolean < T > ( value: T, label: string ) : boolean | (
  T extends undefined ? undefined : never
) {
  if ( value === undefined ) return undefined as T extends undefined ? undefined : never;
  if ( typeof value === 'boolean' ) return value;

  if ( typeof value === 'string' ) {
    const parsed = value.trim().toLowerCase();

    if ( parsed === 'true' || parsed === '1' ) return true;
    if ( parsed === 'false' || parsed === '0' ) return false;
  }

  if ( value === 0 || value === 1 ) return !! value;
  throw new Error( `${ label } must be true or false` );
}

export function parseNumber < T, N extends boolean = false > (
  value: T, label: string, min: number, max: number, nullable?: N
) : number | Optional< T, N > {
  if ( value === undefined || ( nullable && value === null ) ) return value as Optional< T, N >;

  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim()
    ? Number( value ) : NaN;

  if ( ! Number.isSafeInteger( parsed ) || parsed < min || parsed > max )
    throw new Error( `${ label } must be an integer between ${ min } and ${ max }` );

  return parsed;
}

export function parseDate < T, N extends boolean = false > (
  value: T, label: string, nullable?: N
) : string | Optional< T, N > {
  if ( value === undefined || ( nullable && value === null ) ) return value as Optional< T, N >;

  if ( typeof value !== 'string' || ! /^\d{4}-\d{2}-\d{2}$/.test( value ) )
    throw new Error( `${ label } must be a valid date` );

  const date = new Date( `${ value }T00:00:00.000Z` );

  if ( Number.isNaN( date.getTime() ) || date.toISOString().slice( 0, 10 ) !== value )
    throw new Error( `${ label } must be a valid date` );

  return value;
}

export function parseEnum < T extends string, R extends boolean = false > (
  value: unknown, label: string, values: readonly T[], required?: R
) : R extends true ? T : T | undefined {
  if ( value === undefined ) {
    if ( required ) throw new Error( `${ label } is required` );
    return undefined as R extends true ? T : T | undefined;
  }

  if ( typeof value !== 'string' || ! values.includes( value as T ) )
    throw new Error( `Invalid value for ${ label }: ${ String( value ) }` );

  return value as R extends true ? T : T | undefined;
}
