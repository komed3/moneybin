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
