import express from 'express';
import type { Server } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';


const __dirname = dirname( fileURLToPath( import.meta.url ) );


async function run () : Promise< void > {
  const app = express();

  app.disable( 'x-powered-by' );
  app.use( express.json( { limit: '32kb' } ) );
  app.use( express.urlencoded( { extended: true, limit: '32kb' } ) );


  // --- react ---

  let server: Server | undefined, vite: ViteDevServer | undefined;

  if ( process.env.NODE_ENV === 'dev' ) {
    const { createServer } = await import( 'vite' );

    vite = await createServer( {
      configFile: resolve( process.cwd(), 'vite.config.ts' ),
      server: { middlewareMode: true }, appType: 'spa'
    } );

    app.use( vite.middlewares );
  } else {
    const clientDist = resolve( __dirname, '../client' );
    app.use( express.static( clientDist, { index: false, redirect: false } ) );

    app.use( ( req, res, next ) => {
      if ( req.method !== 'GET' && req.method !== 'HEAD' ) return next();
      res.sendFile( join( clientDist, 'index.html' ) );
    } );
  }
}


run().catch( err => {
  console.error( '[MoneyBin] Failed to start:', err );
  process.exitCode = 1;
} );
