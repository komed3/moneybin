import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';


const __dirname = dirname( fileURLToPath( import.meta.url ) );


async function run () : Promise< void > {}


run().catch( err => {
  console.error( '[MoneyBin] Failed to start:', err );
  process.exitCode = 1;
} );
