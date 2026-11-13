import { requireAuth } from '@/src/server/api/middleware';
import { Auth } from '@/src/server/core/Auth';
import { Config } from '@/src/server/core/Config';
import { User } from '@/src/server/core/User';
import { Router } from 'express';


export const auth = Router();


auth.get( '/env', ( _, res ) => res.json( {
  appName: Config.get( 'APP_NAME' ),
  defaultLanguage: Config.get( 'APP_DEFAULT_LANG' ),
  defaultCurrency: Config.get( 'APP_DEFAULT_CURRENCY' ),
  passwordStrict: Config.get( 'PASSWORD_STRICT' )
} ) );

auth.post( '/login', async ( req, res ) => res.json(
  await Auth.login( req.body?.username, req.body?.password )
) );

auth.post( '/logout', requireAuth, ( req, res ) => {
  Auth.logout( req.get( 'authorization' )?.match( /^Bearer\s+(\S+)$/i )?.[ 1 ] );
  res.status( 204 ).end();
} );

auth.get( '/me', requireAuth, ( _, res ) => res.json( { user: res.locals.user } ) );

auth.patch( '/me', requireAuth, ( req, res ) => res.json(
  User.changeUsername( res.locals.user.id, req.body?.username )
) );

auth.put( '/password', requireAuth, async ( req, res ) => {
  await User.changePassword( res.locals.user.id, req.body?.newPassword, req.body?.currentPassword );
  res.status( 204 ).end();
} );
