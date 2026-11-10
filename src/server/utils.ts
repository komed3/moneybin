import { randomInt } from 'node:crypto';


const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';


export function generateId ( length: number ) : string {
  if ( ! Number.isInteger( length ) || length < 5 || length > 32 ) throw new Error( `Invalid ID length: ${ length }` );
  return Array.from( { length }, () => ID_ALPHABET[ randomInt( ID_ALPHABET.length ) ] ).join( '' );
}
