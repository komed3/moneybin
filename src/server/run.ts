import { api } from '@/src/server/api';
import { errorHandler } from '@/src/server/api/middleware';
import { Config } from '@/src/server/core/Config';
import { db } from '@/src/server/core/Database';
import express from 'express';
import type { Server } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';


const __dirname = dirname( fileURLToPath( import.meta.url ) );


async function run () : Promise< void > {
  const host = Config.get( 'HOST' ), port = Config.get( 'PORT' ), env = Config.get( 'NODE_ENV' );
  const app = express();

  let server: Server | undefined, vite: ViteDevServer | undefined;

  app.disable( 'x-powered-by' );
  app.use( express.json( { limit: '32kb' } ) );
  app.use( express.urlencoded( { extended: true, limit: '32kb' } ) );
  app.use( '/api', api );
  app.use( errorHandler );


  // --- react ---

  if ( [ 'dev', 'development', 'test' ].includes( env ) ) {
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


  // --- start ---

  db.open();
  server = app.listen( port, host );

  await new Promise< void >( ( resolve, reject ) => {
    server.once( 'listening', resolve ), server.once( 'error', reject );
  } );

  console.info( `[MoneyBin] Server listening on ${ host }:${ port }` );


  // --- shutdown ---

  let shuttingDown = false;

  const shutdown = async () => {
    if ( shuttingDown ) return;
    shuttingDown = true;

    console.info( '[MoneyBin] Shutting down...' );

    try {
      if ( server?.listening ) await new Promise< void >( ( resolve, reject ) => {
        server.close( err => err ? reject( err ) : resolve() );
      } );

      await vite?.close();
      db.close();

      console.info( '[MoneyBin] Server stopped.' );
    } catch ( err ) {
      console.error( '[MoneyBin] Shutdown failed:', err );
      process.exitCode = 1;
    }
  };

  process.once( 'SIGINT', () => void shutdown() );
  process.once( 'SIGTERM', () => void shutdown() );
}


run().catch( err => {
  console.error( '[MoneyBin] Failed to start:', err );
  db.close();
  process.exitCode = 1;
} );
