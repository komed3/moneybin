import { UserPrefs } from '@/src/server/core/Prefs';
import type { UserPrefName } from '@/src/shared/types/prefs';
import { Router } from 'express';


export const prefs = Router();


prefs.get( '/', ( _, res ) => res.json( UserPrefs.all( res.locals.user.id ) ) );

prefs.patch< { name: string } >( '/:name', ( req, res ) => {
  const name = UserPrefs.resolveName( req.params.name );
  res.json( UserPrefs.set( res.locals.user.id, name, req.body?.value ) );
} );

prefs.delete< { name: string } >( '/:name', ( req, res ) => {
  UserPrefs.reset( res.locals.user.id, req.params.name as UserPrefName );
  res.status( 204 ).end();
} );

prefs.delete( '/', ( _, res ) => {
  UserPrefs.resetAll( res.locals.user.id );
  res.status( 204 ).end();
} );
