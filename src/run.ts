import express from 'express';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';


const __dirname = dirname( fileURLToPath( import.meta.url ) );


async function run () : Promise< void > {
  const app = express();

  app.disable( 'x-powered-by' );
  app.use( express.json( { limit: '32kb' } ) );
  app.use( express.urlencoded( { extended: true, limit: '32kb' } ) );
}


run().catch( err => {
  console.error( '[MoneyBin] Failed to start:', err );
  process.exitCode = 1;
} );
