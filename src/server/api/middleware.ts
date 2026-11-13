import { Auth } from '@/src/server/core/Auth';
import type { ErrorRequestHandler, RequestHandler } from 'express';


export const requireAuth: RequestHandler = ( req, res, next ) => {
  const token = req.get( 'authorization' )?.match( /^Bearer\s+(\S+)$/i )?.[ 1 ];
  const user = Auth.validateSession( token );

  if ( ! user ) return res.status( 401 ).json( { error: 'Authentication required' } );

  res.locals.user = user;
  next();
};


export const errorHandler: ErrorRequestHandler = ( err, _, res, next ) => {
  if ( res.headersSent ) return next( err );

  const message = err instanceof Error ? err.message : '';
  const status = Number(
    ( err as { status?: number; statusCode?: number } )?.status ??
    ( err as { statusCode?: number } )?.statusCode
  );

  if ( status >= 400 && status < 600 ) return res.status( status ).json( {
    error: status < 500 ? message : 'Internal server error'
  } );

  if ( /invalid username or password/i.test( message ) ) return res.status( 401 ).json( { error: message } );
  if ( /does not exist|not found/i.test( message ) ) return res.status( 404 ).json( { error: message } );

  if ( /only portfolio owners|only portfolio owners and editors|not a portfolio member/i.test( message ) )
    return res.status( 403 ).json( { error: message } );

  if ( /invalid|must |required|cannot|already|minimum|maximum|outside|exceeds|below/i.test( message ) )
    return res.status( 400 ).json( { error: message } );

  res.status( 500 ).json( { error: 'Internal server error' } );
};
