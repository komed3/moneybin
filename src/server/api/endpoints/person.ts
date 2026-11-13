import { Person } from '@/src/server/model/Person';
import { Router } from 'express';


export const person = Router();


person.get( '/', ( _, res ) => res.json( Person.list( res.locals.user.id ) ) );

person.post( '/', ( req, res ) => {
  const person = Person.create( res.locals.user.id, req.body );
  res.status( 201 ).json( person );
} );

person.get< { id: string } >( '/:id', ( req, res ) => res.json(
  Person.getSafe( req.params.id, res.locals.user.id )
) );

person.patch< { id: string } >( '/:id', ( req, res ) => res.json(
  Person.update( req.params.id, res.locals.user.id, req.body )
) );

person.delete< { id: string } >( '/:id', ( req, res ) => {
  Person.delete( req.params.id, res.locals.user.id );
  res.status( 204 ).end();
} );
