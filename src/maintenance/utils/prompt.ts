import { ui } from '@/src/maintenance/utils/ui';
import { createInterface } from 'node:readline/promises';


const assertInteractive = () : void => {
  if ( ! process.stdin.isTTY || ! process.stdout.isTTY ) throw new Error( 'Interactive input requires a terminal' );
};


export const prompt = async ( message: string, defaultValue?: string ) : Promise< string > => {
  assertInteractive();

  const rl = createInterface( { input: process.stdin, output: process.stdout } );
  const question = `${ message }${ defaultValue !== undefined ? ui.muted( ` [${ defaultValue }]` ) : '' } `;

  try { return ( await rl.question( question ) ).trim() || defaultValue || '' }
  finally { rl.close() }
};
