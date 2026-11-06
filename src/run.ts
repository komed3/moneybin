import express from 'express';
import type { Server } from 'node:http';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';


const __dirname = dirname( fileURLToPath( import.meta.url ) );


async function run () : Promise< void > {
  const app = express();

  app.disable( 'x-powered-by' );
  app.use( express.json( { limit: '32kb' } ) );
  app.use( express.urlencoded( { extended: true, limit: '32kb' } ) );

  let server: Server | undefined, vite: ViteDevServer | undefined;
}


run().catch( err => {
  console.error( '[MoneyBin] Failed to start:', err );
  process.exitCode = 1;
} );
