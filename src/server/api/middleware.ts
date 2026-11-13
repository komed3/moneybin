import { Auth } from '@/src/server/core/Auth';
import type { ErrorRequestHandler, Request, RequestHandler } from 'express';


export function getToken ( req: Request ) : string | null {
  const bearer = req.get( 'authorization' )?.match( /^Bearer\s+(\S+)$/i )?.[ 1 ];
  if ( bearer ) return bearer;

  return req.headers.cookie?.match( /(?:^|;\s*)moneybin\.session=([^;]*)/ )?.[ 1 ] ?? null;
}
