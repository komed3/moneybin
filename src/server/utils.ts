import { randomInt } from 'node:crypto';


const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';


export function generateId ( length: number ) : string {
  if ( ! Number.isInteger( length ) || length < 5 || length > 32 ) throw new Error( `Invalid ID length: ${ length }` );
  return Array.from( { length }, () => ID_ALPHABET[ randomInt( ID_ALPHABET.length ) ] ).join( '' );
}

export function assertId ( id: string, label: string ) : void {
  if ( typeof id !== 'string' || ! /^[a-zA-Z0-9]{5,32}$/.test( id ) )
    throw new Error( `Invalid ${ label } ID: ${ id }` );
}

export function normalizeString ( value: unknown, label: string ) : string {
  if ( typeof value !== 'string' || ! value.trim() || value.includes( '\0' ) )
    throw new Error( `${ label } must not be empty` );

  return value.trim();
}

export function validateBoolean ( value: unknown, label: string, coerce = false ) : boolean {
  if ( typeof value === 'boolean' ) return value;

  if ( coerce && typeof value === 'string' ) {
    const parsed = value.trim().toLowerCase();

    if ( parsed === 'true' || parsed === '1' ) return true;
    if ( parsed === 'false' || parsed === '0' ) return false;
  }

  if ( coerce && ( value === 0 || value === 1 ) ) return !! value;
  throw new Error( `${ label } must be true or false` );
}

export function validateNumber ( value: unknown, label: string, min: number, max: number, integer = false, coerce = false ) : number {
  const parsed = typeof value === 'number' ? value : coerce && typeof value === 'string' && value.trim() ? Number( value ) : NaN;

  if ( ! Number.isFinite( parsed ) || ( integer && ! Number.isInteger( parsed ) ) || parsed < min || parsed > max )
    throw new Error( `${ label } must be ${ integer ? 'an integer' : 'a number' } between ${ min } and ${ max }` );

  return parsed;
}
